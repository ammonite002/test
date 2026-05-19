// ============================================
// _common.js
// 시나리오 A의 공통 로직 모듈
//
// 모든 부하 단계(Smoke/Load/Stress/Break)에서 재사용.
// stages만 단계별로 다르고, 실제 흐름은 동일.
// ============================================

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// _shared.js에서 환경 상수 가져옴 (B/C와 동일 패턴, DRY)
import { BASE_URL, WS_BASE_URL } from '../_shared.js';

// ─── A 시나리오 전용 상수 ─────────────────
export const REGION_CODES = ['1111000000', '1168000000', '1144000000', '2820000000'];

// SUBSCRIBE 등록 대기 (부하 늘어나면 늘려야 할 수도)
export const SUBSCRIBE_WAIT_MS = 200;

// ─── 커스텀 메트릭 ────────────────────────
// export로 빼면 thresholds에서 참조 가능
export const chatLatency = new Trend('chat_latency', true);
export const messagesSent = new Counter('messages_sent');
export const messagesReceived = new Counter('messages_received');

// ─── SockJS / STOMP 헬퍼 ──────────────────
export function buildSockJsUrl() {
  const serverId = Math.floor(Math.random() * 1000);
  const sessionId = Math.random().toString(36).substring(2, 10);
  return `${WS_BASE_URL}/ws-connect/${serverId}/${sessionId}/websocket`;
}

export function wrapStompForSockJs(stompFrame) {
  return JSON.stringify([stompFrame]);
}

export function buildConnectFrame() {
  return 'CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\u0000';
}

export function buildSubscribeFrame(subId, destination) {
  return `SUBSCRIBE\nid:${subId}\ndestination:${destination}\n\n\u0000`;
}

export function buildSendFrame(destination, body) {
  return `SEND\ndestination:${destination}\ncontent-type:application/json\n\n${body}\u0000`;
}

export function parseSockJsMessage(msg) {
  if (msg === 'o') return { type: 'open', frames: [] };
  if (msg === 'h') return { type: 'heartbeat', frames: [] };
  if (msg.startsWith('a')) {
    try {
      const frames = JSON.parse(msg.substring(1));
      return { type: 'message', frames: frames };
    } catch (e) {
      return { type: 'parse_error', frames: [] };
    }
  }
  if (msg.startsWith('c')) return { type: 'close', frames: [] };
  return { type: 'unknown', frames: [] };
}

export function getStompCommand(frame) {
  const newlineIdx = frame.indexOf('\n');
  return newlineIdx > 0 ? frame.substring(0, newlineIdx) : '';
}

// ─── 메인 시나리오 함수 ────────────────────
// 각 단계 파일에서 default function으로 호출
export function runChatScenario() {
  // 1. 로그인
  const userId = Math.floor(Math.random() * 100) + 1;

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ userId: userId }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (!check(loginRes, { '로그인 200': (r) => r.status === 200 })) return;
  const token = loginRes.json('accessToken');

  // 2. 채팅방 입장
  const regionCode = REGION_CODES[Math.floor(Math.random() * REGION_CODES.length)];

  const enterRes = http.post(
    `${BASE_URL}/api/chats/enter`,
    regionCode,
    {
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  if (!check(enterRes, { '입장 200': (r) => r.status === 200 })) return;
  const chatRoomId = enterRes.body.trim();

  // 3~6. WebSocket + STOMP + 메시지 송수신
  const wsUrl = buildSockJsUrl();

  ws.connect(wsUrl, null, function (socket) {
    let stompConnected = false;
    let messageEchoReceived = false;
    let sendTimestamp = 0;

    const echoToken = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    socket.on('message', (msg) => {
      const parsed = parseSockJsMessage(msg);

      if (parsed.type === 'open') {
        socket.send(wrapStompForSockJs(buildConnectFrame()));
        return;
      }

      if (parsed.type !== 'message') return;

      for (const frame of parsed.frames) {
        const command = getStompCommand(frame);

        if (command === 'CONNECTED') {
          stompConnected = true;

          const subFrame = buildSubscribeFrame(`sub-${userId}`, `/sub/chats/room/${chatRoomId}`);
          socket.send(wrapStompForSockJs(subFrame));

          socket.setTimeout(() => {
            const body = JSON.stringify({
              content: `테스트메시지-${echoToken}`,
              type: 'TEXT',
              senderId: userId,
            });
            const sendFrame = buildSendFrame(`/pub/chats/room/${chatRoomId}`, body);

            sendTimestamp = Date.now();
            socket.send(wrapStompForSockJs(sendFrame));
            messagesSent.add(1);
          }, SUBSCRIBE_WAIT_MS);

        } else if (command === 'MESSAGE') {
          if (frame.includes(echoToken)) {
            const latency = Date.now() - sendTimestamp;
            chatLatency.add(latency);
            messagesReceived.add(1);
            messageEchoReceived = true;

            socket.setTimeout(() => socket.close(), 500);
          }

        } else if (command === 'ERROR') {
          console.error(`STOMP ERROR: ${frame.substring(0, 200)}`);
        }
      }
    });

    socket.on('close', () => {
      check(null, {
        'STOMP CONNECTED': () => stompConnected,
        '메시지 echo 수신': () => messageEchoReceived,
      });
    });

    socket.on('error', (e) => {
      console.error(`WebSocket 에러: ${e.error()}`);
    });

    socket.setTimeout(() => socket.close(), 10000);
  });

  sleep(1);
}
