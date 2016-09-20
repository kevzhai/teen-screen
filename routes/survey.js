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

// error checking
function saveSurvey(survey) { 
  // write these changes to the database
  survey.save(function(error) {
    if (error) {
      console.log(error);
      return error;
    }
  });
}

/* POST to initiate a new survey. */
router.post('/initiate', function(req, res, next) {
  // always create a new survey
  var newScreen = new Screen({ 
    admin: req.user.username, // logged-in Stormpath user
    subjectID: req.session.surveyParams.subjectId,
    language: req.session.surveyParams.language,
    description: req.session.surveyParams.description,
    sponsor: req.session.surveyParams.sponsor,
    protocol: req.session.surveyParams.protocol,
    site: req.session.surveyParams.site,
    dpsScore: 0,
    impairmentScore: 0,
    formResponses: [],
    clinicSig: {}
  });

  saveSurvey(newScreen);
  res.json(newScreen._id); // callback on $.post('/survey/initiate'...), equiv to res.send with JSON conversion
});

/* POST the responses to a section and give the next section */
router.post('/section', function(req, res, next) {
  // TODO: validate the parameters match the previous section
  // TODO: validate the id that will be passed in

  // record the section responses in the database
  // var n = parseInt(req.params.n);
  // var n = parseInt(req.session.surveyParams.sections[parseInt(req.params.n)]);
  console.log('req', req.session);
  var n = parseInt(req.session.surveyParams.sections[req.session.sectionIndex]);
  if (req.session.sectionIndex < req.session.surveyParams.sections.length - 1) {
    req.session.sectionIndex++;      
  }

  if (Object.keys(req.body).length) { // form has been submitted at least once, i.e. get past Introduction1
    var body = JSON.parse(Object.keys(req.body)[0]);
    if (body.save) { 
      Screen.findById(body.id, function(error, survey) {
        if (error) {
          console.log(error);
        }
        survey.formResponses = body.formResponses;
        survey.clinicSig = body.clinicSig;
        survey.dpsScore = body.dpsScore;
        survey.impairmentScore = body.impairmentScore;
        survey.lastUpdated = new Date();
        if (body.positiveReasons) {
          survey.positiveReasons = body.positiveReasons;
        }
        saveSurvey(survey);
      });
    } 
  }

  questionInterface.getSection(n, function(err, section) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(section);
    }
  });
});

module.exports = router;
