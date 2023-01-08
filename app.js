/**
 dotenv module to use custom environments define in .env file
 */
const dotenv = require('dotenv')
dotenv.config();




/**
 rest api app with expressJs
 */
const express = require('./src/config/express') ;
const app = express(__dirname);


/**
 connect to mongodb database
 */
const database = require('./src/config/database');
database.connect();



/**
 route app (define get, post, put, ... request, response)
 */
const routes = require('./src/routes');
routes(app);


const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`✅ Server is listening on port ${port}`))