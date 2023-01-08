const models = require('../../models')

const get = async (req, res) => {
    const group = req.query.group;
    const filter = group ? {group: group} : {};
    
    models.savedWord.find(filter)
        .then(words => res.status(200).send({status: true, data: words}))
        .catch(error => res.status(400).send({status: false, message: error.toString()}));
}

const save = async (req, res) => {
    const word = {
        title : req.body.title,
        note : req.body.note || '',
        added : req.body.added || false,
        group : req.body.group,
    }

    if(!word.title || !word.group) res.status(400).send({status: false, message: 'Title and Group are required!'});

    else if(word.added && !word.note) res.status(400).send({status: false, message: 'Note are required for added words!'});
    
    else models.savedWord.updateOne({title: word.title}, word, {upsert: true})
    .then(result => {
        console.log(`Save word: ${JSON.stringify(word)} to database success`);
        res.status(200).send({status: true, data: {result, word}});
    })
    .catch(error =>  {
        console.log(`Save word: ${JSON.stringify(word)} to database error: \n${error.toString()}`)
        res.status(400).send({status: false, message: error.toString()});
    });
}

const remove = async (req, res) => {
    const filter = {}
    if(req.body.titles && req.body.titles.length) filter.title = {$in: req.body.titles};
    else if(req.body.group) filter.group = req.body.group;

    if(!filter.title && !filter.group) res.status(400).send({status: false, message: 'Title or Group are required!'});

    else models.savedWord.deleteMany(filter)
    .then(result => {
        if(filter.title) console.log(`Delete word: ${JSON.stringify(filter.title)} success`);
        else if(filter.group) console.log(`Delete group: ${JSON.stringify(filter.group)} success`);
        res.status(200).send({status: true, data: result});
    })
    .catch(error =>  {
        if(filter.title) console.log(`Delete word: ${JSON.stringify(filter.title)} error: ${error.toString()}`);
        else if(filter.group) console.log(`Delete group: ${JSON.stringify(filter.group)} error: ${error.toString()}`);
        res.status(400).send({status: false, message: error.toString()});
    });
}


module.exports = {get, save, remove}