const router = require('express').Router();
const handlers = require('./handlers');

router.route('/').get(handlers.search).post(handlers.bulk_search);

module.exports = router