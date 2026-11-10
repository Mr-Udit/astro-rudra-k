export const validate = schema => {
  // precompile options once
  const options = {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  };

  return (req, res, next) => {
    // attach userId without mutating original body reference
    if (req.user?.id && req.body?.userId === undefined) {
      req.body = {
        ...req.body,
        userId: req.user.id
      };
    }

    const { error, value } = schema.validate(req.body, options);

    if (error) {
      return res.status(422).json({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request fields',
          details: error.details.map(d => d.message)
        }
      });
    }

    req.body = value;
    next();
  };
};
