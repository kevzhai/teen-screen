// $(".checkall").on("click", function() {
//   $(".checked").prop("checked", true);
// });
// $(".checknone").on("click", function() {
//   $(".checked").prop("checked", false);
// });


// one-button toggle
var check = true;
$(".checkall").on("click", function() {
  $(".checked").prop("checked", !check);
  check = !check;
});

bootstrap_alert = function() {};
bootstrap_alert.warning = function(message) {
  $('#alert_placeholder').html('<div class="alert alert-danger alert-dismissible fade in" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> </button>'+message+'</div>')
};

$("#submit").on("click", function() {
	console.log($("#subjectId").val());

	if ($("#subjectId").val().length === 0) {
		bootstrap_alert.warning('Please enter subject ID');
		return false;
	} else {
		return true;
	}
})