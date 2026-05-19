// ============================================
// 시나리오 D - Load Test (통합 부하)
// 목적: 일반 부하(200명) 시 실제 트래픽 패턴 성능 측정
//
// 부하 분배 (총 200명):
//   - 채팅(A): 60명 (30%)
//   - 조회(B): 100명 (50%)
//   - 작성(C): 40명 (20%)
//
// stages: 2분간 0→target 증가, 3분간 유지, 30초 정리
//
// 통과 기준: 각 흐름의 단독 측정 기준치 그대로 적용
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
    chat:   { executor: 'ramping-vus', exec: 'runChatScenario',   startVUs: 0, stages: stages(60) },
    main:   { executor: 'ramping-vus', exec: 'runMainScenario',   startVUs: 0, stages: stages(100) },
    create: { executor: 'ramping-vus', exec: 'runCreateScenario', startVUs: 0, stages: stages(40) },
  },

  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'checks': ['rate>0.95'],
    'chat_latency':   ['p(95)<200'],
    'list_latency':   ['p(95)<200'],
    'detail_latency': ['p(95)<200'],
    'create_latency': ['p(95)<500'],
  },
};
