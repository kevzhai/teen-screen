var express = require('express');
var router = express.Router();

var questionInterface = require('../private/questions-interface');

/* GET survey page. */
router.get('/', function(req, res, next) {
  res.render('survey', { title: 'Teen Screen Survey' });
});

/* POST to initiate a new survey. */
router.post('/initiate', function(req, res, next) {
  // TODO: get the id sent as a parameter, if given
  // TODO: create a new survey entry in the database
  
  // send the first section of questions back to the user
  questionInterface.getSection(0, function(err, section) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(section);
    }
  });
});

module.exports = router;
