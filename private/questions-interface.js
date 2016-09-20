/* questions-interface.js
 * ----------------------
 * An interface for the survey questions
 */

var fs = require('fs');

// the names of the files containing the survey questions and response options
var questionsFile = './private/survey-questions.json';
var responsesFile = './private/survey-responses.json';

// synchronously read the files
var questions = JSON.parse(fs.readFileSync(questionsFile).toString());
var responses = JSON.parse(fs.readFileSync(responsesFile).toString());

// function to get the data associated with the nth section
getSection = function(n, callback) { 
	n = parseInt(n);
	if (n >= questions['num-sections']) {
		callback(new Error('The requested section ' + n + ' is out of bounds.'));
	} else {
    let response = {
      section: questions.sections[n]
    };
    if (n === 0) {
      response["responseOptions"] = responses;
    }
		callback(null, response);
	}
}

module.exports = {
	getSection: getSection
};
