// ─────────────────────────────────────────────
// 📦 필요한 모듈 불러오기
// ─────────────────────────────────────────────

const logger = require('../config/logger');
// pino logger 인스턴스 가져오기
// 터미널 출력 + backend/logs/app.log 파일 저장 담당

const { randomUUID } = require('crypto');
// crypto: Node.js 내장 모듈
// randomUUID(): 요청마다 고유한 UUID v4 생성
//   예) "652dd443-7761-4291-8fde-ca52421f02a6"

const { sendToSplunk } = require('../config/splunkHec');
// Splunk HEC로 직접 로그 전송하는 함수
// 비동기(async)라서 응답 속도에 영향 없음


// ─────────────────────────────────────────────
// 🔍 requestLogger 미들웨어
// ─────────────────────────────────────────────
// 역할:
// 1. 요청마다 고유 requestId 생성
// 2. req.logger(child logger)를 달아서 컨트롤러에서도 같은 requestId 사용
// 3. 응답 완료 후 로그를 파일 + Splunk Cloud 양쪽에 전송
//
// 요청 흐름:
// 사용자 요청 → requestLogger → router → controller → res.json()
//                                                          ↓
//                                                    finish 이벤트
//                                                          ↓
//                                             pino 파일 로그 + Splunk HEC 전송

function requestLogger(req, res, next) {
  // req: 클라이언트 요청 정보 (method, url, headers, body 등)
  // res: 서버 응답 객체
  // next: 다음 미들웨어로 넘기는 함수 — 반드시 호출해야 함


  // ─────────────────────────────────────────────
  // 🔑 요청마다 고유 ID 생성
  // ─────────────────────────────────────────────

  const requestId = randomUUID();
  // 매 요청마다 새로운 UUID 생성
  // Splunk에서 같은 requestId로 묶인 로그를 한 번에 조회 가능:
  //   index=main requestId="652dd443-..."
  //   → 이 요청에서 발생한 모든 로그 추적


  // ─────────────────────────────────────────────
  // ⏱ 요청 시작 시간 기록
  // ─────────────────────────────────────────────

  const startTime = Date.now();
  // 현재 시간을 밀리초(ms)로 저장
  // 응답 완료 시점에 빼면 responseTime(처리 시간) 계산 가능


  // ─────────────────────────────────────────────
  // 📎 req 객체에 requestId와 child logger 달기
  // ─────────────────────────────────────────────

  req.requestId = requestId;
  // req는 이 요청의 생명주기 동안 모든 미들웨어/컨트롤러에서 공유됨
  // req.requestId를 달아두면 어디서든 이 요청의 ID 꺼내 쓸 수 있음

  req.logger = logger.child({ requestId });
  // logger.child(): 부모 logger 설정을 상속하면서
  //                 requestId를 자동으로 포함하는 새 logger 생성
  //
  // 컨트롤러에서 req.logger.info({...}) 하면
  // requestId가 자동으로 포함된 로그가 찍힘
  //
  // 예시 출력:
  // {
  //   "service": "order-api",       ← logger base 필드
  //   "requestId": "652dd443-...",  ← child()로 자동 포함
  //   "message": "Order created"    ← 컨트롤러에서 찍은 내용
  // }


  // ─────────────────────────────────────────────
  // 📤 응답 완료 시점에 로그 기록 + Splunk 전송
  // ─────────────────────────────────────────────

  res.on('finish', () => {
    // 'finish' 이벤트: 응답이 클라이언트에게 완전히 전송된 후 실행
    // 요청 들어올 때 바로 찍지 않는 이유:
    //   → 응답이 끝나야 statusCode, responseTime을 정확히 알 수 있음

    const responseTime = Date.now() - startTime;
    // 응답 완료 시점 - 요청 시작 시점 = 처리 시간(ms)
    // Splunk에서 느린 API 찾을 때:
    //   index=main responseTime>1000 → 1초 이상 걸린 요청 조회

    const logData = {
      // 로그 데이터를 객체로 먼저 만들어두기
      // → pino 파일 로그와 Splunk HEC 양쪽에 동일한 데이터 전송

      method: req.method,
      // HTTP 메서드: GET, POST, PUT, DELETE 등
      // Splunk에서: index=main method=POST

      endpoint: req.originalUrl,
      // 요청 URL 경로: /orders, /orders?page=1 등
      // req.url과 달리 라우터가 변경해도 원래 경로 유지
      // Splunk에서: index=main endpoint="/orders"

      statusCode: res.statusCode,
      // HTTP 응답 코드: 200, 201, 400, 404, 500 등
      // Splunk에서 에러 요청만 필터링:
      //   index=main statusCode>=400

      responseTime,
      // 처리 시간 (ms 단위)
      // Splunk 대시보드에서 평균/최대 응답시간 시각화 가능:
      //   index=main | stats avg(responseTime) by endpoint

      userId: req.headers['x-user-id'] ?? 'anonymous',
      // 요청 헤더에서 사용자 ID 추출
      // 헤더가 없으면 'anonymous'로 기록
      // Splunk에서 특정 유저 요청 추적:
      //   index=main userId="user-100"

      requestId,
      // 요청 추적용 고유 ID
      // 컨트롤러 로그와 이 로그를 requestId로 연결해서 조회 가능

      item: req.body?.item,
      // 주문한 상품명 (예: "keyboard")
      // req.body는 JSON 파싱된 객체 (express.json() 미들웨어 덕분)
      // ?. (optional chaining): body가 없거나 item이 없으면 undefined → 로그에 item: undefined 기록
      // Splunk에서 상품별 주문 추적:
      //   index=main item="keyboard"
    };

    req.logger.info(logData);
    // ① pino → 터미널(pino-pretty) + backend/logs/app.log 에 기록

    sendToSplunk(logData);
    // ② Splunk HEC → Splunk Cloud로 직접 전송
    // await 없이 호출 → fire and forget 방식
    // Splunk 전송이 느려도 API 응답 속도에 영향 없음
  });


  // ─────────────────────────────────────────────
  // ➡ 다음 미들웨어로 넘기기
  // ─────────────────────────────────────────────

  next();
  // 반드시 호출해야 다음 미들웨어/라우터로 진행됨
  // next() 빠뜨리면 요청이 여기서 멈춰서 응답이 안 나감
  //
  // 최종 흐름:
  // requestLogger(next) → router → controller → res.json()
  //                                                  ↓
  //                                           finish 이벤트
  //                                                  ↓
  //                                    pino 로그 + Splunk 전송
}


// ─────────────────────────────────────────────
// 📤 내보내기
// ─────────────────────────────────────────────

module.exports = requestLogger;
// app.js에서 app.use(requestLogger) 로 등록
// 모든 라우트에 자동 적용됨