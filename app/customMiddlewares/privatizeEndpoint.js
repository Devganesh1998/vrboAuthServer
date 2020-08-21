module.exports = function (allowedOrigins) {
  const whitelistedOrigins = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
  return function (req, res, next) {
    const origin = req.headers.origin;
    if (whitelistedOrigins.indexOf(origin) > -1) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      next();
    } else {
      res.status(403).json({
        msg: "This is a private Endpoint, Please contact the Admin",
      });
    }
  };
};
