require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const router = require('./routers');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
//---------------------------------------------
app.use(cookieParser());
app.use(express.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb' , extended: true }));
app.engine('hbs', exphbs.engine({extname: '.hbs'}));
app.set('view engine', 'hbs');
app.use('/',router);
//---------------------------------------------
//******************************************** */
server.listen(port, function() {
   console.log('App running on Port : ' + port);
});
//******************************************** */