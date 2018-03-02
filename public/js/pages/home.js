$(function() {
	$('.clip').each(function() {
		$(this).click(function() {
			window.location.href = '/video/' + $(this).attr('id');
		});
	});
});