// routes/employeeDebts.js
import express from 'express';
import {
  createEmployeeDebt,
  getEmployeeDebts,
  getAllDebts,
  getDebtById,
  updateDebt,
  addItemsToDebt,
  deleteDebt,
  getDebtsSummary,
  markItemsAsPaid,
  markItemsAsUnpaid,
  getDebtPaymentHistory
} from '../controllers/employeeDebtController.js';
import auth from '../middleware/auth.js';
import checkRole from '../middleware/role.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateEmployeeDebt, validateMarkItemsPaid, validateMarkItemsUnpaid } from '../middleware/validation.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(auth, checkRole('admin'));

// Crear una nueva deuda para un empleado
router.post('/create', validateEmployeeDebt, asyncHandler(async (req, res) => {
  const debt = await createEmployeeDebt(req.body, req.user.id);
  res.status(201).json({
    success: true,
    message: 'Deuda creada exitosamente',
    debt
  });
}));

// Obtener todas las deudas de un empleado específico
router.get('/employee/:employeeId', asyncHandler(async (req, res) => {
  const debts = await getEmployeeDebts(req.params.employeeId);
  res.json({
    success: true,
    message: 'Deudas del empleado obtenidas exitosamente',
    debts
  });
}));

// Obtener todas las deudas con filtros y paginación
router.get('/all', asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    employeeId: req.query.employeeId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  const result = await getAllDebts(filters);
  res.json({
    success: true,
    message: 'Deudas obtenidas exitosamente',
    ...result
  });
}));

// Obtener una deuda específica por ID
router.get('/:debtId', asyncHandler(async (req, res) => {
  const debt = await getDebtById(req.params.debtId);
  res.json({
    success: true,
    message: 'Deuda obtenida exitosamente',
    debt
  });
}));

// Actualizar una deuda
router.put('/:debtId', asyncHandler(async (req, res) => {
  const updatedDebt = await updateDebt(req.params.debtId, req.body, req.user.id);
  res.json({
    success: true,
    message: 'Deuda actualizada exitosamente',
    debt: updatedDebt
  });
}));

// Eliminar una deuda
router.delete('/:debtId', asyncHandler(async (req, res) => {
  const result = await deleteDebt(req.params.debtId);
  res.json({
    success: true,
    message: result.message
  });
}));

// Obtener resumen de deudas por empleado
router.get('/summary/all', asyncHandler(async (req, res) => {
  const summary = await getDebtsSummary();
  res.json({
    success: true,
    message: 'Resumen de deudas obtenido exitosamente',
    summary
  });
}));

// Marcar items específicos como pagados
router.post('/:debtId/mark-items-paid', validateMarkItemsPaid, asyncHandler(async (req, res) => {
  const { itemIndexes } = req.body;
  const updatedDebt = await markItemsAsPaid(req.params.debtId, itemIndexes, req.user.id);
  res.json({
    success: true,
    message: 'Items marcados como pagados exitosamente',
    debt: updatedDebt
  });
}));

// Marcar items específicos como no pagados
router.post('/:debtId/mark-items-unpaid', validateMarkItemsUnpaid, asyncHandler(async (req, res) => {
  const { itemIndexes } = req.body;
  const updatedDebt = await markItemsAsUnpaid(req.params.debtId, itemIndexes);
  res.json({
    success: true,
    message: 'Items marcados como no pagados exitosamente',
    debt: updatedDebt
  });
}));

// Obtener historial de pagos de una deuda específica
router.get('/:debtId/payment-history', asyncHandler(async (req, res) => {
  const paymentHistory = await getDebtPaymentHistory(req.params.debtId);
  res.json({
    success: true,
    message: 'Historial de pagos obtenido exitosamente',
    ...paymentHistory
  });
}));

export default router;
