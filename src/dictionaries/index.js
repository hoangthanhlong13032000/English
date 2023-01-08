const cambridge = require('./cambridge');
const models = require('../models');
const miniget = require('miniget');
const fs = require('fs');

const get = async (word) => {
    const regex = new RegExp(`^${word}$`, 'i');
    let data = await models.cambridge.find({title: regex});
    if (!data || !data.length) {
        data = await cambridge.get(word);
        if (!data || !data.length) throw Error(`Word = \"${word}\" not found!`);
        save(data[0].title, data);
    }
    try {
        const downloading = {};
        for (const d of data) {
            if (d.pronounce.us.media && !downloading[d.pronounce.us.media]) {
                downloadAudio(d.pronounce.us.media);
                downloading[d.pronounce.us.media] = true;
            };
            if (d.pronounce.uk.media && !downloading[d.pronounce.uk.media]) {
                downloadAudio(d.pronounce.uk.media);
                downloading[d.pronounce.uk.media] = true;
            }
        }
    } catch (e) {
        console.log(`Error when download audio: ${e.toString()}`);
    }
    return data;
}

const save = (word, data) => {
    models.cambridge.findOne({title: new RegExp(`^${word}$`, 'i')}).then(
        result => {
            if(result) return;
            models.cambridge.insertMany(data).then(
                res => console.log(`Save word: ${word} to database success`),
                err => console.log(`Save word: ${word} to database error: \n${err.toString()}`)
            );
        }
    );
}

const downloadAudio = (path) => {
    const file_path = '.' + path;

    if (fs.existsSync(file_path)) return;

    const dir_path = '.' + path.substring(0, path.lastIndexOf("\/") + 1);
    const download = () => {
        const url = 'https://dictionary.cambridge.org' + path;
        const writableStream = fs.createWriteStream(file_path);
        miniget(url).pipe(writableStream).on('finish', () => {
            console.log(`Download audio path = \"${url}\" SUCCESS`);
        }).on('error', () => {
            console.log(`Download audio path = \"${url}\" ERROR`);
        });
    }

    if (!fs.existsSync(dir_path)) fs.mkdir(dir_path, {recursive: true}, download);
    else download();
}
module.exports = {get}