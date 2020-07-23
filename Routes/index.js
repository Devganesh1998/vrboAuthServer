const router = require('express').Router();

router.use('/oauth', require('./oauth/index'));

module.exports = router;