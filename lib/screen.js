var mongoose = require('mongoose');

var screenSchema = new mongoose.Schema({
  admin: {
    type: String,
    required: true
  },
	subjectID: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  description: String,
  sponsor: String,
  protocol: String,
  site: String,
	responses: [mongoose.Schema.Types.Mixed]
});

var Screen = mongoose.model('Screen', screenSchema);
module.exports = Screen;