var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET admin page. */
router.get('/', function(req, res, next) {
	fs.readFile('./private/sections.txt', function (err, content) {
      if (err) {
        return next(err);
      }
      res.render('admin', { title: 'Teen Screen Admin Page', lines : content.toString().split('\n') });
  });

	// http://stackoverflow.com/questions/19035373/how-do-i-redirect-in-expressjs-while-passing-some-context
	function sendToSurvey(req, res) {
	  // Prepare the context
	  var context = req.dataProcessed;
	  res.redirect('survey'); // need to send through session?
	}

	function processForm(req, res, next) {
		console.log(req.body); // debugging purposes
	  req.dataProcessed = req.body; // to-do: store / send data from form variables into session
	  return next();
	}

	router.post('/', processForm, sendToSurvey);


// router.post('/', function(req, res){
//   console.log(req.body); // to-do: store / send data from form variables
//   console.log("redirect");
//   res.redirect(200, "./survey/initiate");
// });

  
});

module.exports = router;
