// ============================================
// 시나리오 A - Smoke Test
// 목적: 스크립트 동작 확인 (5명, 1분)
// 통과 기준: 모든 check 95% 이상, 에러 없음
// ============================================

import { runChatScenario } from './_common.js';

export const options = {
  vus: 5,
  duration: '1m',

  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<200'],
    'ws_connecting': ['p(95)<500'],
    'chat_latency': ['p(95)<100'],
    'checks': ['rate>0.95'],
  },
};

export default function () {
  runChatScenario();
}
