var express = require('express');
var router = express.Router();
var stormpath = require('express-stormpath');

// GET home page.
// https://docs.stormpath.com/nodejs/express/latest/user_data.html (use stormpath.getUser)
router.get('/', stormpath.getUser, function(req, res) {
  console.log('user', req.user);
  res.render('index', {
    title: 'Teen Screen',
    user: req.user ? req.user.fullName : '',
    userFirstName: req.user.givenName,
    nav: true
  });
});

module.exports = router;
