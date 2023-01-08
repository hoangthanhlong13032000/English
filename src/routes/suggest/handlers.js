const axios = require("axios");

const BASE_URL = 'https://dictionary.cambridge.org/autocomplete/amp?dataset=english&q=';
const query = async (req, res) => {
    const search = req.query.search;

    if (!search) res.status(400).send([]);
    else axios.get(BASE_URL + search)
        .then(function (response) {
            res.status(200).send(response.data);
        })
        .catch(function (error) {
            res.status(400).send([]);
        })
}

module.exports = {query}