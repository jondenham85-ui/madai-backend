function validateRequiredFields(requiredFields) {
  return (req, res, next) => {
    const missingFields = [];

    for (const field of requiredFields) {
      const value = req.body?.[field];

      if (value === undefined || value === null || String(value).trim() === "") {
        missingFields.push(field);
      }
    }

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: missingFields,
      });
    }

    return next();
  };
}

module.exports = {
  validateRequiredFields,
};
