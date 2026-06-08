// ─────────────────────────────────────────────
// 📦 필요한 모듈 불러오기
// ─────────────────────────────────────────────

const pino = require('pino');
// pino: Node.js에서 가장 빠른 JSON 로거 라이브러리
// 일반 console.log보다 훨씬 빠르고, JSON 형식으로 출력해서 Splunk가 파싱하기 쉬움

const fs = require('fs');
// fs: Node.js 내장 모듈 — 파일/폴더 존재 여부 확인, 생성에 사용

const path = require('path');
// path: Node.js 내장 모듈 — OS에 상관없이 파일 경로를 안전하게 다룸
// 예) Mac: /Users/..., Windows: C:\Users\... 차이를 자동으로 처리

require('dotenv').config();
// .env 파일의 환경변수를 process.env에 로드
// 예) process.env.LOG_PATH, process.env.NODE_ENV 사용 가능해짐


// ─────────────────────────────────────────────
// 📁 logs 폴더 자동 생성
// ─────────────────────────────────────────────

const logDir = path.resolve(__dirname, '../../logs');
// __dirname: 현재 파일(logger.js)이 위치한 폴더의 절대경로
//   → /Users/.../backend/src/config
// ../../logs: 두 단계 위로 올라가면 backend/ → 거기서 logs/
//   → /Users/.../backend/logs
// path.resolve(): 상대경로를 절대경로로 변환

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
// fs.existsSync(): 해당 경로가 실제로 존재하는지 확인 (true/false)
// fs.mkdirSync(): 폴더를 동기적으로 생성
// { recursive: true }: 중간 폴더도 없으면 한 번에 다 생성
//   예) logs/2026/06/ 처럼 중첩 폴더도 한 번에 생성 가능


// ─────────────────────────────────────────────
// 🚀 Pino Transport 설정
// ─────────────────────────────────────────────

const transport = pino.transport({
  // transport: 로그를 어디에, 어떤 형식으로 출력할지 설정
  // targets 배열로 여러 곳에 동시에 출력 가능 (멀티 출력)
  targets: [

    // ① 파일 출력 → Splunk UF가 이 파일을 읽어서 Splunk Cloud로 전송
    {
      target: 'pino/file',
      // pino/file: pino 내장 파일 출력 transport
      // JSON 한 줄(JSON Lines 형식)씩 파일에 저장
      options: {
        destination: path.resolve(__dirname, '../../logs/app.log'),
        // 저장 경로: backend/logs/app.log
        // Splunk UF의 inputs.conf에서 이 경로를 모니터링하도록 설정할 예정
      },
    },

    // ② 터미널 출력 → 개발할 때 눈으로 보기 편하게 컬러로 출력
    {
      target: 'pino-pretty',
      // pino-pretty: JSON 로그를 사람이 읽기 좋은 형태로 변환해주는 라이브러리
      // 실제 파일에는 JSON으로 저장되고, 터미널에만 예쁘게 보여줌
      options: {
        colorize: true,
        // true: 로그 레벨별로 색상 적용
        //   INFO  → 초록색
        //   WARN  → 노란색
        //   ERROR → 빨간색
      },
    },
  ],
});


// ─────────────────────────────────────────────
// 🔧 Pino Logger 인스턴스 생성
// ─────────────────────────────────────────────

const logger = pino(
  {
    level: 'info',
    // 로그 레벨 설정 — 이 레벨 이상만 출력
    // trace < debug < info < warn < error < fatal
    // 'info'로 설정하면 info, warn, error, fatal만 출력
    // trace, debug는 출력 안 됨 (개발 중 불필요한 로그 제거)

    base: {
      // 모든 로그에 자동으로 포함될 공통 필드
      // Splunk에서 service, environment 기준으로 필터링할 때 사용
      service: 'order-api',
      // 어떤 서비스에서 나온 로그인지 구분
      // 나중에 마이크로서비스가 여러 개면 'user-api', 'payment-api' 등으로 구분

      environment: process.env.NODE_ENV,
      // .env의 NODE_ENV 값 → 'dev', 'staging', 'production' 구분
      // Splunk에서 환경별로 대시보드 분리할 때 사용
    },

    timestamp: pino.stdTimeFunctions.isoTime,
    // 로그에 timestamp 자동 추가
    // pino.stdTimeFunctions.isoTime: ISO 8601 형식으로 출력
    //   → "time": "2026-06-08T12:00:00.000Z"
    // Splunk가 이 형식을 자동으로 인식해서 시간 기반 검색 가능
  },
  transport
  // 위에서 만든 transport 연결 (파일 + 터미널 동시 출력)
);


// ─────────────────────────────────────────────
// 📤 다른 파일에서 사용할 수 있도록 내보내기
// ─────────────────────────────────────────────

module.exports = logger;
// requestLogger.js, errorHandler.js, controller 등에서
// const logger = require('./config/logger') 로 가져다 씀