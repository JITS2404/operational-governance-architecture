const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const ticketValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
    body('category_id').isUUID().withMessage('Invalid category ID'),
    body('location_id').isUUID().withMessage('Invalid location ID'),
    validate
  ],
  update: [
    param('id').isUUID().withMessage('Invalid ticket ID'),
    body('title').optional().trim().isLength({ max: 255 }),
    body('description').optional().trim(),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    validate
  ]
};

const userValidation = {
  create: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('role').isIn(['PLATFORM_ADMIN', 'HEAD', 'MAINTENANCE_TEAM', 'TECHNICIAN', 'REPORTER', 'FINANCE_TEAM']),
    validate
  ]
};

module.exports = { validate, ticketValidation, userValidation };
