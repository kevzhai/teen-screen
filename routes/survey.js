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
  // show all surveys debuq
  // Screen.find(function (err, surveys) { 
  //   console.log("found"); //debuq
  //   // console.log(surveys[0]);
  //   console.log(JSON.stringify(surveys, null, 2));
  // });

  // search for document based on 'subject' key
  Screen.findOne({subjectID: req.session.surveyParams.subjectId}, function (err, survey) {
    if (err) {
      console.log(err);
    }
    if (survey) {
      console.log("survey"); //debuq
      console.log(survey._id);
      res.json(survey._id); // callback on $.post('/survey/initiate'...), equiv to res.send with JSON conversion
    } else { 
      // TODO include admin as field, how to include optional fields?
      var newScreen = new Screen({ 
        subjectID: req.session.surveyParams.subjectId,
        admin: req.user.username, // logged-in Stormpath user
        language: req.session.surveyParams.language,
        description: req.session.surveyParams.description,
        sponsor: req.session.surveyParams.sponsor,
        protocol: req.session.surveyParams.protocol,
        site: req.session.surveyParams.site,
        formResponses: []
      });

      newScreen.save(function(error) {
        if (error) {
          throw error;
        }
        res.json(newScreen._id); // callback on $.post('/survey/initiate'...), equiv to res.send with JSON conversion
      });
    }
  });
});

/* POST the responses to a section and give the next section */
// http://stackoverflow.com/questions/32313553/what-does-a-colon-mean-on-a-directory-in-node-js
router.post('/section', function(req, res, next) {
  // TODO: validate the parameters match the previous section
  // TODO: validate the id that will be passed in

  // record the section responses in the database
  // var n = parseInt(req.params.n);
  // var n = parseInt(req.session.surveyParams.sections[parseInt(req.params.n)]);
  var n = parseInt(req.session.surveyParams.sections[req.session.sectionIndex]);
  if (req.session.sectionIndex < req.session.surveyParams.sections.length - 1) {
    req.session.sectionIndex++;      
  }

  console.log("blah"); // debuq
  console.log(req.session); // debuq
  console.log("body"); // debuq
  console.log(req.body); // debuq

  if (Object.keys(req.body).length) { // form has been submitted at least once
    var body = JSON.parse(Object.keys(req.body)[0]);
    Screen.findById(body.id, function(error, survey) {
      if (error) {
        console.log(error);
      }
      survey.formResponses = body.formResponses; 

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
  } else { // first time sent
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
