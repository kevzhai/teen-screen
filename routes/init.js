var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET initiate survey page. */
router.get('/', function(req, res, next) {
	fs.readFile('./private/sections.txt', function (err, content) {
      if (err) {
        return next(err);
      }
      res.render('init', {
        title: 'Teen Screen Initiate Survey',
        lines : content.toString().split('\n'),
        user: req.user ? req.user.fullName : '',
        nav: true
      });
  });
});

// http://stackoverflow.com/questions/19035373/how-do-i-redirect-in-expressjs-while-passing-some-context
function processForm(req, res, next) {
  req.session.surveyParams = req.body;
  console.log("asdlfjsa");
  console.log(req.session.surveyParams.parameter);
  res.status(302).redirect('/survey');
}

router.post('/', processForm);

module.exports = router;
