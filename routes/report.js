var express = require('express');
var router = express.Router();
var Screen = require('../lib/screen');

/* GET report page. */
router.get('/', function(req, res) {
  if (!req.user) {
    return new Error("Must be logged in");
  }
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
  res.render('indiv_report', {
    title: 'Generated Report',
    subjectID: req.params.subjectID,
    user: req.user ? req.user.fullName : '',
    nav: true
  });
});

module.exports = router;
