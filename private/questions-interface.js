/* questions-interface.js
 * ----------------------
 * An interface for the survey questions
 */

var fs = require('fs');

// the name of the file containing the survey questions
var filename = './private/survey-questions.json';

// synchronously read the file
var questions = JSON.parse(fs.readFileSync(filename).toString());

// function to get the data associated with the nth section
getSection = function(n, callback) {
	n = parseInt(n);
	if (n >= questions['num-sections']) {
		callback(new Error('The requested section ' + n + ' is out of bounds.'));
	} else {
		callback(null, {
			'num-sections': questions['num-sections'],
			n: n,
			section: questions.sections[n]
		});
	}
}

// function to check whether a section is the final section
isFinalSection = function(n) {
	return parseInt(n) === questions['num-sections'];
}

module.exports = {
	getSection: getSection,
	isFinalSection: isFinalSection
};
