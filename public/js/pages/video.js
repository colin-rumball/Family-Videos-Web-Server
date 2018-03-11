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
			state: 'listed'
		};

		$.ajax({
			type: "PATCH",
			url: "http://localhost:3000/video/" + mongo_id,
			data: JSON.stringify(clipData),
			contentType: "application/json",
		});
	});
});