var express = require('express');
var router = express.Router();
var Screen = require('../lib/screen');
var fs = require("fs");

// http://stackoverflow.com/questions/12703098/how-to-get-a-json-file-in-express-js-and-display-in-view
function readJsonFileSync(filepath, encoding){
  if (typeof (encoding) == 'undefined'){
    encoding = 'utf8';
  }
  var file = fs.readFileSync(filepath, encoding);
  return JSON.parse(file);
}

// TODO also check in Admin group
function checkLoggedIn(user) { 
  if (!user) {
    return new Error("Must be logged in");
  }
}

/* GET report page. */
router.get('/', function(req, res) {
  checkLoggedIn(req.user);
  // only return reports administered by admin
  Screen.find({ admin: req.user.username }, function(err, reports) { // callback follows the pattern callback(error, results) http://mongoosejs.com/docs/queries.html
    console.log(reports);
    res.render('report', {
      title: 'Teen Screen Reports Page',
      reports: JSON.stringify(reports),
      user: req.user.fullName,
      nav: true
    });
  });
});

router.get('/:subjectID', function(req, res) {
  checkLoggedIn(req.user);

  var subjectID = req.params.subjectID;

  var symptomScale = readJsonFileSync('./private/symptom-scale.json');

  Screen.findOne({ subjectID: subjectID }, function(err, report) { // callback follows the pattern callback(error, results) http://mongoosejs.com/docs/queries.html
    // console.log('lone'); // debuq
    // console.log(report); // debuq
    res.render('indiv_report', {
      title: `Report for ${subjectID}`,
      report: JSON.stringify(report),
      symptomScale: symptomScale,
      user: req.user.fullName,
      nav: true
    });
  });
});

module.exports = router;
