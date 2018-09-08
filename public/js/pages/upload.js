Dropzone.options.uploadWidget = {
    url: '/upload',
    paramName: 'file',
    maxFilesize: 10000,
    clickable: false,
    dictDefaultMessage: 'Drag a clip here to upload'
};

$(() => {
	if (window.EventSource) {
        fetch('/youtube-url')
        .then(response => response.json())
        .then((responseJson) => {
            const source = new EventSource(responseJson.youtube_url + '/uploads-stream', {withCredentials: true});

            source.addEventListener('message', function (e) {
                $("#torrents-table-body").html();
                var noTorrentsMessage = $('#no-torrents');
                var uploadsArray = JSON.parse(e.data);
                if (uploadsArray.length > 0) {
                    if (noTorrentsMessage.length) {
                        noTorrentsMessage.remove();
                    }

                    var newHtml = "";
                    uploadsArray.forEach(upload => {
                        newHtml += `<tr id="${upload.uid}">
                            <td id="uid">
                                ${upload.uid}
                            </td>
                            <td id="status">
                                ${upload.status}
                            </td>
                            <td id="filename">
                                ${upload.filename}
                            </td>
                            <td id="fileSize">
                                ${upload.fileSize}
                            </td>
                            <td id="youtubeId">
                                ${upload.youtubeId}
                            </td>
                            <td id="progress">
                                <div class="progress" style="height: 20px;">
                                    <div class="progress-bar" role="progressbar" style="width: ${upload.progress}%;" aria-valuenow="${upload.progress}" aria-valuemin="0"
                                        aria-valuemax="100">
                                    </div>
                                </div>
                            </td>
                        </tr>`;
                    });
                    $("#uploads-table-body").html(newHtml);
                }
                else {
                    if (noTorrentsMessage.length == 0) {
                        $('#uploads-table-body').html("");
                        $('#uploads-table-body').after('<h3 id="no-torrents">No torrents to show</h3>')
                    }
                }
            }, false);

            source.addEventListener('open', function (e) {
                console.log("Connected");
            }, false);

            source.addEventListener('error', function (e) {
                source.close();
            }, false);
        });
	}
});