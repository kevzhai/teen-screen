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

		// put the section on the screen
		compileSection(response.section);
	});
}

// helper function to turn the JSON section into HTML elements
compileSection = function(section) {
	section.questions.forEach(function(question, i) {
		var type, options;
		switch(parseInt(question.type)) {
			case 0:
				type = 'mc';
				options = ['14', '15', '16', '17', '18'];
				break;
			case 1:
				type = 'mc';
				options = ['Male', 'Female'];
				break;
			case 2:
				type = 'mc';
				options = ['race1', 'race2'];
				break;
			case 3:
				type = 'mc';
				options = ['grade1', 'grade2'];
				break;
			case 4:
				type = 'mc';
				options = ['Yes', 'No'];
				break;
			case 5:
				type = 'mc';
				options = ['A lot', 'A little', 'Some', 'Never'];
				break;
			case 6:
				type = 'mc';
				options = ['Adultsp1q1', 'Adultsp1q2'];
				break;	 
			case 7:
				type = 'mc';
				options = ['Adultsp2q1', 'Adultsp2q2'];
				break;
			case 8:
				type = 'mc';
				options = ['worries1', 'worries2'];
				break;
			case 9:
				type = 'text';
				break;
			case 10:
				type = 'intro';
				break;
		}

		var htmlString = '<form class="survey-question" id="section-' + cache.sectionNum + '-question-' + i + '">';
		if (type === 'mc') {
			htmlString += '<h4>' + question.text + '</h4>';
			htmlString += '<div class="c-inputs-stacked">';
			options.forEach(function(option, j) {
				htmlString += '<label class="c-input c-radio">';
				htmlString += '<input type="radio" name="' + question.num + '" value="' + j + '"><span class="c-indicator"></span>';
				htmlString += option + '</label>';
			});
			htmlString += '</div>';
		} else if (type === 'intro') {
			htmlString += '<p>' + question.text + '</p>';
		} else if (type === 'text') {
			htmlString += '<p>TODO: text type</p>';
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
	cache.requiresResponse = type !== '9' && type !== '10';

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

// initiate the survey with a call to /survey/initiate
$.post('/survey/initiate', function(response) {
	cache.id = response;
	getSection(0, null, true);
});

// listener for the next button
$('#next-btn').on('click', function() {
	if (cache.requiresResponse && $('[name=' + cache.question.num + ']:checked').val() === undefined) {
		showNotice(true);
		return
	}

	showNotice(false);
	cache.audio.get(0).pause();
	if (++cache.questionNum === cache.section.questions.length) {
		if ($('#section-' + (cache.sectionNum + 1) + '-question-0').length) {
			cache.section = cache.sections[++cache.sectionNum];
			setCurrentQuestion(0);
			return;
		}

		// TODO: collect the responses and send as the parameters
		var params = {
			id: cache.id,
			TODO: 'get response values'
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
			// TODO: indicate on screen that you can't go back any further
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
