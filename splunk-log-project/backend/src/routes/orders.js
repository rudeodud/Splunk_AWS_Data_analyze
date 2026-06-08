const express = require('express');
const path = require('path');

const router = express.Router();

const {
  createOrder,
  getOrders
} = require('../controllers/orderController');

router.get('/', getOrders);

router.post('/', createOrder);

router.get('/index.html', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../../../frontend/index.html')
  );
});

module.exports = router;