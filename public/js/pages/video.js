$(function () {
	$('#edit-video-info-button').click(function () {
		$('#video-info').addClass('hidden-info');
		$('#video-info-edit').removeClass('hidden-info');
	});

	$('#cancel-info-button').click(function() {
		$('#video-info').removeClass('hidden-info');
		$('#video-info-edit').addClass('hidden-info');
	});

	$('#save-info-button').click(function() {
		// $(this).css('display', 'none');

		var title;
		var year;
		var location;
		var famMembers = [];
		var entertainmentRating;
		var tags = [];
		var state;

		title = $('#edited-title').val();

		$(".edited-years").each(function (index) {
			if (this.checked) {
				year = this.value;
				return false;
			}
		});

		$(".edited-locations").each(function (index) {
			if (this.checked) {
				location = this.value;
				return false;
			}
		});

		$(".edited-familyMembers").each(function (index) {
			if (this.checked) {
				famMembers.push($(this).val());
			}
		});

		$(".edited-entertainmentRatings").each(function (index) {
			if (this.checked) {
				entertainmentRating = this.value;
				return false;
			}
		});

		$(".edited-tags").each(function (index) {
			if (this.checked) {
				tags.push($(this).val());
			}
		});

		$(".edited-state").each(function (index) {
			if (this.checked) {
				state = this.value;
				return false;
			}
		});

		var youtubeId = $('#edited-youtubeId').val();

		var mongo_id = $('#edited-mongoId').val();

		var clipData = {
			title: title,
			year: year,
			location: location,
			members: famMembers,
			rating: entertainmentRating,
			tags: tags,
			youtube_id: youtubeId,
			state: state
		};

		$.ajax({
			type: "PATCH",
			url: window.location.href,
			data: JSON.stringify(clipData),
			contentType: "application/json",
			success: function (response) {
				window.location.href = '/video/' + mongo_id;
			},
			error: function(response) {
				alert('There was an unexpected error. Your request was not completed.');
			}
		});
	});
});