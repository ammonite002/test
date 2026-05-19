// ============================================
// _shared.js
// 모든 시나리오(A 채팅, B 메인흐름, C 게시물생성, D 통합)에서 공유하는 공통 모듈
//
// "정말로 공통인 것"만 둠 — 로그인, BASE_URL, 유저 ID 생성, 인증 헤더 헬퍼.
// 시나리오 특수 로직(WS, STOMP, 게시물 등)은 각 _common_*.js로.
// ============================================

import http from 'k6/http';
import { check } from 'k6';

// ─── 환경 상수 ─────────────────────────────
export const BASE_URL = 'http://13.209.144.78';
export const WS_BASE_URL = 'ws://13.209.144.78';

// ─── 유저 ID 헬퍼 ──────────────────────────
// 더미데이터 100명 (id: 1~100) 중 랜덤 선택
export function getRandomUserId() {
  return Math.floor(Math.random() * 100) + 1;
}

// ─── 로그인 ────────────────────────────────
// 임시 로그인: POST /api/auth/login { userId } → JWT (accessToken)
// 성공 시 토큰 반환, 실패 시 null
export function login(userId) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ userId: userId }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (!check(res, { '로그인 200': (r) => r.status === 200 })) {
    return null;
  }

  return res.json('accessToken');
}

// ─── 인증 헤더 헬퍼 ────────────────────────
// 토큰을 Authorization: Bearer 형태로 감싸기
// extra로 추가 헤더 병합 가능 (예: Content-Type)
export function authHeaders(token, extra = {}) {
  return {
    'Authorization': `Bearer ${token}`,
    ...extra,
  };
}
