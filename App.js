const express = require('express');
const routes = require('./routes/routes');

const app = express();
const port = 5000;

app.use(express.json());
routes(app);

const server = app.listen(port, (error) => {
    if (error) return console.error(error);
    console.log(`Server listening on port ${server.address().port}`);
});