require('dotenv').config();

const fs = require('fs');
const https = require('https');
const express = require("express");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const db = require("./models");
const cors = require('cors')

const PORT = process.env.PORT || 3000;

var privateKey  = fs.readFileSync('sslcert/privkey.pem', 'utf8');
var certificate = fs.readFileSync('sslcert/fullchain.pem', 'utf8');

const credentials = {key: privateKey, cert: certificate};

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const apiRoutes = require("./Routes");

app.get('/info', (req, res) => {
  res.send("Welcome to AuthServer of vrbo");
});

app.use("/", apiRoutes);

const httpsServer = https.createServer(credentials, app);

db.sequelize.sync().then(() => {
  httpsServer.listen(PORT, () => {
    console.log(`listening on: https://localhost:${PORT}`);
  });
});
