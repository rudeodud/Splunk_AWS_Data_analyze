// ─────────────────────────────────────────────
// 📦 필요한 모듈 불러오기
// ─────────────────────────────────────────────

const logger = require('../config/logger');
// pino logger 인스턴스 가져오기
// requestLogger.js에서는 req.logger(child logger)를 주로 사용했지만
// errorHandler에서는 req.logger가 없을 수도 있어서 fallback으로 사용


// ─────────────────────────────────────────────
// 🔍 errorHandler 미들웨어란?
// ─────────────────────────────────────────────
// Express 에러 미들웨어: 일반 미들웨어와 다르게 파라미터가 4개 (err, req, res, next)
// 파라미터가 반드시 4개여야 Express가 에러 핸들러로 인식함
//
// 에러 흐름:
// controller에서 next(err) 호출
//         ↓
// 일반 미들웨어 전부 건너뜀
//         ↓
// errorHandler 실행 ← 여기
//
// app.js에서 반드시 가장 마지막에 등록해야 함:
//   app.use(requestLogger)
//   app.use('/orders', ordersRouter)
//   app.use(errorHandler)  ← 마지막!

function errorHandler(err, req, res, next) {
  // err: 발생한 에러 객체 (message, stack, status 등 포함)
  // req: 요청 객체 (requestId, logger 등 접근 가능)
  // res: 응답 객체 (클라이언트에게 에러 응답 전송)
  // next: 다음 미들웨어 (에러 핸들러에서는 거의 사용 안 함)


  // ─────────────────────────────────────────────
  // 📝 logger 선택 (child logger 우선)
  // ─────────────────────────────────────────────

  const childLogger = req.logger ?? logger;
  // req.logger: requestLogger 미들웨어에서 달아준 child logger
  //   → requestId가 자동으로 포함됨
  //   → 어떤 요청에서 에러가 났는지 추적 가능
  //
  // logger: req.logger가 없는 경우 fallback
  //   → requestLogger가 실행되기 전에 에러가 난 경우
  //   → 예) Express 앱 초기화 중 에러
  //
  // ?? (nullish coalescing): req.logger가 null 또는 undefined일 때만 logger 사용
  //   req.logger가 false나 0이면 그대로 사용 (|| 와의 차이점)


  // ─────────────────────────────────────────────
  // 🚨 에러 로그 기록
  // ─────────────────────────────────────────────

  childLogger.error({
    // .error(): 로그 레벨 50 (info:30, warn:40, error:50, fatal:60)
    // Splunk에서 level=50 또는 level="error" 로 에러만 필터링 가능:
    //   index=node_app level=50
    //   → 운영 중 에러 발생 모니터링, 알림 설정에 활용

    message: err.message,
    // 에러 메시지: "Cannot read property of undefined", "DB connection failed" 등
    // Splunk에서 에러 메시지 기준으로 그룹핑 가능:
    //   index=node_app level=50 | stats count by message

    stack: err.stack,
    // 에러가 발생한 파일, 함수, 줄 번호까지 포함한 스택 트레이스
    // 예)
    // Error: something went wrong
    //   at createOrder (/src/controllers/orderController.js:6:11)
    //   at Layer.handle (/node_modules/express/lib/router/layer.js:95:5)
    // Splunk에서 stack 필드로 어디서 에러났는지 바로 확인 가능

    method: req.method,
    // 어떤 HTTP 메서드 요청에서 에러가 났는지
    // 예) POST, GET, DELETE 등

    endpoint: req.originalUrl,
    // 어떤 엔드포인트에서 에러가 났는지
    // 예) /orders, /users/123 등
    // Splunk에서 에러가 자주 나는 엔드포인트 파악:
    //   index=node_app level=50 | stats count by endpoint
  });


  // ─────────────────────────────────────────────
  // 📤 클라이언트에게 에러 응답 전송
  // ─────────────────────────────────────────────

  res.status(err.status ?? 500).json({
    // err.status: 에러 객체에 status가 있으면 사용
    //   예) const err = new Error('Not found'); err.status = 404;
    //   → 404 응답
    //
    // ?? 500: err.status가 없으면 기본값 500 (Internal Server Error)
    //   → 예상치 못한 에러는 모두 500으로 처리

    error: err.message ?? 'Internal Server Error',
    // 클라이언트에게 보여줄 에러 메시지
    // err.message가 없으면 기본 메시지 'Internal Server Error' 사용
    //
    // ⚠️ 주의: stack trace는 클라이언트에게 절대 노출하면 안 됨
    //   → 보안 취약점이 될 수 있음 (내부 파일 구조, 라이브러리 버전 노출)
    //   → 로그 파일에만 저장하고 클라이언트엔 message만 전달
  });
}


// ─────────────────────────────────────────────
// 📤 내보내기
// ─────────────────────────────────────────────

module.exports = errorHandler;
// app.js에서 가장 마지막에 등록:
//   app.use(errorHandler)