const express = require("express");
const router = express.Router();
let jwt = require("jsonwebtoken");
const { QueryTypes } = require("sequelize");
const { body, validationResult } = require("express-validator");

const db = require("../../models");

router.post(
  "/register",
  [
    body("email").exists().bail().isEmail(),
    body("name").exists(),
    body("accessToken").exists(),
    body("googleId").exists(),
    body("imageUrl").exists(),
    body("expires_at").exists(),
    body("expires_in").exists(),
    body("first_issued_at").exists(),
  ],
  (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const accessToken = req.body.accessToken;
    const googleId = req.body.googleId;
    const imageUrl = req.body.imageUrl;
    const expires_at = req.body.expires_at;
    const expires_in = req.body.expires_in;
    const first_issued_at = req.body.first_issued_at;

    const resData = {};

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        errormsg: "Please send required Details",
        "Required fields": [
          "name",
          "email",
          "accessToken",
          "googleId",
          "imageUrl",
          "expires_at",
          "expires_in",
          "first_issued_at",
        ],
        "sample Format": {
          name: "test",
          email: "TestEmail@mail.com",
          accessToken: "testaccessToken",
          googleId: "testgoogleId",
          imageUrl: "some url to image",
          expires_at: "28372873828",
          expires_in: "2736273",
          first_issued_at: "2736232323",
        },
      });
    }

    db.users
      .create({
        name: name,
        email: email,
      })
      .then((submitedUser) => {
        resData.user = submitedUser;
        return submitedUser;
      })
      .then((submitedUser) => {
        return db.oauth_infos.create({
          provider: "Google",
          providerId: googleId,
          accessToken: accessToken,
          imageUrl: imageUrl,
          expires_at: expires_at,
          expires_in: expires_in,
          first_issued_at: first_issued_at,
          userId: submitedUser.id,
        });
      })
      .then((submitOauthDetails) => {
        resData.userOauth = submitOauthDetails;
        const payload = {
          email: email,
          googleToken: accessToken,
          expires_at: expires_at
        };
        const auth_token = jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: expires_in - 10 });
        res.cookie('auth_token', auth_token, { maxAge: expires_in - 10, httpOnly: true });
        res.send(resData);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ "Internal Server Error": err });
      });
    }
    );
    
router.post(
  "/login",
  [
    body("email").exists().bail().isEmail(),
    body("accessToken").exists(),
    body("googleId").exists(),
    body("imageUrl").exists(),
    body("expires_at").exists(),
    body("expires_in").exists(),
    body("first_issued_at").exists(),
  ],
  (req, res) => {
    const email = req.body.email;
    const accessToken = req.body.accessToken;
    const googleId = req.body.googleId;
    const imageUrl = req.body.imageUrl;
    const expires_at = req.body.expires_at;
    const expires_in = req.body.expires_in;
    const first_issued_at = req.body.first_issued_at;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        errormsg: "Please send required Details",
        "Required fields": [
          "email",
          "accessToken",
          "googleId",
          "imageUrl",
          "expires_at",
          "expires_in",
          "first_issued_at",
        ],
        "sample Format": {
          email: "TestEmail@mail.com",
          accessToken: "testaccessToken",
          googleId: "testgoogleId",
          imageUrl: "some url to image",
          expires_at: "28372873828",
          expires_in: "2736273",
          first_issued_at: "2736232323",
        },
      });
    }
    
    const resData = {};
    
    db.sequelize
    .query(
      "UPDATE oauth_infos SET accessToken = $accessToken, providerId = $providerId, imageUrl = $imageUrl, expires_at = $expires_at, expires_in = $expires_in, first_issued_at = $first_issued_at WHERE userId = (SELECT id FROM users WHERE email = $email)",
      {
        bind: {
          email: email,
          accessToken: accessToken,
          providerId: googleId,
          imageUrl: imageUrl,
          expires_at: expires_at,
          expires_in: expires_in,
          first_issued_at: first_issued_at,
        },
        type: QueryTypes.UPDATE,
      }
      )
      .then((submitedUser) => {
        resData.updateDetails = submitedUser;
        const payload = {
          email: email,
          googleToken: accessToken,
          expires_at: expires_at
        };
        const auth_token = jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: expires_in - 10 });
        res.cookie('auth_token', auth_token, { maxAge: expires_in - 10, httpOnly: true });
        res.send(resData);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ "Internal Server Error": err });
      });
    }
    );
    
    module.exports = router;
    