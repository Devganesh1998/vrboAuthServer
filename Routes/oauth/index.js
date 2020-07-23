const router = require('express').Router();

router.use('/google', require('./googleOauth'));

module.exports = router;