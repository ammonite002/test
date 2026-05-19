// ============================================
// 시나리오 B - Stress Test
// 목적: 목표 동시 사용자 500명 한계 검증
// stages: 2분간 0→500명, 3분간 500명 유지, 30초 정리
//
// Stress 단계는 thresholds를 느슨하게 (Smoke·Load 대비 마진 적용)
// 목표: 목표를 지키는지 측정. 통과 자체가 목적이 아님.
// ============================================

import { runMainScenario } from './_common_b.js';

export const options = {
  stages: [
    { duration: '2m', target: 500 },
    { duration: '3m', target: 500 },
    { duration: '30s', target: 0 },
  ],

  thresholds: {
    'http_req_failed': ['rate<0.05'],          // 5% 까지 허용
    'http_req_duration': ['p(95)<300'],        // 200→300ms 마진
    'list_latency': ['p(95)<300'],
    'detail_latency': ['p(95)<300'],
    'checks': ['rate>0.90'],                   // 95→90%
  },
};

export default function () {
  runMainScenario();
}
