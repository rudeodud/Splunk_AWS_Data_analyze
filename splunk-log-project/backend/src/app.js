const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const ordersRouter = require('./routes/orders');

const app = express();

app.use(express.json());

app.use(requestLogger);

// frontend 정적 파일 제공
app.use(
  express.static(
    path.join(__dirname, '../frontend')
  )
);

// API 라우트
app.use('/orders', ordersRouter);

// 에러 처리
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});