// ============================================
// 시나리오 C - Smoke Test
// 목적: 게시물 생성 부하 스크립트 동작 확인 (5명, 1분)
//
// 페이로드: 장소 10개 × 각 사진 20장 = INSERT 211건/요청 (서비스 최대치)
//
// 통과 기준 (쓰기는 읽기보다 무거우므로 완화):
//   - 모든 check 95% 이상
//   - http p95 < 500ms
//   - 에러율 < 1%
// ============================================

import { runCreateScenario } from './_common_c.js';

export const options = {
  vus: 5,
  duration: '1m',

  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<500'],
    'create_latency': ['p(95)<500'],
    'checks': ['rate>0.95'],
  },
};

export default function () {
  runCreateScenario();
}
