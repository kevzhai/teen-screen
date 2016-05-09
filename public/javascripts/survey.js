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
		console.log(response);
		// cache the current section number and section
		cache.sectionNum = parseInt(response.n);
		cache.section = response.section;

		// put the section on the screen
		compileSection(response.section);
	});
}

// helper function to turn the JSON section into HTML elements
compileSection = function(section) {
	// empty out the previous set of questions
	$('#questions').empty();

	section.questions.forEach(function(question) {
		// TODO: complete this for the rest of the sections
		var type, options;
		switch(parseInt(question.type)) {
			case 0: console.log('TODO: age'); break;
			case 1: {
				type = 'mc';
				options = ['Male', 'Female'];
			}
			case 2: {
				type = 'mc';
				options = ['race1', 'race2'];
			}
			case 3: console.log('grade'); break;
			case 4: {
				type = 'mc';
				options = ['Yes', 'No'];
				console.log('yes/no'); break;
			}
			case 5: console.log('TODO: freq'); break;
			case 6: console.log('TODO: adultsp1'); break;
			case 7: console.log('TODO: adultsp2'); break;
			case 8: console.log('TODO: worries'); break;
			case 9: console.log('TODO: free response'); break;
			case 10: console.log('TODO: intro'); break;
		}

		if (type === 'mc') {
			var $group = $('<div>');
			$group.addClass('form-control');
			$group.text(question.text);

			options.forEach(function(option, i) {
				$('<div class="radio"><label><input type="radio" value="' + i +
					'" name="' + question.num + '"></input>' + option +
					'</label></div>').appendTo($group);
			});
			$group.appendTo('#questions')
		} else {
			$('<p>').text('TODO: question of type ' + question.type + ' (' + question.text + ')').appendTo('#questions')
		}
	});
}

// initiate the survey with a call to /survey/initiate
$.post('/survey/initiate', function(response) {
	cache.id = response;
	getSection(0);
});

// listener for clicking on the next section button
$('#next-btn').on('click', function() {
	// TODO: collect the responses and send as the parameters
	var params = {
		id: cache.id,
		TODO: 'get response values'
	};
	console.log(cache.sectionNum);
	getSection(cache.sectionNum + 1, params);
});

