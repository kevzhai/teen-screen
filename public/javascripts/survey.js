/* survey.js
 * ---------
 * The JavaScript file for the the survey page of Teen Screen,
 * which gets the questions one section at a time from the backend,
 * presents them to the user, asks questions one at a time, and
 * sends the results back to the backend.
 */

// instance variable for section number
var cache = {
	sections: [],
  sectionsIndex: 0, // index for cache.sections array
  isQualSection: false,
  qualThreshold: 0, // symptom scale threshold to determine whether to proceed to qualifying questions
  sectionScore: 0, // used for sections with qualifying questions
  skippedQuestions: [],
  clinicSig: {}
};

var ENTER = 13; // 'enter' keycode
var BACKSPACE = 8; // 'backspace' keycode
var FOUR_RADIO = '5'; // question type code

// initialize to not showing the incomplete notice to start
$('#incomplete-notice').toggle(false);

document.getElementById('fullscreen').addEventListener('click', () => {
  // if (screenfull.enabled) { // uncomment
  //   screenfull.request();
  // } 
});
$(document).keydown(function(e) {
  if(e.which == 70 && e.altKey) { // alt + 'f'
    if (screenfull.enabled) {
      screenfull.request();
    } 
  }
});

// initiate the survey with a call to /survey/initiate
$('#fullscreen').on('click', function() {
	$('.invisible').removeClass('invisible');
	$('.handoff').toggle(false);
	$.post('/survey/initiate', function(response) { // second arg is callback function upon success
		cache.id = response; // the found survey._id OR newScreen._id
		getSection(null);
	});
})

cacheSection = function(response) {
	// cache the current section number and section
	cache.section = response.section;
  setQualSection();
	cache.sections.push(response.section);
	cache.responseOptions = response.responseOptions;
	// put the section on the screen
	compileSection(response.section);
}

// helper function to get a new section for the survey
getSection = function(params) {
	console.log("public params"); // debuq
	console.log(params); // debuq
	console.log("cache"); // debuq
	console.log(cache); // debuq
	// console.log("str"); // debuq
	// console.log(JSON.stringify(params)); // debuq

	if (params) {
		console.log(JSON.stringify(params));
		$.post('/survey/section', JSON.stringify(params), function(response) {
			if (!isFinalSection(cache.section)) {
				cache.sectionsIndex++;
				cacheSection(response);   	
			}
		});
	} else { // initialize survey
		$.post('/survey/section', function(response) {
			cacheSection(response);
		});
	}
}

isFinalSection = function(section) {
  return section.name === 'Conclusion';
}

isRadio = function(type) {
  return cache.responseOptions[type].radio === '1';
}

isFreeResponse = function(type) { 
  var type = getType(type);
  return (type !== 'radio' && type !== 'checkbox');
}

// returns readable string for type integer
getType = function(type) { 
  // refer to /private/question-type-reference.csv
  // text entry
  if (type === '0') return 'age';
  if (type === '3') return 'grade';
  if (type === '9') return 'text';
  if (type === '10') return 'intro';
  // others are all choice selection (i.e. radio or checkbox)
  if (isRadio(type)) {
    return 'radio';
  } else { 
    return 'checkbox';
  }
  return 'undefined';
}

