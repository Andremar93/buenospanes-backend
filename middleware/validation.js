import { body, param, query, validationResult } from 'express-validator';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Validaciones para gastos
export const validateExpense = [
  body('description')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('La descripción debe tener entre 3 y 200 caracteres'),

  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser un número positivo mayor a 0'),

  body('currency')
    .isIn(['Bs', 'USD'])
    .withMessage('La moneda debe ser "Bs" o "USD"'),

  body('date')
    .isISO8601()
    .withMessage('La fecha debe ser válida en formato ISO'),

  body('type')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El tipo debe tener entre 2 y 50 caracteres'),

  body('subType')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El subtipo debe tener entre 2 y 50 caracteres'),

  body('paymentMethod')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El método de pago debe tener entre 2 y 50 caracteres'),

  body('paid')
    .optional()
    .isBoolean()
    .withMessage('El campo paid debe ser un booleano'),

  handleValidationErrors
];

// Validaciones para facturas
export const validateInvoice = [
  body('description')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('La descripción debe tener entre 3 y 200 caracteres'),

  body('amountDollars')
    .isFloat({ min: 0.01 })
    .withMessage('El monto en dólares debe ser un número positivo mayor a 0'),

  body('amountBs')
    .isFloat({ min: 0.01 })
    .withMessage(
      'El monto en bolivianos debe ser un número positivo mayor a 0'
    ),

  body('currency')
    .isIn(['Bs', 'USD'])
    .withMessage('La moneda debe ser "Bs" o "USD"'),

  body('date')
    .isISO8601()
    .withMessage('La fecha debe ser válida en formato ISO'),

  body('type')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El tipo debe tener entre 2 y 50 caracteres'),

  body('paid')
    .optional()
    .isBoolean()
    .withMessage('El campo paid debe ser un booleano'),

  handleValidationErrors
];

// Validaciones para ingresos
export const validateIncome = [
  body('description')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('La descripción debe tener entre 3 y 200 caracteres'),

  body('amountDollars')
    .isFloat({ min: 0.01 })
    .withMessage('El monto en dólares debe ser un número positivo mayor a 0'),

  body('amountBs')
    .isFloat({ min: 0.01 })
    .withMessage(
      'El monto en bolivianos debe ser un número positivo mayor a 0'
    ),

  body('currency')
    .isIn(['Bs', 'USD'])
    .withMessage('La moneda debe ser "Bs" o "USD"'),

  body('date')
    .isISO8601()
    .withMessage('La fecha debe ser válida en formato ISO'),

  body('type')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El tipo debe tener entre 2 y 50 caracteres'),

  handleValidationErrors
];

// Validaciones para empleados
export const validateEmployee = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('position')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El cargo debe tener entre 2 y 100 caracteres'),

  body('salary')
    .isFloat({ min: 0 })
    .withMessage('El salario debe ser un número positivo'),

  body('startDate')
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida en formato ISO'),

  handleValidationErrors
];

// Validaciones para tasas de cambio
export const validateExchangeRate = [
  body('rate')
    .isFloat({ min: 0.01 })
    .withMessage('La tasa de cambio debe ser un número positivo mayor a 0'),

  body('date')
    .isISO8601()
    .withMessage('La fecha debe ser válida en formato ISO'),

  handleValidationErrors
];

// Validaciones para IDs de MongoDB
export const validateMongoId = [
  param('id').isMongoId().withMessage('El ID proporcionado no es válido'),

  handleValidationErrors
];

// Validaciones para fechas en queries
export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida en formato ISO'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser válida en formato ISO'),

  handleValidationErrors
];

// Validación para paginación
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entero entre 1 y 100'),

  handleValidationErrors
];

export const validateEmployeeDebt = [
  body('employeeId')
    .isMongoId()
    .withMessage('El ID del empleado debe ser válido'),

  body('type')
    .optional()
    .isIn(['standard', 'vale'])
    .withMessage('El tipo debe ser "standard" o "vale"'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('La descripción debe tener entre 3 y 500 caracteres'),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Las notas no pueden exceder 1000 caracteres'),

  // Para "vale" se requiere la fecha (el backend calcula la tasa con esto)
  body('paymentDate')
    .if(body('type').equals('vale'))
    .exists({ checkFalsy: true })
    .withMessage('La fecha es requerida para vales')
    .bail()
    .isISO8601({ strict: true })
    .withMessage('La fecha debe tener formato válido (YYYY-MM-DD)'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un elemento'),

  body('items.*.concept')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('El concepto del ítem es requerido (máx. 200 caracteres)'),

  body('items.*.unitAmount')
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage('El monto unitario debe ser ≥ 0'),

  body('items.*.quantity')
    .toInt()
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero ≥ 1'),

  // Validación de negocio: el total debe ser > 0
  body('items').custom((items) => {
    if (!Array.isArray(items)) throw new Error('Formato inválido de ítems');
    const total = items.reduce((sum, it) => {
      const q = Number(it?.quantity || 0);
      const u = Number(it?.unitAmount || 0);
      return sum + q * u;
    }, 0);
    if (total <= 0) throw new Error('El total de la deuda debe ser mayor a 0');
    return true;
  }),

  handleValidationErrors,
];

// Validación para marcar items como pagados
export const validateMarkItemsPaid = (req, res, next) => {
  const { itemIndexes } = req.body;
  
  if (!itemIndexes) {
    return res.status(400).json({
      success: false,
      message: 'itemIndexes es requerido'
    });
  }
  
  if (!Array.isArray(itemIndexes)) {
    return res.status(400).json({
      success: false,
      message: 'itemIndexes debe ser un array'
    });
  }
  
  if (itemIndexes.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Debe proporcionar al menos un índice de item'
    });
  }
  
  // Validar que todos los índices sean números enteros no negativos
  for (let i = 0; i < itemIndexes.length; i++) {
    const index = itemIndexes[i];
    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: `Índice inválido en posición ${i}: debe ser un número entero no negativo`
      });
    }
  }
  
  next();
};

// Validación para marcar items como no pagados
export const validateMarkItemsUnpaid = (req, res, next) => {
  const { itemIndexes } = req.body;
  
  if (!itemIndexes) {
    return res.status(400).json({
      success: false,
      message: 'itemIndexes es requerido'
    });
  }
  
  if (!Array.isArray(itemIndexes)) {
    return res.status(400).json({
      success: false,
      message: 'itemIndexes debe ser un array'
    });
  }
  
  if (itemIndexes.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Debe proporcionar al menos un índice de item'
    });
  }
  
  // Validar que todos los índices sean números enteros no negativos
  for (let i = 0; i < itemIndexes.length; i++) {
    const index = itemIndexes[i];
    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: `Índice inválido en posición ${i}: debe ser un número entero no negativo`
      });
    }
  }
  
  next();
};
