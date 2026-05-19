// ============================================
// 시나리오 C - Break Test
// 목적: 게시물 생성 부하의 한계점 확인
// stages: 1분간 0→1000명, 2분간 1000명 유지, 30초 정리
//
// 페이로드: 장소 10개 × 사진 2장씩 = INSERT 31건/요청
//
// 통과 기준 따로 없음. 측정이 목적.
// 어느 시점에 응답시간 폭증/에러율 급증/INSERT 실패 발생하는지 관찰.
// ============================================

import { runCreateScenario } from './_common_c.js';

export const options = {
  stages: [
    { duration: '1m', target: 1000 },
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 0 },
  ],

  // Break는 PASS/FAIL 판단 안 함
  thresholds: {
    'http_req_failed': ['rate<0.50'],
  },
};

export default function () {
  runCreateScenario();
}
