$(function() {
	$('.clip').each(function() {
		$(this).click(function() {
			window.location.href = '/video/' + $(this).attr('id');
		});
	});

	$('#query-submit-button').click(function() {
		submitQuery(1);
	});

	$('#grid-view-button').click(function(e) {
		e.preventDefault();
		$('.grid-style-clip').each(function (clip) {
			$(this).removeClass('hidden');
		});

		$('.list-style-clip').each(function (clip) {
			$(this).addClass('hidden');
		});

		$(this).addClass('active');
		$('#list-view-button').removeClass('active');
	});

	$('#list-view-button').click(function (e) {
		e.preventDefault();
		$('.grid-style-clip').each(function(clip) {
			$(this).addClass('hidden');
		});

		$('.list-style-clip').each(function (clip) {
			$(this).removeClass('hidden');
		});

		$(this).addClass('active');
		$('#grid-view-button').removeClass('active');
	});

	$('#query-form').on('submit', (e, test) => {
		e.preventDefault();
		submitQuery(1);
	});

	$('#page-left-button').click(function() {
		if (!$(this).hasClass('disabled')) {
			gotoPage($(this).data('page') - 1);
		}
	});

	$('#page-right-button').click(function() {
		if (!$(this).hasClass('disabled')) {
			gotoPage($(this).data('page') + 1);
		}
	});
});

function gotoPage(newPage) {
	if (newPage < 1) {
		return;
	}

	submitQuery(newPage);
};

function submitQuery(pageNumber) {
	var queryString = $('#query-form').serialize();
	queryString += `&page=${pageNumber}`;
	queryString += '&listStyle=' + ($('#grid-view-button').hasClass('active') ? 'grid' : 'list');
	window.location.href = '/?' + queryString;
}