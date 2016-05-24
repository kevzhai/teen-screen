var mongoose = require('mongoose');

var screenSchema = mongoose.Schema({
	subject: String,
	responses: [mongoose.Schema.Types.Mixed]
});

var Screen = mongoose.model('Screen', screenSchema);
module.exports = Screen;