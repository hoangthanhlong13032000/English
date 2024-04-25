const mongoose = require('mongoose')

const PronSchema = mongoose.Schema({
    text: {type:String, default: ''},
    media: {type:String, default: ''}
});
const PronounceSchema = mongoose.Schema({
    us: PronSchema, 
    uk: PronSchema
});
const MeaningSchema = mongoose.Schema({
    info: {type: String, default: ''},
    meaning: {type:String, default: '', return: true},
    examples: [String]
})
const PhraseSchema = mongoose.Schema({
    title: {type:String, default: ''},
    info: {type: String, default: ''},
    meanings: [MeaningSchema],
})
const ContentSchema = mongoose.Schema({
    guideword: {type:String, default: ''},
    meanings: [MeaningSchema],
    phrases: [PhraseSchema]
})
const WordSchema = mongoose.Schema({
    category: {type: String, default: ''},
    title: {type: String, require: true},
    grammar: {type: String, default: ''},
    pronounce: PronounceSchema,
    infl: {type: String, default: ''},
    info: {type: String, default: ''},
    contents: [ContentSchema]
})

module.exports = mongoose.model('cambridge', WordSchema);