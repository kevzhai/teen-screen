var express = require('express');
var router = express.Router();
var Screen = require('../lib/screen');
var fs = require("fs");

// http://stackoverflow.com/questions/12419396/how-do-i-display-todays-date-in-node-js-jade
var moment = require('moment');

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
    // create Set to hold subject IDs
    let allSubjectIDs = new Set();
    // create array to hold objects for each subject ID
    let subjectInfo = [];
    // if not already in Set, add to array
    for (let i = 0; i < reports.length; i++) {
      const subjectID = reports[i].subjectID;
      if (!allSubjectIDs.has(subjectID)) {
        allSubjectIDs.add(subjectID);
        subjectInfo.push(reports[i]);
      }
    }

    res.render('report', {
      title: 'Teen Screen Reports',
      reports: JSON.stringify(subjectInfo),
      user: req.user.fullName,
      nav: true
    });
  });
});

// lists all reports for one subject ID
router.get('/:subjectID', function(req, res) {
  checkLoggedIn(req.user);

  Screen.find({ subjectID: req.params.subjectID }, function(err, reports) { // callback follows the pattern callback(error, results) http://mongoosejs.com/docs/queries.html
    res.render('subject_report', {
      title: `All reports for ${ req.params.subjectID }`,
      subjectID: req.params.subjectID,
      reports: JSON.stringify(reports),
      user: req.user.fullName,
      moment: moment,
      nav: true
    });
  });
});

router.get('/:subjectID/:reportID', function(req, res) {
  checkLoggedIn(req.user);

  console.log("get indiv", req.params);

  const symptomScale = readJsonFileSync('./private/symptom-scale.json');

  Screen.findOne({ _id: req.params.reportID }, function(err, report) { // callback follows the pattern callback(error, results) http://mongoosejs.com/docs/queries.html
    res.render('indiv_report', {
      title: `Report for ${ req.params.subjectID }`,
      report: JSON.stringify(report),
      symptomScale: symptomScale,
      user: req.user.fullName,
      moment: moment,
      nav: true
    });
  });
});

module.exports = router;
