// ============================================
// _common_c.js
// 시나리오 C (게시물 생성 부하) 전용 공통 로직 모듈
//
// 사용자 여정: 로그인 → POST /api/posts/create (서비스 최대 페이로드)
// 측정: DB 쓰기 처리량, 동시 INSERT 트랜잭션 정합성
//
// 페이로드 — NearBy 서비스 최대 지원 크기:
//   - 장소: 10개
//   - 사진: 총 20장 (장소 10개에 균등 분배 = 장소당 2장)
//
// DB 영향:
//   - posts 1건
//   - post_places 10건
//   - place_photos 20건
//   = INSERT 31건/요청
//
// JSON 본문 크기: 약 5KB
// ============================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

import {
  BASE_URL,
  getRandomUserId,
  login,
  authHeaders,
} from '../_shared.js';

// ─── 페이로드 설정 (서비스 최대 지원치) ───
export const PLACES_PER_POST = 10;
export const PHOTOS_PER_PLACE = 2;  // 총 20장을 10장소에 균등 분배

// ─── 커스텀 메트릭 ────────────────────────
export const createLatency = new Trend('create_latency', true);
export const createCalls = new Counter('create_calls');
export const createdPosts = new Counter('created_posts');

// ─── 페이로드 생성 ────────────────────────
function buildPayload(userId) {
  const seed = Date.now() + Math.floor(Math.random() * 1000);

  // 서울 중심 좌표에 약간씩 흩뿌리기
  const baseLat = 37.5 + (Math.random() - 0.5) * 0.2;
  const baseLng = 127.0 + (Math.random() - 0.5) * 0.2;

  const places = [];
  for (let i = 0; i < PLACES_PER_POST; i++) {
    const photos = [];
    for (let j = 1; j <= PHOTOS_PER_PLACE; j++) {
      photos.push({
        url: `https://nearby-bucket.s3.amazonaws.com/posts/test_${seed}_${i}_${j}.jpg`,
        order: j,
      });
    }
    places.push({
      name: `테스트장소-${seed}-${i}`,
      latitude: baseLat + i * 0.001,
      longitude: baseLng + i * 0.001,
      isKey: i === 0,  // 첫 번째만 핵심 장소
      photos: photos,
    });
  }

  return {
    text: `부하 테스트 게시물 ${seed} - 사용자 ${userId} (장소 ${PLACES_PER_POST}개, 총 사진 ${PLACES_PER_POST * PHOTOS_PER_PLACE}장)`,
    places: places,
  };
}

// ─── 메인 시나리오 함수 ────────────────────
export function runCreateScenario() {
  // 1. 로그인
  const userId = getRandomUserId();
  const token = login(userId);
  if (!token) return;

  // 2. 게시물 생성
  const payload = buildPayload(userId);
  const headers = authHeaders(token, { 'Content-Type': 'application/json' });

  const createRes = http.post(
    `${BASE_URL}/api/posts/create`,
    JSON.stringify(payload),
    { headers, tags: { name: 'POST /api/posts/create' } }
  );
  createCalls.add(1);
  createLatency.add(createRes.timings.duration);

  const ok = check(createRes, {
    '게시물 생성 200': (r) => r.status === 201,
    '응답 body 존재': (r) => r.body && r.body.length > 0,
  });

  if (ok) {
    createdPosts.add(1);
  } else {
    // Smoke 단계에서 실패하면 어떤 응답인지 한 번만 출력 (디버그용)
    if (__ITER === 0 && __VU === 1) {
      console.log(`[DEBUG] status: ${createRes.status}`);
      console.log(`[DEBUG] body: ${(createRes.body || '').substring(0, 500)}`);
    }
  }

  // 사용자 작성 후 잠시 대기
  sleep(1);
}
