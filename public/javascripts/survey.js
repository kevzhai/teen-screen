/* survey.js
 * ---------
 * The JavaScript file for the the survey page of Teen Screen,
 * which gets the questions one section at a time from the backend,
 * presents them to the user, asks questions one at a time, and
 * sends the results back to the backend.
 */

// instance variable for section number
var cache = {
	sections: []
};

var ENTER = 13; // 'enter' keycode
var BACKSPACE = 8; // 'backspace' keycode
var FOUR_RADIO = '5'; // question code

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
		cache.sectionsIndex = 0; // index for cache.sections array
	});
})

cacheSection = function(response) {
	// cache the current section number and section
	cache.section = response.section;
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
		var htmlString = `<form class="survey-question" id="section-${ cache.sectionsIndex }-question-${ i }">`;
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

skip = function() {
  cache.questionNum += 2;
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

// used either to set the next question or to return the score
fourResponse = function(val, score) {
  console.log('fourResponse', val);
  switch (val) {
    case 'A lot of the time':
      if (score) {
        return 2;
      } else {      
        setQuestion(++cache.questionNum);
      }
      break;
    case 'Some of the time':
      if (score) {
        return 1;
      } else {      
        setQuestion(++cache.questionNum);
      }
      break;
    case 'Hardly ever':
      if (score) {
        return 0;
      } else {      
        skip();
      }
      break;
    case 'Not at all':
      if (score) {
        return 0;
      } else {      
        skip();
      }
      break;
    default: // when the value of a followup checkbox response is passed in while parsing through the impairment section
      return -1;
  }
}

checkFollowUp = function(responseFn) {
  if (isFollowUp()) {
    setQuestion(++cache.questionNum);  
  } else {
    var selector = `[name=${cache.sectionsIndex}-${cache.question.num}]:checked`;
    var val = $(selector).val();
    responseFn(val);
  }
}

// when going to a previous question in the Impairment section,
// if it's an unanswered followup question, skip to the leading question 
checkFollowUpSkip = function() {

}

// forward or backwards
proceedToQuestion = function(forward) {
  if (forward) {
    if (isCacheSection('Health')) {
      checkFollowUp(twoResponse);
    } else if (isCacheSection('Impairment')) {
      if (cache.question.type === FOUR_RADIO) {
        checkFollowUp(fourResponse, false);
      } else { // question 118 is a yes or no
        checkFollowUp(twoResponse);
      }
    } else {
      setQuestion(++cache.questionNum);      
    }
  } else { // prev
    // if (isCacheSection('Impairment')) {
    //   checkFollowUpSkip();
    // } else {
      setQuestion(--cache.questionNum);
    // }
  }

}

setToFirstQuestion = function() {
  setQuestion(0);
}

setToLastQuestion = function() {
  setQuestion(cache.section.questions.length - 1);
}

// set the question by number
setQuestion = function(n) {
  console.log('setQuestion', n);
	cache.questionNum = n;
	cache.question = cache.section.questions[n];

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
	if (isRadio(question.type)) {
		$(`[name=${ sectionsIndex }-${ question.num }]:checked`).prop('checked', false); // remove any current selections (only for radio, keep all for checkboxes)
	}
	var init = $(`[name=${ sectionsIndex }-${ question.num }][data-keyboard=${ value }]`).prop('checked');
	$(`[name=${ sectionsIndex }-${ question.num }][data-keyboard=${ value }]`).prop('checked', !init);
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
  return section.name !== "Conclusion" && section.name !== "Demographics" 
         && section.name !== "Health" && section.name !== "Impairment"
         && !section.name.includes("Intro");
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
          if (dpsSection) {
            response.score = 0;
            if (answer === 'Yes') {
              s.score++;
              response.score = 1;
            }
          } else if (isImpairment) {
            var val = fourResponse(answer, true);
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
    impairmentScore: r.impairmentScore
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
    setToFirstQuestion();
  } else {
    sendFormResponses();  
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

