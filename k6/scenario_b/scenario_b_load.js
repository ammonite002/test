// ============================================
// 시나리오 B - Load Test
// 목적: 일반 부하 (200명) 상황에서 메인 흐름 성능 확인
// stages: 2분간 0→200명 증가, 3분간 200명 유지, 30초 정리
// 통과 기준: 응답시간 목표 준수
// ============================================

import { runMainScenario } from './_common_b.js';

export const options = {
  stages: [
    { duration: '2m', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '30s', target: 0 },
  ],

  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<200'],
    'list_latency': ['p(95)<200'],
    'detail_latency': ['p(95)<200'],
    'checks': ['rate>0.95'],
  },
};

export default function () {
  runMainScenario();
}
