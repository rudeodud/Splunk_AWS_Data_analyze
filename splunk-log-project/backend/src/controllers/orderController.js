// ─────────────────────────────────────────────
// 🔍 Controller란?
// ─────────────────────────────────────────────
// MVC 패턴에서 Controller는 비즈니스 로직을 담당
//
// 요청 흐름:
// 사용자 요청 → router → controller → response
//                            ↑
//                        여기서 실제 로직 처리
//
// 현재는 DB 연결 전 로그 확인용 더미 데이터로 구현
// 나중에 DB 연결 후 실제 쿼리로 교체 예정


// ─────────────────────────────────────────────
// 📦 주문 생성 컨트롤러
// ─────────────────────────────────────────────

async function createOrder(req, res, next) {
  // async: 비동기 함수 선언
  //   → 나중에 DB 쿼리(await pool.query(...)) 사용할 때 필요
  //   → 지금은 더미 데이터라 async가 필요 없지만 미리 선언
  //
  // req: 요청 객체
  //   → req.body: 클라이언트가 보낸 JSON 데이터
  //   → req.logger: requestLogger에서 달아준 child logger (requestId 포함)
  //
  // res: 응답 객체
  //   → res.status().json()으로 클라이언트에게 응답
  //
  // next: 다음 미들웨어로 넘기는 함수
  //   → 에러 발생 시 next(err)로 errorHandler에게 넘김

  try {
    // try-catch: 에러 발생 시 catch로 잡아서 errorHandler로 넘김
    // try 안에서 에러가 나면 catch(err)로 넘어감

    const { item, quantity } = req.body;
    // req.body: 클라이언트가 보낸 JSON 데이터를 객체로 파싱
    //   → app.js에서 app.use(express.json()) 등록했기 때문에 가능
    //
    // 구조분해할당으로 item, quantity 추출
    // curl 테스트 시: -d '{"item": "keyboard", "quantity": 2}'
    //   → item: "keyboard", quantity: 2


    // ─────────────────────────────────────────────
    // 📝 비즈니스 로직 로그 기록
    // ─────────────────────────────────────────────

    req.logger.info({
      // req.logger: requestLogger에서 달아준 child logger
      //   → requestId가 자동으로 포함됨
      //   → 같은 requestId로 묶인 로그들을 Splunk에서 한 번에 조회 가능
      //
      // .info(): 레벨 30 — 정상적인 비즈니스 로직 로그

      message: 'Order created',
      // Splunk에서 message 기준으로 검색 가능:
      //   index=node_app message="Order created"
      //   → 주문 생성 횟수 집계, 트렌드 파악

      item,
      // 주문한 상품명
      // Splunk에서 상품별 주문 횟수 집계:
      //   index=node_app message="Order created" | stats count by item

      quantity,
      // 주문 수량
      // Splunk에서 수량 합계:
      //   index=node_app message="Order created" | stats sum(quantity) by item
    });

    // ─────────────────────────────────────────────
    // 📤 클라이언트에게 응답
    // ─────────────────────────────────────────────

    res.status(200).json({
      // 200: HTTP 성공 응답 코드
      // 엄밀히는 생성은 201이 맞지만 여기선 200으로 통일
      message: 'Order created',
      item,
      quantity,
    });
    // res.json() 호출 후 requestLogger의 'finish' 이벤트 발생
    // → HTTP 요청/응답 로그 자동 기록 (method, endpoint, statusCode, responseTime)

  } catch (err) {
    next(err);
    // 에러 발생 시 errorHandler로 넘김
    // errorHandler가 에러 로그 기록 + 클라이언트에게 에러 응답 전송
    //
    // next(err) 대신 직접 처리하지 않는 이유:
    //   → 에러 처리 로직을 errorHandler 한 곳에서 통일해서 관리
    //   → 모든 컨트롤러에서 중복 코드 제거
  }
}


// ─────────────────────────────────────────────
// 📦 주문 조회 컨트롤러
// ─────────────────────────────────────────────

async function getOrders(req, res, next) {
  try {

    // ─────────────────────────────────────────────
    // 📝 비즈니스 로직 로그 기록
    // ─────────────────────────────────────────────

    req.logger.info({
      message: 'Fetched orders',
      // Splunk에서 조회 횟수 집계:
      //   index=node_app message="Fetched orders" | timechart count
      //   → 시간대별 조회 트래픽 시각화
    });

    // ─────────────────────────────────────────────
    // 📤 클라이언트에게 응답
    // ─────────────────────────────────────────────

    res.status(200).json({
      orders: [],
      // 현재는 더미 데이터로 빈 배열 반환
      // 나중에 DB 연결 후:
      //   const orders = await pool.query('SELECT * FROM orders');
      //   res.status(200).json({ orders: orders.rows });
      //   로 교체 예정
    });

  } catch (err) {
    next(err);
  }
}


// ─────────────────────────────────────────────
// 📤 내보내기
// ─────────────────────────────────────────────

module.exports = { createOrder, getOrders };
// routes/orders.js에서 가져다 씀:
//   const { createOrder, getOrders } = require('../controllers/orderController');