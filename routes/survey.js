var express = require('express');
var router = express.Router();

var questionInterface = require('../private/questions-interface');

/* GET survey page. */
router.get('/', function(req, res, next) {
  console.log(req.user);
  res.render('survey', {
    title: 'Teen Screen Survey',
    user: req.user ? req.user.fullName : ''
  });
});

/* POST to initiate a new survey. */
router.post('/initiate', function(req, res, next) {
  // TODO: get the id sent as a parameter, if given
  // TODO: create a new survey entry in the database
  
  // get a random id. TODO: this will be actually from the database
  var id = Math.floor(Math.random() * 100);
  
  console.log(req.session.surveyParams);

  // send the first section of questions back to the user
  res.json(id);
});

/* POST the responses to a section and give the next section */
router.post('/section/:n', function(req, res, next) {
  // TODO: validate the parameters match the previous section
  // TODO: validate the id that will be passed in
  // TODO: record the section responses in the database

  var n = parseInt(req.params.n);
  if (questionInterface.isFinalSection(n)) {
    res.status(200).send('you\'re done');
  } else {
    questionInterface.getSection(n, function(err, section) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(section);
      }
    });
  }
});

module.exports = router;
