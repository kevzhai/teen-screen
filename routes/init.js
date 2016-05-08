var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET initiate survey page. */
router.get('/', function(req, res, next) {
	fs.readFile('./private/sections.txt', function (err, content) {
      if (err) {
        return next(err);
      }
      res.render('init', { title: 'Teen Screen Initiate Survey', lines : content.toString().split('\n') });
  });
});

// http://stackoverflow.com/questions/19035373/how-do-i-redirect-in-expressjs-while-passing-some-context
function sendToSurvey(req, res) {
  // Prepare the context
  var context = req.dataProcessed;
  res.status(302).redirect('/survey'); // need to send through session?
}

function processForm(req, res, next) {
	console.log(req.body); // debugging purposes
  req.dataProcessed = req.body; // to-do: store / send data from form variables into session
  return next();
}

router.post('/', processForm, sendToSurvey);

module.exports = router;
