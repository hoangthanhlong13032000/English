const router = require('express').Router();
const handlers = require('./handlers');

router.route('/').get(handlers.get).post(handlers.save).delete(handlers.remove);

module.exports = router