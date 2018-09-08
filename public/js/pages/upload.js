$(function() {
	$('#upload-button').click(function(e) {
		$.ajax({
			url: '/upload',
			type: 'POST',
			success: function(response) {
				alert('Upload(s) in progress!')
			}
		});
	});
});