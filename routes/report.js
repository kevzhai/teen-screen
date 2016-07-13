var express = require('express');
var router = express.Router();
var Screen = require('../lib/screen');

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

  Screen.findOne({ subjectID: req.params.subjectID }, function(err, report) { // callback follows the pattern callback(error, results) http://mongoosejs.com/docs/queries.html
    console.log('lone');
    console.log(report);
    res.render('indiv_report', {
      title: `Report for ${req.params.subjectID}`,
      report: JSON.stringify(report),
      user: req.user.fullName,
      nav: true
    });
  });
});

module.exports = router;
