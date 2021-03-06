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
  creationDate: {
    type: Date,
    required: true,
    default: Date.now // create automatically
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now // create automatically
  },
  language: {
    type: String,
    required: true
  },
  description: String,
  sponsor: String,
  protocol: String,
  site: String,
  dpsScore: Number,
  impairmentScore: Number,
  positiveReasons: [String],
	formResponses: [mongoose.Schema.Types.Mixed],
  clinicSig: {}
});

var Screen = mongoose.model('Screen', screenSchema);
module.exports = Screen;