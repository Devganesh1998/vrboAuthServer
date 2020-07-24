require('dotenv').config();

const express = require("express");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const db = require("./models");
const cors = require('cors')

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
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


// const cardProperty = {
//   "title": "BRAND NEW LISTING in SEASIDE!! - WEST INDIAN – 15% Off August!! - 90-Seconds to Beach, 2 Minutes...",
//   "category": "house",
//   "sleeps": 2,
//   "bedrRooms": 4,
//   "bathRooms": 3,
//   "halfBaths": 3,
//   "area":  "737 sq.ft",
//   "minStay": '3-5 nights',
//   "pricePerNight":  304,
//   "totalPrice": 6166,
//   "rating": 4
// }