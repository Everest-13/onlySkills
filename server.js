var express = require('express');

var app = express();

app.use("/assets", express.static(__dirname + '/public/web/assets'));

app.use("/store/avatar", express.static(__dirname + '/public/store/avatar'));

app.use("/store/cv", express.static(__dirname + '/public/store/cv'));

app.use("/store/motivation", express.static(__dirname + '/public/store/motivation'));


app.use(express.json());

app.use(express.urlencoded());

const cookieSession = require('cookie-session');

app.use(cookieSession({
        name: 'session',
        secret: 'mot-de-passe-du-cookie'}
    )
);

require('./app/Router')(app);






app.listen(3000, () => console.log('listening on http://localhost:3000'));
