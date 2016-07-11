var mongoose = require('mongoose');

var screenSchema = new mongoose.Schema({
  admin: String,
	subjectID: String,
	responses: [mongoose.Schema.Types.Mixed]
});

var Screen = mongoose.model('Screen', screenSchema);
module.exports = Screen;