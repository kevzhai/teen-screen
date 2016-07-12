var express = require('express');
var router = express.Router();

/* GET report page. */
router.get('/', function(req, res, next) {
	res.render('report', {
    title: 'Teen Screen Reports Page',
    user: req.user ? req.user.fullName : '',
    nav: true
  });
});

router.get('/:subjectID', function(req, res, next) {
  res.render('admin', {
    title: 'Teen Screen Admin Page',
    user: req.user ? req.user.fullName : '',
    nav: true
  });
});

module.exports = router;
