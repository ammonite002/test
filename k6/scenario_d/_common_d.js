// ============================================
// _common_d.js
// 시나리오 D (통합 부하) 전용 모듈
//
// 실제 서비스 트래픽 모사: 채팅 30% + 조회 50% + 작성 20%
//
// 구현 방식:
//   - k6 scenarios 옵션으로 3개 흐름 동시 실행
//   - 각 흐름은 기존 A/B/C 시나리오 함수 그대로 재사용
//   - 비율은 각 시나리오 파일의 stages target 값으로 분배
//
// 측정 지표 (각각 독립 측정 - 비교 분석용):
//   - chat_latency, messages_sent/received (A 메트릭)
//   - list_latency, detail_latency (B 메트릭)
//   - create_latency, created_posts (C 메트릭)
// ============================================

// A/B/C의 시나리오 함수를 그대로 가져와서 재export
// → D 시나리오 파일에서 exec 옵션으로 직접 참조 가능
// 폴더 구조: k6/scenario_d/_common_d.js → 형제 폴더 참조 (../)
export { runChatScenario } from '../scenario_a/_common.js';
export { runMainScenario } from '../scenario_b/_common_b.js';
export { runCreateScenario } from '../scenario_c/_common_c.js';

// 비율 상수 (참고용)
export const RATIO_CHAT = 0.30;
export const RATIO_MAIN = 0.50;
export const RATIO_CREATE = 0.20;
