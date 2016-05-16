var express = require('express');
var router = express.Router();

/* GET initiate survey page. */
router.get('/', function(req, res, next) {
	res.render('admin', {
    title: 'Teen Screen Admin Page',
    user: req.user ? req.user.fullName : '',
    nav: true
  });
});

module.exports = router;
