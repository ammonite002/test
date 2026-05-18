# NearBy 테스트 레포

NearBy 백엔드 테스트 코드 모음.

## 구조

- `k6/` — k6 부하 테스트 (시나리오 A/B/C/D)
- `http/` — IntelliJ HTTP 클라이언트 기능 테스트

## 현재 상태

- 서버 분리 후 환경: API 서버 + 채팅 서버 분리
- API 진입점: http://13.209.144.78 (Nginx, 80포트)
- WebSocket: ws://13.209.144.78/ws-connect

## TODO

- [ ] k6 시나리오 A (채팅 단독)
- [ ] k6 시나리오 D (통합)
- [ ] k6 시나리오 B (조회)
- [ ] k6 시나리오 C (작성)
- [ ] HTTP 테스트: chats, posts, users, auth
- [ ] 부하 테스트 자동화 BAT (두 인스턴스 동시 restart)