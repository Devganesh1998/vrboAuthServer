# Vrbo Auth Server

It is a simple express server to authenticate using cookies and Redis as session management and uses MySQL as a database. It supports both Native email - password as well as Google / Facebook oath authentication. It is used as a service of authentication for a Project named VrboClone.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What things you need to install the software and how to install them

- npm

```
npm install npm@latest -g
```

### Installing

1. Clone the repo

```
git clone https://github.com/Devganesh1998/vrboAuthServer.git
```

2. Go to the downloaded folder and then install NPM packages

```
npm install
```

3. Create a .env file inside the current project folder and define the environment variables as mention in the sampleenv file

```
TOKEN_SECRET=   #Your secret key for JWT

PORT=8000

#MySQL config
NODE_ENV=development

DEV_HOST=
DEV_PASSWORD=


#NODE_ENV=production

#PROD_PASSWORD=
#PROD_HOST=

ALLOWED_ORIGIN=https://vrboclone.devganesh.tech     #Allowed domain to access the API


PRIVATE_ORIGIN=https://myprivate.domain.com     #domain to access private endpoints
```

## Folder structure

```
.
├── app
│   ├── controller
│   │   ├── fbOauthController.js
│   │   ├── googleOauthController.js
│   │   └── trandAuthController.js
│   ├── customMiddlewares
│   │   └── privatizeEndpoint.js
│   ├── model
│   │   ├── OauthInfosModel.js
│   │   └── UserModel.js
│   └── routes
│       ├── index.js
│       ├── oauth
│       │   ├── fbOauthRoutes.js
│       │   ├── googleOauthRoutes.js
│       │   └── index.js
│       └── trandAuthRoutes.js
├── config
│   └── config.js
├── models
│   ├── index.js
│   ├── user.js
│   └── userOauthInfo.js
├── package.json
├── package-lock.json
├── redisInstance
│   └── index.js
├── sampleenv
├── schema.txt
└── server.js

```

## Endpoints

### Native Register

POST `/register`

#### REQUEST

```json
{
  "firstName": "Ftest",
  "lastName": "Ltest",
  "email": "TestEmail@mail.com",
  "password": "testpass"
}
```

#### RESPONSE

- ##### If Registration successful

  cookie will be set with name vrbocloneSessionId

  ```json
  {
    "user": {
      "email": "TestEmail@mail.com",
      "name": "Ftest Ltest"
    },
    "isRegisterSuccess": true
  }
  ```

- ##### If given email already registered

  ```json
  {
    "errorMsg": "User Already Exists with given mail",
    "isRegisterSuccess": false
  }
  ```

- ##### If any error happend with cookie data or saving sessionId to Redis

  ```json
  {
    "errorMsg": "Session not being maintained, Please Login again",
    "isRegisterSuccess": true,
    "user": {
      "email": "TestEmail@mail.com",
      "name": "Ftest Ltest"
    }
  }
  ```

- ##### If request payload didn't met the requirements

  ```json
  {
    "errors": [
      {
        "msg": "Invalid value",
        "param": "lastName",
        "location": "body"
      },
      {
        "msg": "Invalid value",
        "param": "firstName",
        "location": "body"
      },
      {
        "msg": "Invalid value",
        "param": "email",
        "location": "body"
      },
      {
        "msg": "Invalid value",
        "param": "password",
        "location": "body"
      }
    ],
    "errormsg": "Please send required Details",
    "Required fields": ["email", "password", "lastName", "firstName"],
    "sample Format": {
      "firstName": "test",
      "lastName": "lasttest",
      "email": "TestEmail@mail.com",
      "password": "pass"
    }
  }
  ```

### Native Login

POST `/login`

#### REQUEST

```json
{
  "email": "TestEmail@mail.com",
  "password": "testpass"
}
```

#### RESPONSE

- ##### If Login Successful

  cookie will be set with name vrbocloneSessionId

  ```json
  {
    "user": {
      "email": "TestEmail@mail.com",
      "name": "Ftest Ltest"
    },
    "isLoginSuccess": true
  }
  ```

- ##### If User hasn't registered with given mail

  ```json
  {
    "errorMsg": "User doesn't Exists with given mail",
    "isLoginSuccess": false
  }
  ```

- ##### If request payload didn't met the requirements

  ```json
  {
    "errors": [
      {
        "msg": "Invalid value",
        "param": "email",
        "location": "body"
      },
      {
        "msg": "Invalid value",
        "param": "password",
        "location": "body"
      }
    ],
    "errormsg": "Please send required Details",
    "Required fields": ["email", "password"],
    "sample Format": {
      "email": "TestEmail@mail.com",
      "password": "pass"
    }
  }
  ```

### Logout

GET `/logout`

#### REQUEST

Cookie will be send automatically.

#### RESPONSE

- ##### If logout is successful

  ```json
  {
    "isLogoutSuccess": true
  }
  ```

- ##### If session is already expired

  ```json
  {
    "msg": "Session already Expired",
    "isLogoutSuccess": true
  }
  ```

### Auth verification

GET `/verifyAuth`

#### REQUEST

Cookie will be send automatically.

#### RESPONSE

- ##### If User is authenticated

  ```json
  {
    "user": {
      "email": "testMaill@mail.com",
      "name": "Ftest Ltest"
    },
    "isAuthenticated": true
  }
  ```

- ##### If User is NOT authenticated

  ```json
  {
    "isAuthenticated": false
  }
  ```