// helper function to turn the JSON section into HTML elements
compileSection = function(section) {
	section.questions.forEach(function(question, i) {
    var type = getType(question.type);
    var options;
		if (cache.responseOptions.hasOwnProperty(question.type)) {
			options = cache.responseOptions[question.type].options;
    }
		var name = `${ cache.sectionsIndex }-${ question.num }`;
		var htmlString = `<form class="survey-question" id=${ generateQuestionId(i) }>`;
		if (type === 'radio' || type === 'checkbox') {
			htmlString +=  `<h4>${ question.text }</h4>
                      <div class="c-inputs-stacked">`;
			options.forEach(function(option, j) {
  		  htmlString +=  `<label class="c-input c-${ type }">
				                  <input type="${ type }" name="${ name }" value="${ option.text }" data-keyboard="${ option.value }">
                          <span class="c-indicator"></span>
				                  ${ option.button } - ${ option.text }
                        </label>`;
			});
			htmlString +=  '</div>';
		} else if (type === 'intro') {
			htmlString += `<p>${ question.text }</p>`;
		} else if (type === 'text') {
			htmlString +=  `<fieldset class="form-group">
  			                <label for="${ name }">${ options[0].text }</label>
  			                <textarea class="form-control" id="${ name }" name="${ name }"></textarea>
			                </fieldset>`;
		} else if (type === 'age' || type === 'grade') {
      var extraParams = '';
      if (type === 'age') {
        extraParams = 'type="number" step="1" min="0" max="100"';
      }
			htmlString +=  `<fieldset class="form-group">
                  			<label for="${ name }">${ question.text }</label>
                  			<input class="form-control" ${ extraParams } id="${ name }
                  				" name="${ name }">
                			</fieldset>`;
		} else {
			htmlString += `<p>TODO: type${ type }</p>`;
		}
		htmlString += '</form>';
		$(htmlString).appendTo('#questions');
	});

  setToFirstQuestion();
}

// checks if current cache section is given name
isCacheSection = function(name) {
  return cache.section.name === name;
}


// currently, follow-up questions contain the letter 'A' in them
isFollowUp = function() {
  return cache.question.num.includes('A');
}

// qualifiers contain the letter 'Q'
isQualifier = function(question) {
  return question.num.includes('Q');
}

// returns whether or not the section contains qualifier questions
setQualSection = function() {
  var sectionName = cache.section.name
  cache.isQualSection = sectionName === 'Agoraphobia' 
                        || sectionName === 'Panic Attacks' 
                        || sectionName === 'OCD';
  if (cache.isQualSection) { 
    cache.sectionScore = 0; // reset score for new section
    if (sectionName === 'Agoraphobia' || sectionName === 'Panic Attacks') {
      cache.qualThreshold = 2;
    } else { // OCD
      cache.qualThreshold = 3;
    }
  }
}

// return the ID attribute given a question number
generateQuestionId = function(num) {
  return `section-${ cache.sectionsIndex }-question-${ num }`;
}

// boolean for whether or not a question is contained in the skippedQuestions array
isSkipped = function(num) {
  var questionId = generateQuestionId(num);
  return cache.skippedQuestions.includes(questionId);
}

skip = function() {
  // add question to skippedQuestions
  // questionNum must be incremented to store the skipped question's rather than the leading question's
  var skippedQuestionId = generateQuestionId(++cache.questionNum);
  cache.skippedQuestions.push(skippedQuestionId);

  // clear the skipped followup question if it was previously filled in
  var skippedQuestion = cache.section.questions[cache.questionNum];
  // selector for the form fields (radio or checkboxes)
  var selector = `[name=${ cache.sectionsIndex }-${ skippedQuestion.num }]`;
  $(selector).prop('checked', false);

  // increment to the question after the skipped question
  cache.questionNum++;
  if (cache.questionNum === cache.section.questions.length) {
    getNextSection();
  } else {
    setQuestion(cache.questionNum);
  }
}

twoResponse = function(val) {
  if (val === 'Yes') {
    setQuestion(++cache.questionNum);  
  } else {
    skip();
  }
}

calcImpairment = function(val) {
  switch (val) {
    case 'A lot of the time':
      return 2;
      break;
    case 'Some of the time':
    case 'Yes': // on q118
      return 1;
      break;
    case 'Hardly ever':
    case 'Not at all':
    case 'No': // on q118
      return 0;
      break;
    default:  // when the value of a followup checkbox response is passed in while parsing through the impairment section
      return -1;
  }
}

