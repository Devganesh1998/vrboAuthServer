const router = require('express').Router();

router.use('/google', require('./googleOauth'));
router.use('/facebook', require('./fbOauth'));

module.exports = router;