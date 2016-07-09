var express = require('express');
var router = express.Router();
const fs = require('fs');

var DEMO = "2"; // starting variable in views/init.jade so all the other sections' indices match with the survey-questions.json
var INTRO1 = "0";
var ACTUAL_DEMO = "1"; // actual index for Demographics section
var INTRO2 = "2";
var FINAL_SECTION = "22";

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
  console.log("req");
  console.log(req);
});

// http://stackoverflow.com/questions/19035373/how-do-i-redirect-in-expressjs-while-passing-some-context
function processForm(req, res, next) {
  req.session.surveyParams = req.body;
  req.session.sectionIndex = 0; // used to iterate through surveyParams.section array
  if (typeof req.session.surveyParams.sections === "string") { // if only one section is chosen, it is a string, and not an array
    req.session.surveyParams.sections = Array(req.session.surveyParams.sections);
  }

  if (req.session.surveyParams.sections[0] === DEMO) { // Demographics was selected
    req.session.surveyParams.sections.unshift(INTRO1, ACTUAL_DEMO); // add intro1 index and actual demographics index to array
  } else {
    req.session.surveyParams.sections.unshift(INTRO2); // add intro2 index to beginning
  }
  req.session.surveyParams.sections.push(FINAL_SECTION); // append conclusion section

  console.log(req.session.sectionIndex); // debuq
  console.log(req.session); // debuq
  res.status(302).redirect('/survey');
}


router.post('/', processForm);

module.exports = router;
