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
		getSection(null, true);
		cache.sectionsIndex = 0; // index for cache.sections array
	});
})

cacheSection = function(response, start) {
	// cache the current section number and section
	cache.section = response.section;
	cache.sections.push(response.section);
	cache.questionNum = start ? 0 : response.section.questions.length - 1;
	cache.responseOptions = response.responseOptions;

	// put the section on the screen
	compileSection(response.section);
}

// helper function to get a new section for the survey
getSection = function(params, start) {
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
				cacheSection(response, start);   	
			}
		});
	} else { // initialize survey
		$.post('/survey/section', function(response) {
			cacheSection(response, start);
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
  if (cache.responseOptions[type].radio === '1') {
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
		var name = cache.sectionsIndex + '-' + question.num;
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

	setCurrentQuestion(cache.questionNum);
}

// set the question by number
setCurrentQuestion = function(n) {
	cache.questionNum = n;
	cache.question = cache.section.questions[n];

	var type = cache.question.type;
	cache.requiresResponse = requiresResponse(cache.question);

	// hide all questions
	$('.survey-question').toggle(false);

	// show the current question
  var currentQuestion = $(`#section-${ cache.sectionsIndex }-question-${ n }`);
	currentQuestion.toggle(true);
  $(".form-control").focus(); // focus for text fields

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
  console.log('getResponse');
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
// get the responses to all questions displayed thus far in an object
// mapping from section to question to response
getResponses = function() {
	var allsections = [];
	cache.sections.forEach(function(section, i) {
		if (sectionRequiresResponse(section)) {
      var s = {}; 
      s.name = section.name;
      s.qa = []; // array for questions and answers
      section.questions.forEach(function(question) {
  		 	if (requiresResponse(question)) {
          var response = {}; // object holding question and answer
  		 		response.question = question.text.replace(/\./g, ';'); // escaped text because MongoDB doesn't allow periods in key
          response.answer = getResponse(i, question);
          s.qa.push(response);
  		 	}
		  });   	
      allsections.push(s);
		}
	});
	return allsections;
}

// save responses to params and proceed to next section
sendFormResponses = function() {
	var params = {
		id: cache.id, // survey._id
		formResponses: getResponses()
	};

	getSection(params, true);
}

// used by both next button and keyboard shortcut
next = function() {
	if (requiresResponse(cache.question) && !hasResponse(cache.sectionsIndex, cache.question)) {
		showNotice(true);
		return;
	}
	showNotice(false);
	if (cache.audio) cache.audio.get(0).pause();

	/* Check that we have reached the final section.
		 The second check is in case the user goes back. sectionNum won't update when
		 a user clicks back since it uses the sections already stored in the frontend params variable
		 Thus, it won't be passed back to the server, which is how sectionNum gets updated.
		 Checking that sectionsIndex is equal to sections.length - 1 isn't enough because sectionsIndex
		 will always be the last index as it progresses through the survey. Thus, first check that we have
		 finally reached the final section, then check that we are still there.
	*/
	if (isFinalSection(cache.section) && cache.sectionsIndex === cache.sections.length - 1) {
		if (cache.questionNum === cache.section.questions.length - 1) {
			return; // do nothing on final "thank you" page			
		}
		sendFormResponses(); // submit form after first question (asking about interview form field), also revises form values sent if user goes back and revises answers
		setCurrentQuestion(++cache.questionNum);
		return;
	}

	if (++cache.questionNum === cache.section.questions.length) { // reached last question in section, proceed to next section
		if ($(`#section-${ cache.sectionsIndex + 1 }-question-0`).length) { // if the next section already exists
			cache.section = cache.sections[++cache.sectionsIndex];
			setCurrentQuestion(0);
			return;
		}
		sendFormResponses();
	} else { // proceed to next question in section
		setCurrentQuestion(cache.questionNum);
	}
}

// listener for the next button
$('#next-btn').on('click', next);

// listener for the back button
$('#back-btn').on('click', function() {
	showNotice(false);
	cache.audio.get(0).pause(); 

	if (--cache.questionNum < 0) {
		if (cache.sectionsIndex === 0) { // if first section, can't back up any further
			cache.questionNum++;
			return;
		}

		cache.section = cache.sections[--cache.sectionsIndex]; // previous section		    	
		setCurrentQuestion(cache.section.questions.length - 1); // get last question from section
	} else {
		setCurrentQuestion(cache.questionNum);
	}
});

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
    if (
        (d.tagName.toUpperCase() === 'INPUT' && d.type.toUpperCase() === 'TEXT')  
          || d.tagName.toUpperCase() === 'TEXTAREA') {
        doPrevent = d.readOnly || d.disabled;
      }
    else {
      doPrevent = true;
    }
  }

  if (doPrevent) {
    event.preventDefault();
  } 

  // prevents the error code from coming up if 'next' button is selected (happens on checkboxes in Impairment section)
  if (event.keyCode === ENTER) {
    event.preventDefault();
    next();
  }
});