// used either to set the next question or to return the score
fourResponse = function(val) {
  switch (val) {
    case 'A lot of the time':
      setQuestion(++cache.questionNum);
      break;
    case 'Some of the time':
      setQuestion(++cache.questionNum);
      break;
    case 'Hardly ever':
      skip();
      break;
    case 'Not at all':
      skip();
      break;
    default:
      console.log('fourResponse undefined', val);
  }
}

// If the current question is a followup, increment regularly to go to
// the next leading question. Otherwise, check the leading question's response
// with responseFn to figure out whether to go to followup or skip
checkFollowUp = function(responseFn) {
  if (isFollowUp()) {
    setQuestion(++cache.questionNum);  
  } else {
    var selector = `[name=${cache.sectionsIndex}-${cache.question.num}]:checked`;
    var val = $(selector).val();
    responseFn(val);
  }
}

// forward or backwards
proceedToQuestion = function(forward) {
  if (forward) {
    if (isCacheSection('Health')) {
      checkFollowUp(twoResponse);
    } else if (isCacheSection('Impairment')) {
      if (cache.question.type === FOUR_RADIO) {
        checkFollowUp(fourResponse);
      } else { // question 118 is a yes or no
        checkFollowUp(twoResponse);
      }
    } else {
      setQuestion(++cache.questionNum);      
    }
  } else { // prev
    // check skippedQuestions
    if (isSkipped(--cache.questionNum)) {
      // skip one more
      setQuestion(--cache.questionNum);
    } else { // this followup has been answered
      setQuestion(cache.questionNum);
    }
  }

}

setToFirstQuestion = function() {
  setQuestion(0);
}

setToLastQuestion = function() {
  // last question in a section
  var lastQuestion = cache.section.questions.length - 1;
  if (isSkipped(lastQuestion)) {
    // if last question was a skipped followup, set to second-to-last
    setQuestion(--lastQuestion); 
  } else {
    setQuestion(lastQuestion);
  }
}

// set the question by number
setQuestion = function(n) {
	cache.questionNum = n;
	cache.question = cache.section.questions[n];

  // remove from skippedQuestions if it was previously there
  var questionId = generateQuestionId(n);
  var index = cache.skippedQuestions.indexOf(questionId);
  if (index !== -1) {
    cache.skippedQuestions.splice(index, 1);
    console.log('added back');
  }

	var type = cache.question.type;
	cache.requiresResponse = requiresResponse(cache.question);

	// hide all questions
	$('.survey-question').toggle(false);

	// show the current question
  var currentQuestion = $(`#section-${ cache.sectionsIndex }-question-${ n }`);
	currentQuestion.toggle(true);
  var textField = ".form-control"; // selector for Bootstrap text field
  if (currentQuestion.has(textField).length) {
    $(textField).focus(); // focus for text fields
  }
	// use the HTML5 audio element
	cache.audio = $('<audio>').attr('src', '/audio/test.mp3'); 
	cache.audio.get(0).play();
}

// helper to set the notice
showNotice = function(show) {
	$('#incomplete-notice').toggle(show);
}

// predicate method for whether the passed in question
// requires a response, with only the 'intro' type
// not requiring a response
requiresResponse = function(question) {
	return question.type !== '10';
}

sectionRequiresResponse = function(section) {
	return !section.name.includes("Introduction");
}

// set the value of the passed in sectionsIndex and question
// to the passed in value
setResponse = function(sectionsIndex, question, value) {
  var name = `[name=${ sectionsIndex }-${ question.num }]`;
	if (isRadio(question.type)) {
		$(`${ name }:checked`).prop('checked', false); // remove any current selections (only for radio, keep all for checkboxes)
	}
	var init = $(`${ name }[data-keyboard=${ value }]`).prop('checked');
	$(`${ name }[data-keyboard=${ value }]`).prop('checked', !init); // toggle selection to opposite
}

// has response checks whether the passed in sectionsIndex/question
// combination has a response
hasResponse = function(sectionsIndex, question) {
	if (isFreeResponse(question.type)) {
		return $(`[name=${ sectionsIndex }-${ question.num }]`).val().length > 0;
	} else {
		return $(`[name=${ sectionsIndex }-${ question.num }]:checked`).val() !== undefined;
	}
}

