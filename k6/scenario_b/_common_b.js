// ============================================
// _common_b.js
// 시나리오 B (메인 서비스 흐름) 전용 공통 로직 모듈
//
// 사용자 여정: 로그인 → 게시물 목록 조회 → 무작위 게시물 상세 3회
// 측정: REST API 응답시간, DB 읽기 부하, 인증 처리량
//
// 모든 부하 단계(Smoke/Load/Stress/Break)에서 재사용.
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

// ─── B 전용 상수 ──────────────────────────
// 검색어: 03_posts.sql 더미데이터의 text 컬럼에 실제 등장하는 단어들
// PostRepositoryImpl.containsSearchText는 post.text에 LIKE 검색하므로
// 텍스트에 없는 단어("맛집", "카페" 등 장소 이름)는 결과 0개가 나옴
//
// 각 단어가 매칭하는 게시물 수: 추천 105, 분위기 68, 좋아 49, 괜찮 32,
// 한적 31, 아침 31, 음식 30, 맛있 30, 디저트 30, 데이트 29, 조용 29,
// 인테리어 29, 야경 27, 가성비 24
export const SEARCH_KEYWORDS = [
  '추천', '분위기', '좋아', '괜찮', '한적',
  '아침', '음식', '맛있', '디저트', '데이트',
  '조용', '야경', '가성비', '인테리어',
];

// 한 사용자가 목록 조회 후 볼 상세 페이지 수
export const DETAIL_VIEW_COUNT = 3;

// 사용자 행동 사이 대기 (생각 시간 모사). 너무 짧으면 비현실적, 너무 길면 부하 부족
export const THINK_TIME_MS = 300;

// ─── 커스텀 메트릭 ────────────────────────
// 시나리오별 비교를 위해 각 단계 응답시간을 별도 메트릭으로 기록
export const listLatency = new Trend('list_latency', true);    // 목록 조회 응답시간
export const detailLatency = new Trend('detail_latency', true); // 상세 조회 응답시간

export const listCalls = new Counter('list_calls');     // 목록 호출 횟수
export const detailCalls = new Counter('detail_calls'); // 상세 호출 횟수

// ─── 메인 시나리오 함수 ────────────────────
export function runMainScenario() {
  // 1. 로그인
  const userId = getRandomUserId();
  const token = login(userId);
  if (!token) return;

  const headers = authHeaders(token);

  // 2. 게시물 목록 조회
  // PostSearchCond.search가 @NotBlank로 필수이므로 검색어 반드시 전달
  // (좌표 파라미터는 서버가 무시함 - 현재 구현 한계)
  const keyword = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
  const listUrl = `${BASE_URL}/api/posts?search=${encodeURIComponent(keyword)}`;

  const listRes = http.get(listUrl, { headers, tags: { name: 'GET /api/posts' } });
  listCalls.add(1);
  listLatency.add(listRes.timings.duration);

  const listOk = check(listRes, {
    '목록 조회 200': (r) => r.status === 200,
    '목록 응답 JSON': (r) => r.json('content') !== undefined,
  });
  if (!listOk) return;

  // 응답 구조: SliceResponse<PostResponse>
  // { "content": [ {id, text, thumbnailImageUrl, likeCount, ...}, ... ], "hasNext": ..., ... }
  const posts = listRes.json('content');

  if (!Array.isArray(posts) || posts.length === 0) {
    // 검색 결과 0개 — 그래도 정상 응답이므로 실패 처리는 안 함, 이번 iteration 종료
    sleep(1);
    return;
  }

  // 사용자가 화면 보고 있는 시간
  sleep(THINK_TIME_MS / 1000);

  // 3. 무작위 게시물 상세 조회 N회
  // 같은 게시물 중복 안 보도록 셔플 후 앞에서 N개
  const shuffled = [...posts].sort(() => Math.random() - 0.5);
  const targets = shuffled.slice(0, Math.min(DETAIL_VIEW_COUNT, shuffled.length));

  for (const post of targets) {
    const postId = post.id;
    const detailUrl = `${BASE_URL}/api/posts/${postId}`;

    const detailRes = http.get(detailUrl, {
      headers,
      tags: { name: 'GET /api/posts/{id}' },
    });
    detailCalls.add(1);
    detailLatency.add(detailRes.timings.duration);

    check(detailRes, {
      '상세 조회 200': (r) => r.status === 200,
      '상세 응답에 places 포함': (r) => {
        try {
          return Array.isArray(r.json('places'));
        } catch (e) {
          return false;
        }
      },
    });

    // 다음 게시물 보기 전 짧은 대기
    sleep(THINK_TIME_MS / 1000);
  }

  // iteration 사이 대기 (A 시나리오와 동일)
  sleep(1);
}
