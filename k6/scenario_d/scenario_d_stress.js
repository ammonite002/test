// ============================================
// 시나리오 D - Stress Test (통합 부하)
// 목적: 500명 통합 부하 한계 검증
//
// 부하 분배 (총 500명):
//   - 채팅(A): 150명 (30%)
//   - 조회(B): 250명 (50%)
//   - 작성(C): 100명 (20%)
//
// Stress 기준 (각 단독 시나리오 Stress 기준 그대로):
//   - 채팅/조회: p95 < 300ms
//   - 작성: p95 < 1000ms
//   - 에러율 < 5%
//   - checks > 90%
// ============================================

import { runChatScenario, runMainScenario, runCreateScenario } from './_common_d.js';

export { runChatScenario, runMainScenario, runCreateScenario };

const stages = (target) => [
  { duration: '2m', target: target },
  { duration: '3m', target: target },
  { duration: '30s', target: 0 },
];

export const options = {
  scenarios: {
    chat:   { executor: 'ramping-vus', exec: 'runChatScenario',   startVUs: 0, stages: stages(150) },
    main:   { executor: 'ramping-vus', exec: 'runMainScenario',   startVUs: 0, stages: stages(250) },
    create: { executor: 'ramping-vus', exec: 'runCreateScenario', startVUs: 0, stages: stages(100) },
  },

  thresholds: {
    'http_req_failed': ['rate<0.05'],
    'checks': ['rate>0.90'],
    'chat_latency':   ['p(95)<300'],
    'list_latency':   ['p(95)<300'],
    'detail_latency': ['p(95)<300'],
    'create_latency': ['p(95)<1000'],
  },
};
