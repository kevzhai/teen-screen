var mongoose = require('mongoose');

var entrySchema = mongoose.Schema({
  // fill this out
});

var Entry = mongoose.model('Entry', entrySchema);
module.exports = Entry;