const express = require('express');
const path = require("path");
const multer = require("multer");

const instance = (root) => {
    const app = express();


    /**
     * Set view engine and public views folder
     */
    app.set('views', path.join(root, 'src', 'views'));
    app.set('view engine', 'ejs');



    /**
     * This is a built-in middleware function in Express.
     * It parses incoming requests with urlencoded payloads and is based on body-parser.
     */
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use(express.static(path.join(root, 'src', 'views')));
    app.use('/media', express.static(path.join(root, 'media')));



    /**
     * Multer is a node.js middleware for handling multipart/form-data,
     * which is primarily used for uploading files. It is written on top of busboy for maximum efficiency.
     */

    const upload = multer();
    app.use(upload.array());

    return app;
}

module.exports = instance