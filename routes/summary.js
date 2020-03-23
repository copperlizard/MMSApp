var express = require('express');
var router = express.Router();

/* GET summary page. */
router.get('/', function(req, res, next) {
  res.render('summary', { title: 'MMS Summary', time: req.requestTime });
});

module.exports = router;

