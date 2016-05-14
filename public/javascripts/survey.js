/* survey.js
 * ---------
 * The JavaScript file for the the survey page of Teen Screen,
 * which gets the questions one section at a time from the backend,
 * presents them to the user, asks questions one at a time, and
 * sends the results back to the backend.
 */

/**
 * TODO List
 * 1) Put all question types on the screen in compileSection
 * 2) Hide all questions besides the current question
 * 3) Adjust the reaction to the #next-btn click depending on whether
 *    whether it's the end of the section and whether the question
 *    has actually been answered.
 * 4) Make the interface nicer
 * 5) At the end of a section, collect the data and send it to the server
 * 6) Implement a back button
 * 7) Cleanly deal with the end of all sections
 */

// instance variable for section number
var cache = {};

// helper function to get a new section for the survey
getSection = function(sectionNum, params) {
	$.post('/survey/section/' + sectionNum, params, function(response) {
		// cache the current section number and section
		cache.sectionNum = parseInt(response.n);
		cache.section = response.section;
		cache.questionNum = 0;

		// put the section on the screen
		compileSection(response.section);
	});
}

// helper function to turn the JSON section into HTML elements
compileSection = function(section) {
	// empty out the previous set of questions
	$('#questions').empty();

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

		var htmlString = '<form class="survey-question" id="question-num-' + i + '">';
		if (type === 'mc') {
			htmlString += '<h4>' + question.text + '</h4>';
			htmlString += '<div class="c-inputs-stacked">';
			options.forEach(function(option, j) {
				htmlString += '<label class="c-input c-radio">';
				htmlString += '<input type="radio" name=' + question.num + '" value="' + j + '"><span class="c-indicator"></span>';
				htmlString += option + '</label>';
			});
			htmlString += '</div';
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
	// hide all questions
	$('.survey-question').toggle(false);

	// show the current question
	$('#question-num-' + n).toggle(true);
}

// initiate the survey with a call to /survey/initiate
$.post('/survey/initiate', function(response) {
	cache.id = response;
	getSection(0);
});

// listener for clicking on the next section button
$('#next-btn').on('click', function() {
	if (++cache.questionNum === cache.section.questions.length) {
		console.log('done');
		// TODO: collect the responses and send as the parameters
		var params = {
			id: cache.id,
			TODO: 'get response values'
		};
		getSection(cache.sectionNum + 1, params);
	} else {
		setCurrentQuestion(cache.questionNum);
	}
});

