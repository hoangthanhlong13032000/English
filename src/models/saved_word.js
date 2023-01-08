const mongoose = require('mongoose')

const SavedWordSchema = mongoose.Schema({
    title: {type: String, require: true},
    note: {type: String, require: false},
    added: {type: Boolean, require: true, default: false},
    group: {type: String, require: true, default: 'default'},
});

module.exports = mongoose.model('saved_words', SavedWordSchema);