// helper function to get the response to the question passed in
// within the section given by sectionsIndex
getResponse = function(sectionsIndex, question) {
  var selector = `[name=${sectionsIndex}-${question.num}]`;
  var type = question.type;
	if (isFreeResponse(type)) {
		return $(selector).val(); 
	} else {
    selector = `${ selector }:checked`;
		if (isRadio(type)) {
			return $(selector).val();
		} else { 
			// checkbox http://stackoverflow.com/questions/13530700/submit-multiple-checkboxes-values
			var responseValues = $(selector).map(function () {
			  return this.value;
			}).get();
			return responseValues;
		}
	}
}

// returns true if it is a section that counts towards calculating the DPS score
isDpsSection = function(section) {
  const scorableDpsSections = ["Social Phobia",
                               "Panic Attacks",
                               "General Anxiety",
                               "OCD",
                               "Depression",
                               "Alcohol",
                               "Marijuana",
                               "Other Substances"]
                               console.log("scoring", section.name, scorableDpsSections.includes(section.name));
  return scorableDpsSections.includes(section.name);
}


// Returns whether a question should be displayed in the Clinically Significant Information section
isClinicSig = function(name, question) {
  if (name === 'Depression') {
    return (question === 'Have you tried to kill yourself in the last year?'
            || question === 'In the last three months, has there been a time when you thought seriously about killing yourself?');
  } else if (name === 'Impairment') {
    return question === 'In the last three months, have you been to see someone at a hospital or at a clinic or a therapist/counselor because of the way you were feeling or acting?';
  } 
  // return false for anything else
  return false;
}

// get the responses to all questions displayed thus far in an object
// mapping from section to question to response
getResponses = function() {
  var r = {};
	r.allsections = [];
  r.dpsScore = 0;
  r.impairmentScore = 0;
	cache.sections.forEach(function(section, i) {
		if (sectionRequiresResponse(section)) {
      var s = {}; 
      s.name = section.name;
      s.qa = []; // array for questions and answers

      var dpsSection = isDpsSection(section); // boolean
      var isImpairment = section.name === 'Impairment';

      if (dpsSection || isImpairment) {
        s.score = 0; // section score
      }

      section.questions.forEach(function(question) {
  		 	if (requiresResponse(question)) {
          var response = {}; // object holding question and answer
  		 		response.question = question.text.replace(/\./g, ';'); // escaped text because MongoDB doesn't allow periods in key
          var answer = getResponse(i, question);
          response.answer = answer;
          if (isClinicSig(s.name, response.question)) {
            cache.clinicSig[response.question] = answer;
          }
          if (dpsSection && !isQualifier(question)) {
            response.score = 0;
            if (answer === 'Yes') {
              s.score++;
              response.score = 1;
            }
          } else if (isImpairment) {
            var val = calcImpairment(answer);
            if (val !== -1) { // -1 means followup checkbox response, not part of impairment score
              s.score += val;
              response.score = val;
            }
          }
          s.qa.push(response);
  		 	}
		  }); 
      if (dpsSection) {
        r.dpsScore += s.score;        
      } else if (isImpairment) {
        r.impairmentScore = s.score;
      }
      r.allsections.push(s);
		}
	});
	return r;
}

// save responses to params and proceed to next section
sendFormResponses = function() {
  var r = getResponses();
	var params = {
		id: cache.id, // survey._id
    // TODO
    formResponses: r.allsections,
    dpsScore: r.dpsScore,
    impairmentScore: r.impairmentScore,
    clinicSig: cache.clinicSig
    // impairmentScore: all.impairmentScore
	};

	getSection(params);
}

finalSection = function() {
  if (lastSecQuestion()) {
    return; // do nothing on final "thank you" page     
  }
  sendFormResponses(); // submit form after first question (asking about interview form field), also revises form values sent if user goes back and revises answers
  proceedToQuestion(true);
  return;
}

