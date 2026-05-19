// ============================================
// 시나리오 C - Load Test
// 목적: 일반 부하 (200명) 상황에서 게시물 생성 성능 확인
// stages: 2분간 0→200명 증가, 3분간 200명 유지, 30초 정리
//
// 페이로드: 장소 10개 × 사진 2장씩 = INSERT 31건/요청 (서비스 최대치)
//
// 통과 기준 (쓰기 작업이라 완화):
//   - http p95 < 500ms
//   - create_latency p95 < 500ms
//   - 에러율 < 1%
//   - checks > 95%
// ============================================

import { runCreateScenario } from './_common_c.js';

export const options = {
  stages: [
    { duration: '2m', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '30s', target: 0 },
  ],

  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<500'],
    'create_latency': ['p(95)<500'],
    'checks': ['rate>0.95'],
  },
};

export default function () {
  runCreateScenario();
}
