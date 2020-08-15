const { body, validationResult } = require("express-validator");

let jwt = require("jsonwebtoken");
const User = require("../model/UserModel");

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
    .then(() => User.createUser(firstName + " " + lastName, email, password))
    .then((submitedUser) => {
      resData = {
        user: { email: submitedUser.email, name: submitedUser.name },
        isRegisterSuccess: true,
      };
      return submitedUser;
    })
    .then((submitedUser) => {
      const payload = {
        email: email,
      };
      const auth_token = jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: 60 * 60 * 3,
      });
      res.cookie("auth_token", auth_token, {
        maxAge: 60 * 60 * 3,
        httpOnly: true,
      });
      res.send(resData);
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
    .then((submitedUser) => {
      console.log(submitedUser[0], password)
      if (submitedUser[0].password === password) {
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
    .then((submitedUser) => {
      const payload = {
        email: submitedUser[0].email,
      };
      const auth_token = jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: 60 * 60 * 3,
      });
      res.cookie("auth_token", auth_token, {
        maxAge: 60 * 60 * 3,
        httpOnly: true,
      });
      res.send(resData);
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
