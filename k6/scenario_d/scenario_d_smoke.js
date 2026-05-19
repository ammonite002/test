// ============================================
// 시나리오 D - Smoke Test (통합 부하)
// 목적: 통합 부하 스크립트 동작 확인 (각 흐름 정상 동작)
//
// 부하 분배 (5명 → 비율 반올림으로 6명):
//   - 채팅(A): 2명 (30%)
//   - 조회(B): 3명 (50%)
//   - 작성(C): 1명 (20%)
//
// 통과 기준: 각 흐름의 기본 응답시간 통과
// ============================================

import { runChatScenario, runMainScenario, runCreateScenario } from './_common_d.js';

// k6 scenarios의 exec 옵션은 이 파일에서 export된 함수명을 참조함
// → A/B/C 함수를 그대로 export
export { runChatScenario, runMainScenario, runCreateScenario };

export const options = {
  scenarios: {
    chat:   { executor: 'constant-vus', exec: 'runChatScenario',   vus: 2, duration: '1m' },
    main:   { executor: 'constant-vus', exec: 'runMainScenario',   vus: 3, duration: '1m' },
    create: { executor: 'constant-vus', exec: 'runCreateScenario', vus: 1, duration: '1m' },
  },

  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'checks': ['rate>0.95'],
    // 시나리오별 응답시간 (각 시나리오 단독 측정 기준치 그대로)
    'chat_latency':   ['p(95)<200'],
    'list_latency':   ['p(95)<200'],
    'detail_latency': ['p(95)<200'],
    'create_latency': ['p(95)<500'],
  },
};
