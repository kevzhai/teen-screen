var express = require('express');
var router = express.Router();

/* GET initiate survey page. */
router.get('/', function(req, res, next) {
	res.render('admin', { title: 'Teen Screen Admin Page'});
});

module.exports = router;
