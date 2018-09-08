const _ = require('lodash'),
    hbs = require('hbs');
const {getMessageObject} = require('./../message-handler/message-handler');

// Move to global const
const MAX_PER_PAGE = 12;

// Sort functions
const clipSort_year = (a, b) => a.year - b.year;

const Utils = {
    renderTemplateToResponse(req, res, page, obj) {
        obj.isAuth = req.isAuthenticated();
        if (!_.isEmpty(hbs.handlebars.partials)) {
            res.render(page, obj);
        } else {
            res.status(500).send('Something went wrong! Please wait a moment then attempt your request again...');
        }
    },
    renderMessageToResponse(req, res, messageCode, options) {
        const messageObject = getMessageObject(messageCode, options);
        Utils.renderTemplateToResponse(req, res, 'pages/error', {
            error_title: messageObject.TITLE,
            error_description: messageObject.DESCRIPTION
        });
    },
    shuffleArray: (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    },
    createHomeParameters: (queries, mongoClips) => {
        const obj = {};
        obj.listStyle = queries.listStyle ? queries.listStyle : 'grid';
        obj.numResults = mongoClips.length;
        obj.title = queries.title;
        obj.years = [
            { year: 'Any Year', selected: queries.year === 'Any Year' || _.isEmpty(queries) },
            { year: '1991', selected: queries.year === '1991' },
            { year: '1992', selected: queries.year === '1992' },
            { year: '1993', selected: queries.year === '1993' },
            { year: '1994', selected: queries.year === '1994' },
            { year: '1995', selected: queries.year === '1995' },
            { year: '1996', selected: queries.year === '1996' }
        ];
        obj.members = [
            { name: 'Papa', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Papa') },
            { name: 'Grandma', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Grandma') },
            { name: 'John', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('John') },
            { name: 'Valerie', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Valerie') },
            { name: 'Colin', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Colin') },
            { name: 'Kelsey', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Kelsey') },
            { name: 'Rick', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Rick') },
            { name: 'Lauralyn', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Lauralyn') },
            { name: 'Alicia', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Alicia') },
            { name: 'Olivia', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Olivia') },
            { name: 'Dave', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Dave') },
            { name: 'Kim', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Kim') },
        ];
        obj.tags = [
            { tag: 'Cute', selected: queries.tags === undefined ? false : queries.tags.includes('Cute') },
            { tag: 'Funny', selected: queries.tags === undefined ? false : queries.tags.includes('Funny') },
            { tag: 'Heartwarming', selected: queries.tags === undefined ? false : queries.tags.includes('Heartwarming') },
            { tag: 'Holidays', selected: queries.tags === undefined ? false : queries.tags.includes('Holidays') },
            { tag: 'Birthdays', selected: queries.tags === undefined ? false : queries.tags.includes('Birthdays') },
            { tag: 'Sports', selected: queries.tags === undefined ? false : queries.tags.includes('Sports') }
        ];
        obj.locations = [
            { location: 'Any Place', selected: queries.location === undefined ? _.isEmpty(queries) : queries.location.includes('Any Place') },
            { location: 'Horseshoe Valley', selected: queries.location === undefined ? false : queries.location.includes('Horseshoe Valley') },
            { location: "Papa & Grandma's", selected: queries.location === undefined ? false : queries.location.includes("Papa & Grandma's") },
            { location: 'Rumball House', selected: queries.location === undefined ? false : queries.location.includes('Rumball House') },
            { location: 'Lean House', selected: queries.location === undefined ? false : queries.location.includes('Lean House') },
            { location: 'Cobourg', selected: queries.location === undefined ? false : queries.location.includes('Cobourg') }
        ];
        obj.ratings = [
            { rating: '1', selected: queries.ratings === undefined ? false : queries.ratings.includes('1') },
            { rating: '2', selected: queries.ratings === undefined ? false : queries.ratings.includes('2') },
            { rating: '3', selected: queries.ratings === undefined ? false : queries.ratings.includes('3') },
            { rating: '4', selected: queries.ratings === undefined ? false : queries.ratings.includes('4') },
            { rating: '5', selected: queries.ratings === undefined ? false : queries.ratings.includes('5') }
        ];
        obj.currentPage = _.isEmpty(queries) ? 1 : parseInt(queries.page);
        obj.maxPages = Math.max(Math.ceil(mongoClips.length / MAX_PER_PAGE), 1);
        // randomize if looking for root route
        if (_.isEmpty(queries)) {
            Utils.shuffleArray(mongoClips);
            obj.isRandom = true;
        }
        obj.clips = Utils.createClipsObject(mongoClips, obj.currentPage, obj.listStyle);
        return obj;
    },
    createClipsObject: (clips, pageNumber, listStyle) => {
        // Start from the first clip of the page they are looking for
        const startIndex = (pageNumber - 1) * MAX_PER_PAGE;
        if (clips.length > startIndex)
        {
            // Determine how many remain to list on the page
            const max = clips.length > startIndex + MAX_PER_PAGE ? MAX_PER_PAGE : clips.length - startIndex;
            // Splice the clips down to one page amount
            clips = clips.slice(startIndex, startIndex + max);
        }

        // Sort the clips. Default is ascending by year.
        clips.sort(clipSort_year);
        clips.forEach((clip) => {
            if (clip.members) {
                clip.members = clip.members.join(', ');
            }
            if (clip.tags) {
                clip.tags = clip.tags.join(', ');
            }
            // Eww
            clip.listStyle = listStyle;
        });
        return clips;
    }
};

module.exports = Utils;
