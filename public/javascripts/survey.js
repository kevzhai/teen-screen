/* survey.js
 * ---------
 * The JavaScript file for the the survey page of Teen Screen,
 * which gets the questions one section at a time from the backend,
 * presents them to the user, asks questions one at a time, and
 * sends the results back to the backend.
 */

/**
 * TODO List
 * - Make the interface nicer
 * - At the end of a section, collect the data and send it to the server
 * - Implement a back button
 * - Cleanly deal with the end of all sections
 */

// instance variable for section number
var cache = {
	sections: []
};

var FINAL_SECTION = 22;

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
		cache.id = response;
		getSection(0, null, true);
		cache.sectionsIndex = 0; // index for cache.sections array
	});
})

// helper function to get a new section for the survey
getSection = function(sectionNum, params, start) {
	console.log("public params"); // debuq
	console.log(params); // debuq
	console.log("cache"); // debuq
	console.log(cache); // debuq
	// console.log("str"); // debuq
	// console.log(JSON.stringify(params)); // debuq

	if (params) {
		console.log(JSON.stringify(params));
		$.post('/survey/section/' + sectionNum, JSON.stringify(params), function(response) {
		// cache the current section number and section
		cache.sectionNum = parseInt(response.n);
		cache.sectionsIndex++;
		cache.section = response.section;
		cache.sections.push(response.section);
		cache.questionNum = start ? 0 : response.section.questions.length - 1;
		cache.responseOptions = response.responseOptions;

		// put the section on the screen
		compileSection(response.section, response.responseOptions);
		});
	} else { // initialize survey
		$.post('/survey/section/' + sectionNum, function(response) {
		// cache the current section number and section
		cache.sectionNum = parseInt(response.n);
		cache.section = response.section;
		cache.sections.push(response.section);
		cache.questionNum = start ? 0 : response.section.questions.length - 1;
		cache.responseOptions = response.responseOptions;

		// put the section on the screen
		compileSection(response.section, response.responseOptions);
		});
	}
}

// true if radio, false if checkbox
isRadio = function(question) {
	return cache.responseOptions[question.type].radio === '1';
}

// helper function to turn the JSON section into HTML elements
compileSection = function(section, responses) {
	section.questions.forEach(function(question, i) {
		var type, options;
		
		if (responses.hasOwnProperty(question.type)) {
			if (isRadio(question)) {
				type = 'radio';
			} else {
				type = 'checkbox';
			}
			options = responses[question.type].options;
		}
		if (question.type === '9') type = 'text';
		if (question.type === '10') type = 'intro';
		if (question.type === '0') type = 'age';

		var name = cache.sectionsIndex + '-' + question.num;
		var htmlString = '<form class="survey-question" id="section-' + cache.sectionsIndex + '-question-' + i + '">';
		if (type === 'radio' || type === 'checkbox') {
			htmlString += '<h4>' + question.text + '</h4>';
			htmlString += '<div class="c-inputs-stacked">';
			options.forEach(function(option, j) {
				htmlString += '<label class="c-input c-' + type + '">';
				htmlString += '<input type="' + type + '" name="' + name + '" value="' +
					option.text + '" data-keyboard="' + option.value + '"><span class="c-indicator"></span>';
				htmlString += option.button + ' - ' + option.text + '</label>';
			});
			htmlString += '</div>';
		} else if (type === 'intro') {
			htmlString += '<p>' + question.text + '</p>';
		} else if (type === 'text') {
			htmlString += '<fieldset class="form-group">';
			htmlString += '<label for="' + name + '">' + options[0].text + '</label>';
			htmlString += '<textarea class="form-control" id="' + name +
							'" name="' + name + '"></textarea>';
			htmlString += '</fieldset>';
		} else if (type === 'age') {
			htmlString += '<fieldset class="form-group">';
			htmlString += '<label for="' + name + '">How old are you?</label>';
			htmlString += '<input type="number" class="form-control" id="' + name +
				'" name="' + name + '" step="1" min="0" max="100">';
			htmlString += '</fieldset>';
		} else {
			htmlString += '<p>TODO: type ' + type + '</p>';
		}
		htmlString += '</form>';
		$(htmlString).appendTo('#questions')
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
	$('#section-' + cache.sectionsIndex + '-question-' + n).toggle(true);

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
	return !section.name.includes("Introduction") && !section.name.includes("Conclusion");
}

// set the value of the passed in sectionNum and question
// to the passed in value
setResponse = function(sectionsIndex, question, value) {
	var radio = cache.responseOptions[question.type].radio === '1';
	if (radio) {
		$('[name=' + sectionsIndex + '-' + question.num + ']:checked').prop('checked', false); // remove any current selections (only for radio, keep all for checkboxes)
	}
	var init = $('[name=' + sectionsIndex + '-' + question.num + '][data-keyboard=' + value + ']').prop('checked');
	$('[name=' + sectionsIndex + '-' + question.num + '][data-keyboard=' + value + ']').prop('checked', !init);
}

// has response checks whether the passed in sectionNum/question
// combination has a response
hasResponse = function(sectionsIndex, question) {
	if (question.type === '0' || question.type === '9') {
		return $('[name=' + sectionsIndex + '-' + question.num + ']').val().length > 0;
	} else {
		return $('[name=' + sectionsIndex + '-' + question.num + ']:checked').val() !== undefined;
	}
}

// helper function to get the response to the question passed in
// within the section given by sectionNum
getResponse = function(sectionsIndex, question) {
	if (question.type === '0' || question.type === '9') {
		return $('[name=' + sectionsIndex + '-' + question.num + ']').val();
	} else {
		var type = cache.responseOptions[question.type].radio === '1' ? 'radio' : 'checkbox';
		return $('[name=' + sectionsIndex + '-' + question.num + ']:checked').val();
	}
}

// get the responses to all questions displayed thus far in an object
// mapping from section to question to response
getResponses = function() {
	var responses = {};
	cache.sections.forEach(function(section, i) {
		if (sectionRequiresResponse(section)) {
		 responses[i] = {};
		 responses[i].name = section.name;
		 responses[i].qa = {};
		 section.questions.forEach(function(question, j) {
		 	if (requiresResponse(question)) {
		 		var escText = question.text.replace(/\./g, ';'); // MongoDB doesn't allow periods in key
		 		responses[i].qa[j + ": " + escText] = getResponse(i, question);
		 	}
		 });   	
		}
	});
	return responses;
}

// used by both next button and keyboard shortcut
next = function() {
	if (cache.sectionNum == FINAL_SECTION && cache.questionNum === cache.section.questions.length - 1) return; // have reached end
	if (requiresResponse(cache.question) && !hasResponse(cache.sectionsIndex, cache.question)) {
		showNotice(true);
		return;
	}
	showNotice(false);
	if (cache.audio) cache.audio.get(0).pause();
	if (++cache.questionNum === cache.section.questions.length) { // reached last question in section, proceed to next section
		if ($('#section-' + (cache.sectionsIndex + 1) + '-question-0').length) { // if the next section already exists
			cache.section = cache.sections[++cache.sectionsIndex];
			setCurrentQuestion(0);
			return;
		}

		var params = {
			id: cache.id,
			responses: getResponses()
		};

		getSection(cache.sectionsIndex + 1, params, true);
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
		if (cache.sectionsIndex === 0) { // if first section
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

	if (event.keyCode === 13) next();

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

