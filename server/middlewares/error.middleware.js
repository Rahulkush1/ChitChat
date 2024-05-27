import { ApiError } from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
  console.log(err);
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  //Wrong MongoDB ID error

  if (err.name == "CastError") {
    const message = `Resource not Found invalid : ${err.path}`;
    err = new ApiError(400, message);
  }

  //Mongoose Duplicate error

  if (err.code == 11000) {
    const message = `duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ApiError(400, message);
  }
  //Wrong JWT Token error

  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid, Try again`;
    err = new ApiError(400, message);
  }
  //JWT EXpire Error

  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token is Expired, Try again`;
    err = new ApiError(400, message);
  }

  //existing data Error

  if (err.code == 409) {
    const message = `Data already exists`;
    err = new ApiError(400, message);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default errorMiddleware;
