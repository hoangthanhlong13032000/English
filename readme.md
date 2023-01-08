# English Dictionary App
A web app to get data from cambridge dictionary ...
# File
- Config file : `.env` : config environment variables (port, database, ...) ...

- Main file: `app.js` :
# Run
    node app.js
# Api

## Get word
### By id
`GET /api/dictionary/cambridge?search={word}`

    http://localhost:3333/api/dictionary/cambridge?search=hello

### Response
    {status: boolean, data: [], message: ""}
    status: true - success, false - fail