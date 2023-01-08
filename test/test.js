const mongoose = require('mongoose')
const models = require('../src/models');

const connect = async () => {
    mongoose.connect('DB_URL=mongodb://localhost:27017/dictionary', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, async function (error) {
        if(error) {
            console.error(`❌ Connect database failed!\nError: '${error}'`)
        } else {
            console.log("✅ Connected database successfully!.");
            const result = await models.cambridge.deleteMany({title: 'scrap'});
            console.log(result);
        }
    });
}

connect()