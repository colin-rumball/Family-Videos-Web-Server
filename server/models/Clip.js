var mongoose = require('mongoose');

var Clip = mongoose.model('Clip', {
    tapeId: {
        type: Number,
        required: true
    },
    clipId: {
        type: Number,
        required: true
    },
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    filmedBy: {
        type: String,
        trim: true
    },
    familyMembers: {
        type: Array,
        trim: true
    },
    entertainmentRating: {
        type: Number,
        default: null
    },
    youtubeId: {
        type: String,
        default: null
    },
    tags: {
        type: Array
	},
	state: {
		type: String,
		required: true
	}
});

module.exports = {
    Clip
};