- ##### If session is expired

  ```json
  {
    "msg": "Session Expired Login Again",
    "isAuthenticated": false
  }
  ```

### To check the given mail is registered or not

POST `/checkStatus`

#### REQUEST

```json
{
  "email": "TestEmail@mail.com"
}
```

#### RESPONSE

- ##### If User has registered with given mail

  ```json
  {
    "message": "User Already Exists with given mail",
    "isExistingUser": true
  }
  ```

- ##### If User has NOT registered with given mail

  ```json
  {
    "message": "User hasn't Registered yet",
    "isExistingUser": false
  }
  ```

- ##### If request payload didn't met the requirements

  ```json
  {
    "errors": [
      {
        "msg": "Invalid value",
        "param": "email",
        "location": "body"
      }
    ],
    "errormsg": "Please send required Details",
    "Required fields": ["email"],
    "sample Format": {
      "email": "TestEmail@mail.com"
    }
  }
  ```

### Google oauth

POST `/oauth/google`

#### REQUEST

```json
{
  "name": "test",
  "email": "TestEmail@mail.com",
  "accessToken": "testaccessToken",
  "googleId": "testgoogleId",
  "imageUrl": "some url to image",
  "expires_at": "28372873828",
  "expires_in": "2736273",
  "first_issued_at": "2736232323"
}
```

#### RESPONSE

- ##### If auth succeed

  ```json
  {
    "user": {
      "name": "testName",
      "email": "TtestMail@mail.com"
    },
    "isAuthenticated": true
  }
  ```

- ##### If any error happend with cookie data or saving sessionId to Redis

  ```json
  {
    "errorMsg": "Session not being maintained, Please Login again",
    "isAuthenticated": true,
    "user": {
      "name": "test",
      "email": "TestEmail@mail.com"
    }
  }
  ```

- ##### If request payload didn't met the requirements

  ```json
  {
    "errors": [
      {
        "msg": "Invalid value",
        "param": "email",
        "location": "body"
      },
      {
        "msg": "Invalid value",
        "param": "name",
        "location": "body"
      }
    ],
    "errormsg": "Please send required Details",
    "Required fields": [
      "name",
      "email",
      "accessToken",
      "googleId",
      "imageUrl",
      "expires_at",
      "expires_in",
      "first_issued_at"
    ],
    "sample Format": {
      "name": "test",
      "email": "TestEmail@mail.com",
      "accessToken": "testaccessToken",
      "googleId": "testgoogleId",
      "imageUrl": "some url to image",
      "expires_at": "28372873828",
      "expires_in": "2736273",
      "first_issued_at": "2736232323"
    }
  }
  ```

### Facebook oauth

POST `/oauth/facebook`

#### REQUEST

```json
{
  "name": "test",
  "email": "TestEmail@mail.com",
  "accessToken": "testaccessToken",
  "fbId": "testfbId",
  "imageUrl": "some url to image",
  "expires_at": "28372873828",
  "expires_in": "2736273",
  "first_issued_at": "2736232323"
}
```

#### RESPONSE

- ##### If auth succeed

  ```json
  {
    "user": {
      "name": "test",
      "email": "TestEmail@mail.com"
    },
    "isAuthenticated": true
  }
  ```

- ##### If any error happend with cookie data or saving sessionId to Redis

  ```json
  {
    "errorMsg": "Session not being maintained, Please Login again",
    "isAuthenticated": true,
    "user": {
      "name": "test",
      "email": "TestEmail@mail.com"
    }
  }
  ```

- ##### If request payload didn't met the requirements

  ```json
  {
    "errors": [
      {
        "msg": "Invalid value",
        "param": "fbId",
        "location": "body"
      }
    ],
    "errormsg": "Please send required Details",
    "Required fields": [
      "name",
      "email",
      "accessToken",
      "fbId",
      "imageUrl",
      "expires_at",
      "expires_in",
      "first_issued_at"
    ],
    "sample Format": {
      "name": "test",
      "email": "TestEmail@mail.com",
      "accessToken": "testaccessToken",
      "fbId": "testfbId",
      "imageUrl": "some url to image",
      "expires_at": "28372873828",
      "expires_in": "2736273",
      "first_issued_at": "2736232323"
    }
  }
  ```

---

### Private Endpoints

POST `/verifyAuth`

#### REQUEST

```json
{
  "vrbocloneSessionId": "Send the cookie value hash which you need to verify"
}
```

#### RESPONSE

- ##### If the send hash is Valid

  ```json
  {
    "user": {
      "email": "testMail@mail.com",
      "name": "Ftest Ltest"
    },
    "isAuthenticated": true
  }
  ```

- ##### If the send hash is NOT Valid

  ```json
  {
    "isAuthenticated": false
  }
  ```

- ##### If Origin is not in the private list

  With 403 (Forbidden) as Status Code

  ```json
  {
    "msg": "This is a private Endpoint, Please contact the Admin"
  }
  ```

- ##### If request payload didn't met the requirements

  ```json
  {
    "errors": [
      {
        "msg": "Invalid value",
        "param": "vrbocloneSessionId",
        "location": "body"
      }
    ],
    "errormsg": "Please send required Details",
    "Required fields": ["vrbocloneSessionId"],
    "sample Format": {
      "vrbocloneSessionId": "Send the cookie value hash which you need to verify"
    }
  }
  ```

## Deployment
![Architecture](https://portfolio.devganesh.tech/VrboClone.jpg "https://portfolio.devganesh.tech/VrboClone.jpg")

## Built With

- [Express](https://expressjs.com/) - The web framework used
