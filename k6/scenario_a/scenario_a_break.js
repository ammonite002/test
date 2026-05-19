// ============================================
// 시나리오 A - Break Test
// 목적: 서버가 어디서 무너지는지 한계점 확인
// stages: 1분간 0→1000명, 2분간 1000명 유지
//
// 통과 기준: 따로 없음. "측정"이 목적.
// 어느 시점에 응답시간 폭증/에러율 급증/연결 거부 발생하는지 관찰.
// ============================================

import { runChatScenario } from './_common.js';

export const options = {
  stages: [
    { duration: '1m', target: 1000 },
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 0 },
  ],

  // Break Test에서는 thresholds로 PASS/FAIL 판단 안 함.
  // 서버 한계점 데이터 수집이 목적이라 모든 측정값을 그대로 받아들임.
  // (thresholds 빼면 무조건 PASS로 표시됨 = 결과 분석은 별도)
  thresholds: {
    // 측정만 하고 싶으면 비워둬도 됨. 기준선 정도로만 두기:
    'http_req_failed': ['rate<0.50'],          // 50% 미만이면 일단 진행
  },
};

export default function () {
  runChatScenario();
}
