// ============================================
// 시나리오 B - Break Test
// 목적: 서버가 어디서 무너지는지 한계점 확인
// stages: 1분간 0→1000명, 2분간 1000명 유지, 30초 정리
//
// 통과 기준: 따로 없음. "측정"이 목적.
// 어느 시점에 응답시간 폭증/에러율 급증 발생하는지 관찰.
// ============================================

import { runMainScenario } from './_common_b.js';

export const options = {
  stages: [
    { duration: '1m', target: 1000 },
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 0 },
  ],

  // Break Test에서는 thresholds로 PASS/FAIL 판단 안 함.
  // 한계점 데이터 수집이 목적이라 모든 측정값을 그대로 받아들임.
  thresholds: {
    'http_req_failed': ['rate<0.50'],          // 50% 미만이면 일단 진행
  },
};

export default function () {
  runMainScenario();
}
