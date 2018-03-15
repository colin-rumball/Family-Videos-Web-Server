$(function() {
	$('#upload-button').click(function(e) {
		$.ajax({
			url: '/upload',
			type: 'POST',
			success: function(response) {
				$('body').append('Success'); // TODO
			}
		});
	});
});