nextSecCached = function() {
  return $(`#section-${ cache.sectionsIndex + 1 }-question-0`).length;
}

// check if last question in section
lastSecQuestion = function() {
  return cache.questionNum === cache.section.questions.length - 1;
}

// reset to default state for presenting question
resetQuestion = function() {
  showNotice(false);
  if (cache.audio) cache.audio.get(0).pause();
}

getNextSection = function() {
  if (nextSecCached()) { 
    cache.section = cache.sections[++cache.sectionsIndex];
    setQualSection();
    setToFirstQuestion();
  } else {
    sendFormResponses();  
  }
}

// returns next question in section
lookahead = function() {
  // have reached last question in section
  var num = cache.questionNum;
  if (num === cache.section.length - 1) return cache.question;

  return cache.section.questions[num + 1];
}

// helper function to wrap score calculation and determining whether to skip
calcQualSection = function() {
  if (!isQualifier(cache.question)) { // only score for questions preceding qualifying questions
    var response = getResponse(cache.sectionsIndex, cache.question);
    if (response === 'Yes') {
      cache.sectionScore++;
    }

    if (isQualifier(lookahead())) { // next question is first qualifying question
      if (cache.sectionScore < cache.qualThreshold) { // skip to next section if don't meet cutoff
        getNextSection();
        return;
      }
    }
  } 
}

// used by both next button and keyboard shortcut
next = function() {
  if (requiresResponse(cache.question) && !hasResponse(cache.sectionsIndex, cache.question)) {
    showNotice(true);
    return;
  }
  resetQuestion();

  if (isFinalSection(cache.section)) {
    finalSection();
  }

  if (cache.isQualSection) {
    calcQualSection();
  }

	if (lastSecQuestion()) { // reached last question in section, proceed to next section
    getNextSection();
	} else { // proceed to next question in section
    proceedToQuestion(true);
	}
}

prev = function() {
  resetQuestion();

  if (cache.questionNum === 0) { // first question of section
    if (cache.sectionsIndex === 0) { // if first section, can't back up any further
      return;
    }

    cache.section = cache.sections[--cache.sectionsIndex]; // previous section          
    setToLastQuestion();
  } else {
    proceedToQuestion(false);
  }
}

// listener for the next button
$('#next-btn').on('click', next);

// listener for the back button
$('#back-btn').on('click', prev);

// listener for the repeat button
$('#repeat-btn').on('click', function() {
	// return to the start, and play again
	cache.audio.get(0).load();
	cache.audio.get(0).play();
});

// listener for keystrokes
$('body').on('keyup', function(event) {
	if (!requiresResponse(cache.question)) return;

	var key = String.fromCharCode(event.keyCode);
	var responseOption = cache.responseOptions[cache.question.type];

	// if the question type doesn't have options, move on
	if (!responseOption || !responseOption.hasOwnProperty('options')) return;

	responseOption.options.forEach(function(option) {
		if (key === option.button) {
			setResponse(cache.sectionsIndex, cache.question, option.value);
			if (responseOption.radio === "1") { // don't automatically proceed for checkbox questions
				next();			    	
			}
		}
	});
});

// http://stackoverflow.com/questions/1495219/how-can-i-prevent-the-backspace-key-from-navigating-back
$(document).unbind('keydown').bind('keydown', function (event) {
  var doPrevent = false;
  if (event.keyCode === BACKSPACE) {
    var d = event.srcElement || event.target;
    if (d.tagName.toUpperCase() === 'INPUT'  || d.tagName.toUpperCase() === 'TEXTAREA') {
        doPrevent = d.readOnly || d.disabled;
      }
    else {
      doPrevent = true;
    }
  }
  if (doPrevent) {
    event.preventDefault();
    prev();
  } 

  // prevents the error code from coming up if 'next' button is selected (happens on checkboxes in Impairment section)
  if (event.keyCode === ENTER) {
    event.preventDefault();
    next();
  }
});

