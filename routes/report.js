var express = require('express');
var router = express.Router();

/* GET initiate survey page. */
router.get('/', function(req, res, next) {
	res.render('report', {
    title: 'Teen Screen Reports Page',
    user: req.user ? req.user.fullName : ''
  });
});

module.exports = router;
