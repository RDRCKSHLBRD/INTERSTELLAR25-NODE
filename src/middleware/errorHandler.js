import config from '../config/environment.js';

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    message: 'Internal server error',
    status: 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.message = 'Validation error';
    error.status = 400;
    error.details = err.details;
  } else if (err.name === 'UnauthorizedError') {
    error.message = 'Unauthorized';
    error.status = 401;
  } else if (err.name === 'ForbiddenError') {
    error.message = 'Forbidden';
    error.status = 403;
  } else if (err.name === 'NotFoundError') {
    error.message = 'Resource not found';
    error.status = 404;
  } else if (err.code === '23505') { // PostgreSQL unique constraint
    error.message = 'Resource already exists';
    error.status = 409;
  } else if (err.code === '23503') { // PostgreSQL foreign key constraint
    error.message = 'Referenced resource does not exist';
    error.status = 400;
  } else if (err.message) {
    error.message = err.message;
    error.status = err.status || 500;
  }

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    error.stack = err.stack;
  }

  res.status(error.status).json(error);
};

export default errorHandler;