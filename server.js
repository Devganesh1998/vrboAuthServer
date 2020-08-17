require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const db = require("./models");
const passport = require("passport");
const redis = require("./redisInstance");

const PORT = process.env.PORT || 3000;

redis.client.on("error", function (error) {
  console.log("An error occurred with redis:" + error);
});

const app = express();
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Set-Cookie");
  res.header('Access-Control-Allow-Credentials', true);
  res.header("Access-Control-Expose-Headers", "Set-Cookie");
  next();
});

const apiRoutes = require("./app/routes");

app.get("/info", (req, res) => {
  res.send("Welcome to AuthServer of vrbo");
});

app.use("/", apiRoutes);

db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`listening on: http://localhost:${PORT}`);
  });
});
