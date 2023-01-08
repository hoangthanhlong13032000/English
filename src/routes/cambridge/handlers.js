const dictionaries = require('../../dictionaries');

const search = async (req, res) => {
    const word = req.query.search;

    if (!word) res.status(400).send({ status: false, message: 'Word not found!' });
    else dictionaries.get(word)
        .then(
            data => {
                res.status(200).send({ status: true, data: data });
            }
        ).catch(
            error => {
                res.status(400).send({ status: false, message: error.toString() });
            }
        );
}

const bulk_search = async (req, res) => {
    const words = req.body.words;

    if (!words || !Array.isArray(words)) res.status(400).send({ status: false, message: 'Bad parameters!' })
    else {
        let success = [];
        let fail = [];
        {
            const promise = [];
            for (const word of words) {
                promise.push(
                    dictionaries.get(word)
                    .then(data => success = [...success, data])
                    .catch(error => {
                        console.log(`Get word = ${word} fail: ${error.toString()}`);
                        fail.push(word);
                    })
                )
            }
            await Promise.all(promise);
        }
        if(fail.length) {
            console.log(`Trying get fail words: ${fail} ...`);
            const promise = [];
            const retry = fail;
            fail = [];
            for (const word of retry) {
                promise.push(
                    dictionaries.get(word)
                    .then(data => success = [...success, data])
                    .catch(error => {
                        console.log(`Get word = ${word} fail: ${error.toString()}`);
                        fail.push(word)
                    })
                )
            }
            await Promise.all(promise);
        }
        const status = !!success.length;
        res.status(status ? 200 : 400).send({status: status, data: success, fail: fail});
    }
}

module.exports = { search, bulk_search }