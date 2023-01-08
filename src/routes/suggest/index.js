const router = require('express').Router();
const handlers = require('./handlers');

router.route('/').get(handlers.query);

module.exports = router