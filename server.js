require('dotenv').config();

const express = require("express");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const db = require("./models");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const apiRoutes = require("./Routes/index");
app.use("/", apiRoutes);

db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`listening on: http://localhost:${PORT}`);
  });
});
