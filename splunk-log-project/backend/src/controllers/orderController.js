async function createOrder(req, res, next) {
  try {
    const { item, quantity } = req.body;

    req.logger.info({
      event: 'order_created',
      item,
      quantity
    });

    res.status(201).json({
      message: 'Order created',
      item,
      quantity
    });

  } catch (err) {
    next(err);
  }
}

async function getOrders(req, res, next) {
  try {
    req.logger.info({
      event: 'orders_fetched'
    });

    res.status(200).json({
      orders: []
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getOrders
};