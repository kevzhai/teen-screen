var express = require('express');
var mongoose = require('mongoose');
var request = require('request');
var router = express.Router();

var Screen = require('../lib/screen');
var questionInterface = require('../private/questions-interface');

/* GET survey page. */
router.get('/', function(req, res, next) {
  res.render('survey', {
    title: 'Teen Screen Survey',
    user: req.user ? req.user.fullName : '',
    nav: false
  });
});

/* POST to initiate a new survey. */
router.post('/initiate', function(req, res, next) {
  Screen.find(function (err, surveys) {
    console.log("found"); //debug
    console.log(surveys);
  });

  // get the id sent as a parameter, if given
  Screen.findOne({subject: req.session.surveyParams.subjectId}, function (err, survey) {
    if (err) {
      console.log(err);
    }
    if (survey) {
      console.log("survey"); //debug
      console.log(survey._id);
      res.json(survey._id); // equiv to res.send with JSON conversion
    } else {
      var newScreen = new Screen({
        subject: req.session.surveyParams.subjectId,
        responses: []
      });

      newScreen.save(function(error) {
        if (error) {
          next(error);
        }
        res.json(newScreen._id); // equiv to res.send with JSON conversion
      });
    }
  });
});

/* POST the responses to a section and give the next section */
router.post('/section/:n', function(req, res, next) {
  // TODO: validate the parameters match the previous section
  // TODO: validate the id that will be passed in

  // record the section responses in the database
  var n = parseInt(req.params.n);

  if (Object.keys(req.body).length) {
    var body = JSON.parse(Object.keys(req.body)[0]);
    Screen.findById(body.id, function(error, survey) {
      if (error) {
        console.log(error);
      }
      survey.responses = body.responses;

      // write these changes to the database
      survey.save(function(error) {
        if (error) {
          throw error;
        }

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
    });
  } else {
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
  }
});

module.exports = router;
