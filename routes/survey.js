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
  // get the id sent as a parameter, if given
  // Screen.findOne({'subject':  req.session.surveyParams.subjectId}, function (err, survey) {
  //   if (survey) {
  //     res.json(survey._id);
  //   } else {
  //     var newScreen = new Screen({
  //       subject: ''
  //       responses: []
  //     });

  //     newScreen.save(function(error) {
  //       if (error) {
  //         throw error;
  //       }
  //       res.status(200);
  //       res.json(newScreen._id);
  //     });
  //   }
  // });
  
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

  // record the section responses in the database
  var n = parseInt(req.params.n);

  console.log(req.body);

  // Screen.findById(request.body.id, function(error, survey) {
  //   if (error) {
  //     throw error;
  //   }
  //   survey.responses = request.body.responses;

  //   // write these changes to the database
  //   post.save(function(error) {
  //     if (error) {
  //       throw error;
  //     }

  //     if (questionInterface.isFinalSection(n)) {
  //       res.status(200).send('you\'re done');
  //     } else {
  //       questionInterface.getSection(n, function(err, section) {
  //         if (err) {
  //           res.status(500).send(err);
  //         } else {
  //           res.status(200).send(section);
  //         }
  //       });
  //     }
  //   });
  // });

  // TODO: format survey response parameter into record data
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
