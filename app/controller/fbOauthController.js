let jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const User = require("../model/UserModel");
const OauthInfo = require("../model/OauthInfosModel");

const redis = require("../../redisInstance");

exports.fbOauth = (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const accessToken = req.body.accessToken;
  const fbId = req.body.fbId;
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
        "fbId",
        "imageUrl",
        "expires_at",
        "expires_in",
        "first_issued_at",
      ],
      "sample Format": {
        name: "test",
        email: "TestEmail@mail.com",
        accessToken: "testaccessToken",
        fbId: "testfbId",
        imageUrl: "some url to image",
        expires_at: "28372873828",
        expires_in: "2736273",
        first_issued_at: "2736232323",
      },
    });
  }

  User.getUserIdByMail(email)
    .then((result) => {
      if (result.length === 0) {
        User.createUser(name, email)
          .then((submitedUser) => {
            resData.user = submitedUser;
            return submitedUser;
          })
          .then((submitedUser) =>
            OauthInfo.createRow(
              "faceBook",
              fbId,
              accessToken,
              imageUrl,
              expires_at,
              expires_in,
              first_issued_at,
              submitedUser.id
            )
          )
          .then(async (submitOauthDetails) => {
            resData.userOauth = submitOauthDetails;
            const randomHash = await bcrypt.hash(
              email +
                new Date().valueOf().toString() +
                Math.random().toFixed(5).toString(),
              1
            );
            const payload = {
              email: email,
              name: name, 
              provider: "facebook",
              fbToken: accessToken,
              expires_at: expires_at,
              hash: randomHash
            };
            const auth_token = jwt.sign(payload, process.env.TOKEN_SECRET, {
              expiresIn: expires_in - 10,
            });
            const expirationMilliSeconds = (expires_in - 10) * 1000;
            res.cookie(
              "vrbocloneSessionId", randomHash,
              {
                maxAge: expirationMilliSeconds,
                httpOnly: true,
                secure: true,
                domain: 'devganesh.tech',
                sameSite: true
              }
            );
            redis.client.setex(randomHash, expires_in - 10, auth_token, (err, reply) => {
              if (err) {
                console.log(err);
                res.status(200).json({
                  errorMsg: "Session not being maintained, Please Login again",
                  isAuthenticated: true,
                  userOauth: resData.userOauth
                });
              } else {
                resData.isAuthenticated = true;
                res.send(resData);
              }
            });
          })
          .catch((err) => {
            console.log(err);
            res
              .status(500)
              .json({ "Internal Server Error": err, isAuthenticated: false });
          });
      } else {
        OauthInfo.updateInfo(
          email,
          accessToken,
          fbId,
          imageUrl,
          expires_at,
          expires_in,
          first_issued_at
        )
          .then(async (submitedUser) => {
            resData.updateDetails = submitedUser;
            const randomHash = await bcrypt.hash(
              email +
                new Date().valueOf().toString() +
                Math.random().toFixed(5).toString(),
              1
            );
            resData.user = {
              name: name,
              email: email,
            };
            const payload = {
              email: email,
              name: name, 
              provider: "facebook",
              fbToken: accessToken,
              expires_at: expires_at,
              hash: randomHash
            };
            const auth_token = jwt.sign(payload, process.env.TOKEN_SECRET, {
              expiresIn: expires_in - 10,
            });
            const expirationMilliSeconds = (expires_in - 10) * 1000;
            res.cookie(
              "vrbocloneSessionId", randomHash,
              {
                maxAge: expirationMilliSeconds,
                httpOnly: true,
                secure: true,
                domain: 'devganesh.tech',
                sameSite: true
              }
            );
            redis.client.setex(randomHash, expires_in - 10, auth_token, (err, reply) => {
              if (err) {
                console.log(err);
                res.status(200).json({
                  errorMsg: "Session not being maintained, Please Login again",
                  isAuthenticated: true,
                  user: resData.user
                });
              } else {
                resData.isAuthenticated = true;
                res.send(resData);
              }
            });
          })
          .catch((err) => {
            console.log(err);
            res
              .status(500)
              .json({ "Internal Server Error": err, isAuthenticated: false });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res
        .status(500)
        .json({ "Internal Server Error": err, isAuthenticated: false });
    });
};
