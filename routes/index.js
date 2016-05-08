var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.user);
  res.render('index', {
    title: 'Teen Screen',
    user: req.user ? req.user.fullName : ''
  });
});

module.exports = router;
