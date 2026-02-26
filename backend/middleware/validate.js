import { validationResult } from 'express-validator';

/**
 * Middleware that checks express-validator results.
 * Place after body()/param()/query() validators in the route chain.
 * Returns 400 with structured errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

export default validate;
