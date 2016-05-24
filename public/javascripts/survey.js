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

document.getElementById('fullscreen').addEventListener('click', () => {
  if (screenfull.enabled) {
    screenfull.request();
  } 
});
$(document).keydown(function(e) {
  if(e.which == 70 && e.ctrlKey) { // ctrl + 'f'
    if (screenfull.enabled) {
      screenfull.request();
    } 
  }
});

// initialize to not showing the incomplete notice to start
$('#incomplete-notice').toggle(false);

// helper function to get a new section for the survey
getSection = function(sectionNum, params, start) {
	$.post('/survey/section/' + sectionNum, params, function(response) {
		// cache the current section number and section
		cache.sectionNum = parseInt(response.n);
		cache.section = response.section;
		cache.sections.push(response.section);
		cache.questionNum = start ? 0 : response.section.questions.length - 1;
		cache.responses = response.responses;

		// put the section on the screen
		compileSection(response.section, response.responses);
	});
}

// helper function to turn the JSON section into HTML elements
compileSection = function(section, responses) {
	section.questions.forEach(function(question, i) {
		var type, options;
		
		if (responses.hasOwnProperty(question.type)) {
			type = responses[question.type].radio === '1' ? 'radio' : 'checkbox';
			options = responses[question.type].options;
		}
		if (question.type === '9') type = 'text';
		if (question.type === '10') type = 'intro';
		if (question.type === '0') {
			type = 'age';
		}

		var name = cache.sectionNum + '-' + question.num;
		var htmlString = '<form class="survey-question" id="section-' + cache.sectionNum + '-question-' + i + '">';
		if (type === 'radio' || type === 'checkbox') {
			htmlString += '<h4>' + question.text + '</h4>';
			htmlString += '<div class="c-inputs-stacked">';
			options.forEach(function(option, j) {
				htmlString += '<label class="c-input c-' + type + '">';
				htmlString += '<input type="' + type + '" name="' + name + '" value="' +
					option.value + '"><span class="c-indicator"></span>';
				htmlString += option.button + ' - ' + option.text + '</label>';
			});
			htmlString += '</div>';
		} else if (type === 'intro') {
			htmlString += '<p>' + question.text + '</p>';
		} else if (type === 'text') {
			htmlString += '<fieldset class="form-group">';
			htmlString += '<label for="' + name + '">' + options[0].text + '</label>';
			htmlString += '<input type="text" class="form-control" id="' + name +
				'" name="' + name + '">';
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
	$('#section-' + cache.sectionNum + '-question-' + n).toggle(true);

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

// set the value of the passed in sectionNum and question
// to the passed in value
setResponse = function(sectionNum, question, value) {
	var radio = cache.responses[question.type].radio === '1';
	if (radio) {
		$('[name=' + sectionNum + '-' + question.num + ']:checked').prop('checked', false);
	}
	var init = $('[name=' + sectionNum + '-' + question.num + '][value=' + value + ']').prop('checked');
	$('[name=' + sectionNum + '-' + question.num + '][value=' + value + ']').prop('checked', !init);
}

// has response checks whether the passed in sectionNum/question
// combination has a response
hasResponse = function(sectionNum, question) {
	if (question.type === '0' || question.type === '9') {
		return $('[name=' + sectionNum + '-' + question.num + ']').val().length > 0;
	} else {
		return $('[name=' + sectionNum + '-' + question.num + ']:checked').val() !== undefined;
	}
}

// helper function to get the response to the question passed in
// within the section given by sectionNum
getResponse = function(sectionNum, question) {
	if (question.type === '0' || question.type === '9') {
		return $('[name=' + sectionNum + '-' + question.num + ']').val();
	} else {
		return $('[name=' + sectionNum + '-' + question.num + ']:checked').val();
	}
}

// get the responses to all questions displayed thus far in an object
// mapping from section to question to response
getResponses = function() {
	var responses = {};
	cache.sections.forEach(function(section, i) {
		responses[i] = {};
		section.questions.forEach(function(question, j) {
			if (requiresResponse(question)) {
				responses[i][j] = getResponse(i, question);
			}
		});
	});
	return responses
}

// initiate the survey with a call to /survey/initiate
$('#fullscreen').on('click', function() {
	$('.invisible').removeClass('invisible');
	$('.handoff').toggle(false);
	$.post('/survey/initiate', function(response) {
		cache.id = response;
		getSection(0, null, true);
	});
})

// listener for the next button
$('#next-btn').on('click', function() {
	if (requiresResponse(cache.question) && !hasResponse(cache.sectionNum, cache.question)) {
		showNotice(true);
		return;
	}
	showNotice(false);
	if (cache.audio) cache.audio.get(0).pause();
	if (++cache.questionNum === cache.section.questions.length) {
		if ($('#section-' + (cache.sectionNum + 1) + '-question-0').length) {
			cache.section = cache.sections[++cache.sectionNum];
			setCurrentQuestion(0);
			return;
		}

		var params = {
			id: cache.id,
			responses: getResponses()
		};
		getSection(cache.sectionNum + 1, params, true);
	} else {
		setCurrentQuestion(cache.questionNum);
	}
});

// listener for the back button
$('#back-btn').on('click', function() {
	showNotice(false);
	cache.audio.get(0).pause();
	if (--cache.questionNum < 0) {
		if (cache.sectionNum === 0) {
			cache.questionNum++;
			return;
		}

		cache.section = cache.sections[--cache.sectionNum];
		setCurrentQuestion(cache.section.questions.length - 1);
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

	// ignore ENTER
	if (event.keyCode === 13) return;

	var key = String.fromCharCode(event.keyCode);
	var responses = cache.responses[cache.question.type];

	// if the question type doesn't have options, move on
	if (!responses || !responses.hasOwnProperty('options')) return;

	responses.options.forEach(function(option) {
		if (key === option.button) {
			setResponse(cache.sectionNum, cache.question, option.value);
		}
	});
});
