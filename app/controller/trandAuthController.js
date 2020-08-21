const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");

let jwt = require("jsonwebtoken");
const User = require("../model/UserModel");

const redis = require("../../redisInstance");

exports.checkMailStatus = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      errormsg: "Please send required Details",
      "Required fields": ["email"],
      "sample Format": {
        email: "TestEmail@mail.com",
      },
    });
  }

  const email = req.body.email;

  User.getUserIdByMail(email)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          message: "User Already Exists with given mail",
          isExistingUser: true,
        });
      } else {
        res.status(200).json({
          message: "User hasn't Registered yet",
          isExistingUser: false,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.send({ "Internal Server Error": err });
    });
};

exports.register = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      errormsg: "Please send required Details",
      "Required fields": ["email", "password", "lastName", "firstName"],
      "sample Format": {
        firstName: "test",
        lastName: "lasttest",
        email: "TestEmail@mail.com",
        password: "pass",
      },
    });
  }

  const firstName = req.body.firstName;
  const email = req.body.email;
  const lastName = req.body.lastName;
  const password = req.body.password;

  let resData = {};

  User.getUserIdByMail(email)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          errorMsg: "User Already Exists with given mail",
          isRegisterSuccess: false,
        });
        res.send();
        throw new Error("User Exists handled");
      }
    })
    .then(() => bcrypt.hash(password, 10))
    .then((hashedPassword) =>
      User.createUser(firstName + " " + lastName, email, hashedPassword)
    )
    .then((submitedUser) => {
      resData = {
        user: { email: submitedUser.email, name: submitedUser.name },
        isRegisterSuccess: true,
      };
      return submitedUser;
    })
    .then(async (submitedUser) => {
      const randomHash = await bcrypt.hash(
        email +
          new Date().valueOf().toString() +
          Math.random().toFixed(5).toString(),
        1
      );
      const payload = {
        email: email,
        name: firstName + " " + lastName,
        hash: randomHash,
      };
      const expirationSeconds = 60 * 60 * 3;
      const auth_token = jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: expirationSeconds,
      });
      res.cookie("vrbocloneSessionId", randomHash, {
        maxAge: expirationSeconds * 1000,
        httpOnly: true,
        secure: true,
        domain: "devganesh.tech",
        sameSite: true,
      });
      redis.client.setex(
        randomHash,
        expirationSeconds,
        auth_token,
        (err, reply) => {
          if (err) {
            console.log(err);
            res.status(200).json({
              errorMsg: "Session not being maintained, Please Login again",
              isRegisterSuccess: true,
              user: resData.user,
            });
          } else {
            res.send(resData);
          }
        }
      );
    })
    .catch((err) => {
      console.log(err);
      if (err.message != "User Exists handled") {
        res.status(500).json({ "Internal Server Error": err });
        res.send();
      }
    });
};

exports.login = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(200).json({
      errors: errors.array(),
      errormsg: "Please send required Details",
      "Required fields": ["email", "password"],
      "sample Format": {
        email: "TestEmail@mail.com",
        password: "pass",
      },
    });
  }

  const email = req.body.email;
  const password = req.body.password;

  let resData = {};

  User.getUserByMail(email)
    .then((result) => {
      if (result.length === 0) {
        res.status(200).json({
          errorMsg: "User doesn't Exists with given mail",
          isLoginSuccess: false,
        });
        res.send();
        throw new Error("User doesn't Exists handled");
      }
      return result;
    })
    .then(async (submitedUser) => {
      let hashCompareResult = await bcrypt.compare(
        password,
        submitedUser[0].password
      );
      if (hashCompareResult) {
        resData = {
          user: { email: submitedUser[0].email, name: submitedUser[0].name },
          isLoginSuccess: true,
        };
        return submitedUser;
      } else {
        res.status(200).json({
          errorMsg: "Incorrect Password",
          isLoginSuccess: false,
        });
        res.send();
        throw new Error("Incorrect Password handled");
      }
    })
    .then(async (submitedUser) => {
      const randomHash = await bcrypt.hash(
        email +
          new Date().valueOf().toString() +
          Math.random().toFixed(5).toString(),
        1
      );
      const payload = {
        email: submitedUser[0].email,
        name: submitedUser[0].name,
        hash: randomHash,
      };
      const expirationSeconds = 60 * 60 * 3;
      const auth_token = jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: expirationSeconds,
      });
      res.cookie("vrbocloneSessionId", randomHash, {
        maxAge: expirationSeconds * 1000,
        httpOnly: true,
        secure: true,
        domain: "devganesh.tech",
        sameSite: true,
      });
      redis.client.setex(
        randomHash,
        expirationSeconds,
        auth_token,
        (err, reply) => {
          if (err) {
            console.log(err);
            res.status(200).json({
              errorMsg: "Session not being maintained, Please Login again",
              isLoginSuccess: true,
              user: resData.user,
            });
          } else {
            res.send(resData);
          }
        }
      );
    })
    .catch((err) => {
      console.log(err);
      if (
        err.message != "User doesn't Exists handled" &&
        err.message != "Incorrect Password handled"
      ) {
        res.status(500).json({ "Internal Server Error": err });
        res.send();
      }
    });
};

exports.logout = async (req, res) => {
  try {
    const vrbocloneSessionId = req.cookies.vrbocloneSessionId;

    if (vrbocloneSessionId === null || vrbocloneSessionId === undefined) {
      res.send({
        msg: "Session already Expired",
        isLogoutSuccess: true,
      });
    } else {
      res.cookie("vrbocloneSessionId", "", {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        domain: "devganesh.tech",
        sameSite: true,
      });

      const temp = await redis.delWithPromise(vrbocloneSessionId);
      res.send({
        isLogoutSuccess: true,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ "Internal Server Error": err });
    res.send();
  }
};

exports.verifyAuthWithCookie = (req, res) => {
  const vrbocloneSessionId = req.cookies.vrbocloneSessionId;

  if (vrbocloneSessionId === null || vrbocloneSessionId === undefined) {
    res.send({
      msg: "Session Expired Login Again",
      isAuthenticated: false,
    });
  } else {
    redis.client.get(vrbocloneSessionId, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ "Internal Server Error": err });
        res.send();
      } else {
        const parsedJwt = jwt.decode(result);
        if (parsedJwt === null || parsedJwt === undefined) {
          res.send({
            isAuthenticated: false,
          });
        } else {
          const { name, email, hash } = parsedJwt;
          if (vrbocloneSessionId === hash) {
            res.send({
              user: {
                email: email,
                name: name,
              },
              isAuthenticated: true,
            });
          } else {
            res.send({
              isAuthenticated: false,
            });
          }
        }
      }
    });
  }
};

exports.verifyAuth = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      errormsg: "Please send required Details",
      "Required fields": ["vrbocloneSessionId"],
      "sample Format": {
        vrbocloneSessionId: "87fuefhiejh37hc83nc38hcwyvgrnhiq",
      },
    });
  }

  const vrbocloneSessionId = req.body.vrbocloneSessionId;

  redis.client.get(vrbocloneSessionId, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({ "Internal Server Error": err });
      res.send();
    } else {
      const parsedJwt = jwt.decode(result);
      if (parsedJwt === null || parsedJwt === undefined) {
        res.send({
          isAuthenticated: false,
        });
      } else {
        const { name, email, hash } = parsedJwt;
        if (hash === vrbocloneSessionId) {
          res.send({
            user: {
              email: email,
              name: name,
            },
            isAuthenticated: true,
          });
        } else {
          res.send({
            isAuthenticated: false,
          });
        }
      }
    }
  });
};
