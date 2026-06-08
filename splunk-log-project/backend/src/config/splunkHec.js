const dotenv = require('dotenv');
dotenv.config();
// .env 파일의 환경변수를 process.env에 로드
// 예) process.env.URL, process.env.TOKEN 사용 가능해짐
const axios = require('axios');
// axios: HTTP 요청을 보내는 라이브러리
// Node.js 내장 fetch보다 에러 처리, 설정이 간편해서 많이 사용

const https = require('https');
// https: Node.js 내장 모듈
// SSL 인증서 검증 옵션을 커스터마이징할 때 사용
// ─────────────────────────────────────────────
// ⚙️ Splunk HEC 설정값
// ─────────────────────────────────────────────

const HEC_URL = process.env.URL;
// HEC(HTTP Event Collector) 엔드포인트 URL
// 포트 8088: Splunk HEC 전용 포트
// /services/collector/event: 이벤트 단건 전송 API 경로
// (참고) /services/collector/raw: 원시 텍스트 전송용 (우리는 JSON이라 event 사용)

const TOKEN = process.env.TOKEN;
// Splunk Cloud에서 발급받은 HEC 토큰
// Settings → Data Inputs → HTTP Event Collector 에서 생성
// 이 토큰이 있어야 Splunk Cloud가 요청을 인증함


// ─────────────────────────────────────────────
// 🔒 SSL 설정
// ─────────────────────────────────────────────

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
// rejectUnauthorized: false → SSL 인증서 검증 비활성화
// Splunk Cloud Trial은 자체 서명 인증서를 사용하는 경우가 있어서
// 검증을 끄지 않으면 "self signed certificate" 에러 발생
//
// ⚠️ 주의: 프로덕션 환경에서는 반드시 true로 설정해야 함
//   → true로 설정하면 공식 CA 인증서만 허용 (보안 강화)


// ─────────────────────────────────────────────
// 📤 Splunk HEC로 로그 전송 함수
// ─────────────────────────────────────────────

async function sendToSplunk(logData) {
  // logData: requestLogger에서 만든 로그 객체
  // 예) { method: 'POST', endpoint: '/orders', statusCode: 200, ... }

  try {
    await axios.post(
      HEC_URL,
      // ── Request Body ──────────────────────────
      {
        event: logData,
        // event: 실제 로그 데이터
        // Splunk가 이 필드를 이벤트 본문으로 인식
        // 검색 시 이 안의 필드들(method, statusCode 등)로 필터링 가능

        sourcetype: '_json',
        // sourcetype: 데이터 형식을 Splunk에게 알려주는 메타데이터
        // '_json': JSON 형식임을 명시 → Splunk가 자동으로 필드 추출
        // 예) method, endpoint, statusCode가 자동으로 검색 가능한 필드가 됨

        index: 'main',
        // index: 데이터를 저장할 Splunk 인덱스
        // 'main': 기본 인덱스
        // 나중에 'node_app' 같은 전용 인덱스로 분리 가능
      },
      // ── Request Config ────────────────────────
      {
        headers: {
          Authorization: `Splunk ${TOKEN}`,
          // HEC 토큰 인증 헤더
          // 형식: "Splunk {토큰값}" (Bearer 아님 주의)
          // 이 헤더가 없으면 401 Unauthorized 에러 발생

          'Content-Type': 'application/json',
          // 요청 body가 JSON 형식임을 명시

          'X-Splunk-Request-Channel': TOKEN,
          // Splunk Cloud Trial 필수 헤더
          // 없으면 "Data channel is missing" 에러 발생 (code: 28)
          // 여러 인덱서가 있는 환경에서 요청을 올바르게 라우팅하기 위해 필요
          // 값은 토큰과 동일하게 사용
        },
        httpsAgent,
        // 위에서 만든 SSL 검증 비활성화 설정 적용
      }
    );
    // await: axios.post()는 Promise를 반환
    // 전송 완료까지 기다림 (비동기)
    // 하지만 requestLogger에서 sendToSplunk()를 await 없이 호출하므로
    // 응답 속도에 영향을 주지 않음 (fire and forget 방식)

  } catch (err) {
    console.error('Splunk HEC 전송 실패:', err.message);
    // 전송 실패 시 에러 로그만 출력하고 계속 진행
    // throw하지 않는 이유:
    //   → Splunk 전송 실패가 API 응답에 영향을 주면 안 됨
    //   → 로그 전송 실패해도 사용자는 정상 응답을 받아야 함
  }
}


// ─────────────────────────────────────────────
// 📤 내보내기
// ─────────────────────────────────────────────

module.exports = { sendToSplunk };
// requestLogger.js에서 가져다 씀:
//   const { sendToSplunk } = require('../config/splunkHec');
//   sendToSplunk(logData); // fire and forget