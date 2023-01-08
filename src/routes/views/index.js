const router = require('express').Router();
const handlers = require('./handlers');

router.route(['', '/', '/home']).get(handlers.home);

module.exports = router