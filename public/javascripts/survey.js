/* survey.js
 * ---------
 * The JavaScript file for the the survey page of Teen Screen
 * Currently a stub to test the API calls
 */

// instance variable for section number
var n;

// initiate the survey with a call to /survey/initiate
$.post('/survey/initiate', function(response) {
	$('#section-dump').text(JSON.stringify(response, null, 4));

	// cache the current section
	n = response.n;
});

// listener for clicking on the next section button
$('#next-btn').on('click', function() {
	// go to the next section
	$.post('/survey/section/' + n, function(response) {
		$('#section-dump').text(JSON.stringify(response, null, 4));

		// cache the current section
		n = response.n;
	});
});
