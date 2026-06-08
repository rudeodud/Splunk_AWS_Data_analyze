// ─────────────────────────────────────────────
// 🔍 app.js란?
// ─────────────────────────────────────────────
// Express 앱의 진입점 (Entry Point)
// 모든 미들웨어, 라우터를 한 곳에서 조립하는 파일
//
// 전체 요청 흐름:
// 사용자 요청
//     ↓
// express.json()     → JSON 파싱
//     ↓
// requestLogger      → requestId 생성, 로그 기록
//     ↓
// ordersRouter       → 경로 매핑
//     ↓
// orderController    → 비즈니스 로직
//     ↓
// errorHandler       → 에러 처리 (에러 발생 시에만)
//     ↓
// 클라이언트 응답


// ─────────────────────────────────────────────
// 📦 필요한 모듈 불러오기
// ─────────────────────────────────────────────

const express = require('express');
// Express: Node.js 웹 프레임워크
// 라우팅, 미들웨어, 요청/응답 처리를 쉽게 할 수 있게 해줌

const dotenv = require('dotenv');
dotenv.config();
// .env 파일의 환경변수를 process.env에 로드
// 반드시 다른 모듈보다 먼저 호출해야
// process.env.PORT 등을 다른 파일에서 사용 가능
//
// ⚠️ 주의: dotenv.config()는 앱에서 한 번만 호출하면 됨
// logger.js에서도 호출했지만 app.js에서 먼저 호출하는게 안전


// ─────────────────────────────────────────────
// 📦 내부 모듈 불러오기
// ─────────────────────────────────────────────

const requestLogger = require('./middlewares/requestLogger');
// 모든 요청에 requestId 부여 + HTTP 요청/응답 로그 기록

const errorHandler = require('./middlewares/errorHandler');
// 컨트롤러에서 next(err) 호출 시 에러 로그 기록 + 에러 응답 전송

const ordersRouter = require('./routes/orders');
// /orders 경로 라우팅 담당


// ─────────────────────────────────────────────
// 🚀 Express 앱 인스턴스 생성
// ─────────────────────────────────────────────

const app = express();
// Express 앱 생성
// app 객체로 미들웨어 등록, 라우터 연결, 서버 시작 등 모든 설정 관리


// ─────────────────────────────────────────────
// ⚙️ 기본 미들웨어 등록
// ─────────────────────────────────────────────

app.use(express.json());
// 요청 body를 JSON으로 파싱해서 req.body에 저장
// 이게 없으면 req.body가 undefined
//
// 예) curl -d '{"item": "keyboard"}' 로 보내면
//   express.json() 없을 때: req.body → undefined
//   express.json() 있을 때: req.body → { item: 'keyboard' }
//
// ⚠️ 반드시 라우터보다 먼저 등록해야 함
// 미들웨어는 등록 순서대로 실행되기 때문


// ─────────────────────────────────────────────
// 📝 로깅 미들웨어 등록
// ─────────────────────────────────────────────

app.use(requestLogger);
// 모든 라우트에 자동 적용
// express.json() 다음에 등록해야
// req.body가 파싱된 상태에서 로그 기록 가능
//
// 등록 순서가 중요:
//   app.use(express.json())  → body 파싱
//   app.use(requestLogger)   → 로그 기록 (body 파싱 후)
//   app.use('/orders', ...)  → 라우팅


// ─────────────────────────────────────────────
// 📍 라우터 등록
// ─────────────────────────────────────────────

app.use('/orders', ordersRouter);
// /orders 로 시작하는 모든 요청을 ordersRouter로 넘김
//
// 경로 매핑:
//   GET  /orders → ordersRouter의 router.get('/')  → getOrders
//   POST /orders → ordersRouter의 router.post('/') → createOrder
//
// 나중에 라우터 추가 예시:
//   app.use('/users', usersRouter);
//   app.use('/payments', paymentsRouter);


// ─────────────────────────────────────────────
// 🚨 에러 핸들러 등록
// ─────────────────────────────────────────────

app.use(errorHandler);
// ⚠️ 반드시 모든 라우터 뒤에 등록해야 함
// Express는 미들웨어를 순서대로 실행하기 때문에
// 라우터보다 앞에 있으면 에러를 잡지 못함
//
// 에러 처리 흐름:
//   controller → next(err) 호출
//       ↓
//   일반 미들웨어 전부 건너뜀
//       ↓
//   errorHandler 실행 (파라미터 4개짜리만 에러 핸들러로 인식)


// ─────────────────────────────────────────────
// 🎧 서버 시작
// ─────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
// process.env.PORT: .env 파일의 PORT 값 (3000)
// || 3000: .env 파일이 없거나 PORT가 없을 때 기본값
// EC2 배포 시 환경변수로 포트 변경 가능

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // 서버가 정상적으로 시작되면 출력
  // app.listen(): 지정한 포트에서 HTTP 요청 대기 시작
});