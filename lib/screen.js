var mongoose = require('mongoose');

var screenSchema = mongoose.Schema({
	subject: String,
	responses: []
});

var Screen = mongoose.model('Screen', screenSchema);
module.exports = Screen;