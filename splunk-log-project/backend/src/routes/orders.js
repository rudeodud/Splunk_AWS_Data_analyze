// ─────────────────────────────────────────────
// 🔍 Router란?
// ─────────────────────────────────────────────
// Express Router: URL 경로와 컨트롤러 함수를 연결하는 역할
//
// MVC 패턴에서의 위치:
// 사용자 요청 → app.js → router → controller
//                           ↑
//                       여기서 경로 매핑
//
// app.js에서 app.use('/orders', ordersRouter) 로 등록하면
// /orders로 시작하는 모든 요청이 이 라우터로 들어옴


// ─────────────────────────────────────────────
// 📦 필요한 모듈 불러오기
// ─────────────────────────────────────────────

const express = require('express');

const router = express.Router();
// express.Router(): 미니 Express 앱 같은 개념
// app.js의 app 객체와 분리해서 라우팅 로직만 따로 관리
// 장점:
//   → 라우터별로 파일을 분리해서 코드 가독성 향상
//   → 예) routes/orders.js, routes/users.js, routes/payments.js
//   → app.js가 복잡해지지 않음

const { createOrder, getOrders } = require('../controllers/orderController');
// orderController.js에서 만든 함수 가져오기
// 구조분해할당으로 필요한 함수만 추출


// ─────────────────────────────────────────────
// 📍 라우트 등록
// ─────────────────────────────────────────────

router.get('/', getOrders);
// GET /orders → getOrders 컨트롤러 실행
//
// app.js에서 app.use('/orders', ordersRouter) 로 등록했기 때문에
// 여기서 '/'는 실제로 '/orders'를 의미함
//
// 사용 예)
//   curl http://localhost:3000/orders
//   → getOrders 실행 → { orders: [] } 응답

router.post('/', createOrder);
// POST /orders → createOrder 컨트롤러 실행
//
// 사용 예)
//   curl -X POST http://localhost:3000/orders \
//     -H "Content-Type: application/json" \
//     -d '{"item": "keyboard", "quantity": 2}'
//   → createOrder 실행 → { message: 'Order created', item, quantity } 응답


// ─────────────────────────────────────────────
// 💡 라우트 확장 예시 (나중에 추가할 것들)
// ─────────────────────────────────────────────

// router.get('/:id', getOrderById);
// GET /orders/123 → 특정 주문 조회
// :id는 동적 파라미터 → req.params.id로 접근

// router.put('/:id', updateOrder);
// PUT /orders/123 → 특정 주문 수정

// router.delete('/:id', deleteOrder);
// DELETE /orders/123 → 특정 주문 삭제


// ─────────────────────────────────────────────
// 📤 내보내기
// ─────────────────────────────────────────────

module.exports = router;
// app.js에서 가져다 씀:
//   const ordersRouter = require('./routes/orders');
//   app.use('/orders', ordersRouter);