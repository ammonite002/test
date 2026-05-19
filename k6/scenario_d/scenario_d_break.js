// ============================================
// 시나리오 D - Break Test (통합 부하)
// 목적: 통합 부하의 한계점 확인
//
// 부하 분배 (총 1000명):
//   - 채팅(A): 300명 (30%)
//   - 조회(B): 500명 (50%)
//   - 작성(C): 200명 (20%)
//
// 통과 기준 따로 없음. 측정이 목적.
// ============================================

import { runChatScenario, runMainScenario, runCreateScenario } from './_common_d.js';

export { runChatScenario, runMainScenario, runCreateScenario };

const stages = (target) => [
  { duration: '1m', target: target },
  { duration: '2m', target: target },
  { duration: '30s', target: 0 },
];

export const options = {
  scenarios: {
    chat:   { executor: 'ramping-vus', exec: 'runChatScenario',   startVUs: 0, stages: stages(300) },
    main:   { executor: 'ramping-vus', exec: 'runMainScenario',   startVUs: 0, stages: stages(500) },
    create: { executor: 'ramping-vus', exec: 'runCreateScenario', startVUs: 0, stages: stages(200) },
  },

  thresholds: {
    'http_req_failed': ['rate<0.50'],
  },
};
