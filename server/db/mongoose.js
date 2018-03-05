var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useMongoClient: true }, (err) => {

}).then((e, a) => {
	
}).catch((err) => {

});

module.exports = {
    mongoose
};