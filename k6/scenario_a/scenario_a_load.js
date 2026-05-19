// ============================================
// 시나리오 A - Load Test
// 목적: 일반 부하 (200명) 상황에서 성능 확인
// stages: 2분간 0→200명 증가, 3분간 200명 유지
// 통과 기준: 응답시간/지연시간 목표 준수
// ============================================

import { runChatScenario } from './_common.js';

export const options = {
  stages: [
    { duration: '2m', target: 200 },   // 0→200명 점진 증가
    { duration: '3m', target: 200 },   // 200명 유지
    { duration: '30s', target: 0 },    // 정리
  ],

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
