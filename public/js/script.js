

$(document).ready(function()
{  
    images = document.querySelectorAll('#playImage');
	for(var i = 0; i < images.length; i++) 
	{
        $(images[i]).on('click', onClipClicked);
    }

    $("#SearchQuery").keydown(function(event) {
        onKeyPressed_TitleQuery(event);
    });

    $('.familyMembers').each(function(index) {
        $( this ).on('click', function(e) {
            formSubmit();
        });
    });

    $('.years').each(function(index) {
        $( this ).on('click', function(e) {
            formSubmit();
        });
    });

    $('.locations').each(function(index) {
        $( this ).on('click', function(e) {
            formSubmit();
        });
    });

    $('.tags').each(function(index) {
        $( this ).on('click', function(e) {
            formSubmit();
        });
    });

    $('.entertainmentRatings').each(function(index) {
        $( this ).on('click', function(e) {
            formSubmit();
        });
    });
});

var onClipClicked = function(e) {
    this.outerHTML = `<iframe src="${this.alt}" allowfullscreen="allowfullscreen"
    mozallowfullscreen="mozallowfullscreen" 
    msallowfullscreen="msallowfullscreen" 
    oallowfullscreen="oallowfullscreen" 
    webkitallowfullscreen="webkitallowfullscreen"></iframe>`;
};

var formSubmit = () => {

    var titleQuery;
    var famMembers = [];
    var year;
    var location;
    var tags = [];
    var entertainmentRatings = [];

    titleQuery = $('#SearchQuery').val();

    $(".familyMembers").each(function(index) {
        if (this.checked)
        {
            famMembers.push(this.value);
        }
    });

    $(".years").each(function(index) {
        if (this.checked && this.value != 'any')
        {
            year = this.value;
            return false;
        }
    });

    $(".locations").each(function(index) {
        if (this.checked && this.value != 'any')
        {
            location = this.value;
            return false;
        }
    });

    $(".tags").each(function(index) {
        if (this.checked)
        {
            tags.push(this.value);
        }
    });

    $(".entertainmentRatings").each(function(index) {
        if (this.checked)
        {
            entertainmentRatings.push(this.value);
        }
    });

    var queryData = {
        titleQuery: titleQuery.length > 0 ? titleQuery : undefined,
        familyMembers: famMembers.length > 0 ? famMembers : undefined,
        year,
        location,
        tags: tags.length > 0 ? tags : undefined,
        entertainmentRatings: entertainmentRatings.length > 0 ? entertainmentRatings : undefined
    };

    $.ajax({
        type: "GET",
        url: "https://rumball-home-videos.herokuapp.com/clips/"+encodeURIComponent(JSON.stringify(queryData)),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        complete: (res) => {
            if (res.status == 200)
            {
                fillClips(res.responseJSON);
            }
            else
            {
                alert(`ERROR`);
            }
        }
    });
    
    return false;
};

var onKeyPressed_TitleQuery = (event) => {
    formSubmit();
};

var onClearClicked = (e) => {
    $('#SearchQuery').val('');

    $(".familyMembers").each(function(index) {
        this.checked = false;
    });

    $(".years").each(function(index) {
        this.checked = false;
        if (this.value == 'any')
        {
            this.checked = true;
        }
    });

    $(".locations").each(function(index) {
        this.checked = false;
        if (this.value == 'any')
        {
            this.checked = true;
        }
    });

    $('.tags').each(function(index) {
        this.checked = false;
    });

    $(".entertainmentRatings").each(function(index) {
        this.checked = false;
    });

    formSubmit();
};

var fillClips = (res) => {
    $('#clip-list').html('');

    var clips = res.clips;

    var newHTML = "";
     for (var i = 0; i < clips.length; i++)
    {
        var clipHTML =
        '<div class="clip">' +
            '<table>' +
            '<tr>' +
                '<td>' +
                `<img src="/../public/images/playbutton.png" id="playImage" alt="https://www.youtube.com/embed/${clips[i].youtubeId}">` +
                '</td>' +
                '<td>' +
                '<div id="content">' +
                    '<div id="header">' +
                        `<span id="title">${clips[i].title}</span>` +
                        `<span id="year">${clips[i].year}</span>` +
                        `<div id="location">${clips[i].location}</div>` +
                    '</div>' +
                    '<div id="body">' +
                        `<div id="familyMembers">${clips[i].familyMembers}</div>` +
                    '</div>' +
                    '<div id="footer">' +
                        `<span id="tags">${clips[i].tags}</span>` +
                        `<span id="entertainmentRating">&#9733;${clips[i].entertainmentRating}</span>` +
                    '</div>' +
                '</div>' +
                '</td>' +
            '</tr>' +
            '</table>' +
            '<div id="footer-background"></div>' +
        '</div>';
        newHTML += clipHTML;
    }

    $('#clip-list').html(newHTML);

    images = document.querySelectorAll('#playImage');
	for(var i = 0; i < images.length; i++) 
	{
        $(images[i]).on('click', onClipClicked);
    }
};