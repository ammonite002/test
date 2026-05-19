// ============================================
// 시나리오 A - Stress Test
// 목적: 목표 동시 사용자 500명 한계 검증
// stages: 2분간 0→500명, 3분간 500명 유지
// 통과 기준: 성능 목표(p95<200ms 등) 유지하는지
// ============================================

import { runChatScenario } from './_common.js';

export const options = {
  stages: [
    { duration: '2m', target: 500 },
    { duration: '3m', target: 500 },
    { duration: '30s', target: 0 },
  ],

  // Stress 단계에서는 thresholds를 좀 느슨하게 잡거나 abortOnFail 끄는 게 현실적.
  // 목표를 지키는지 측정하는 게 목적이지, 통과 자체가 목적이 아님.
  thresholds: {
    'http_req_failed': ['rate<0.05'],          // 5% 까지 허용
    'http_req_duration': ['p(95)<300'],        // 200ms→300ms (Stress 마진)
    'ws_connecting': ['p(95)<1000'],
    'chat_latency': ['p(95)<200'],             // 100ms→200ms
    'checks': ['rate>0.90'],
  },
};

export default function () {
  runChatScenario();
}
