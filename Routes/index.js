const router = require('express').Router();

router.use('/oauth', require('./oauth/index'));
router.use('/', require('./trandAuth'));

module.exports = router;