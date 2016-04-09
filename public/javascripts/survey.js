/* survey.js
 * ---------
 * The JavaScript file for the the survey page of Teen Screen
 * Currently a stub to test the API calls
 */

var data = {};

// initiate the survey with a call to /survey/initiate
$.post('/survey/initiate', function(response) {
	$('#section-dump').text(JSON.stringify(response, null, 4));
	var str = JSON.stringify(response, null, 4);
	for (var i = 0; i < str.length; i++) {
		console.log(str[i]);
	}
});