// ============================================
// 시나리오 C - Stress Test
// 목적: 목표 동시 사용자 500명 게시물 생성 한계 검증
// stages: 2분간 0→500명, 3분간 500명 유지, 30초 정리
//
// 페이로드: 장소 10개 × 사진 2장씩 = INSERT 31건/요청
//
// Stress 기준 (쓰기는 무거우니 Smoke/Load보다 추가 완화):
//   - http p95 < 1000ms (Smoke/Load 500ms → Stress 1000ms)
//   - create_latency p95 < 1000ms
//   - 에러율 < 5%
//   - checks > 90%
// ============================================

import { runCreateScenario } from './_common_c.js';

export const options = {
  stages: [
    { duration: '2m', target: 500 },
    { duration: '3m', target: 500 },
    { duration: '30s', target: 0 },
  ],

  thresholds: {
    'http_req_failed': ['rate<0.05'],
    'http_req_duration': ['p(95)<1000'],
    'create_latency': ['p(95)<1000'],
    'checks': ['rate>0.90'],
  },
};

export default function () {
  runCreateScenario();
}
