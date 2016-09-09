var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET initiate survey page. */
router.get('/', function(req, res, next) {
  fs.readFile('./private/required_sections.txt', function(err, content) {
    let reqSections = content.toString().split('\n');
    fs.readFile('./private/optional_sections.txt', function (err, content) {
        if (err) {
          return next(err);
        }
        res.render('init', {
          title: 'Teen Screen Initiate Survey',
          reqSections: reqSections,
          optSections : content.toString().split('\n'),
          user: req.user ? req.user.fullName : '',
          nav: true
        });
    });
  });
});

// http://stackoverflow.com/questions/19035373/how-do-i-redirect-in-expressjs-while-passing-some-context
function processForm(req, res, next) {
  console.log("processForm", req.body);
  req.session.surveyParams = req.body;
  req.session.sectionIndex = 0; // used to iterate through surveyParams.section array

  // bool for whether there are optional sections
  const includesOptSections = Object.keys(req.session.surveyParams).includes("opt-sections");
  console.log("wdaf", includesOptSections);
  // aggregate of required and optional sections to pass in
  req.session.surveyParams.sections = [];
  const mapping = JSON.parse(fs.readFileSync('./private/mapping.json').toString());

  for (const section in mapping) {
    if (section.includes("Intro") 
           || section.includes("Conclusion")
           || req.session.surveyParams["req-sections"].includes(section)
           || (includesOptSections && req.session.surveyParams["opt-sections"].includes(section))) {
      req.session.surveyParams.sections.push(mapping[section]);
    } 
  }
  req.session.surveyParams.sections.sort(numericSort);
  console.log("req.session", req.session); // debuq
  res.status(302).redirect('/survey');
}

function numericSort(a, b) {
  return parseInt(a) - parseInt(b);
}

router.post('/', processForm);

module.exports = router;
