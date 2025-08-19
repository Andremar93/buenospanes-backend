import express from 'express';
import Employee from '../models/Employee.js';
import {
  createEmployee,
  getEmployees
} from '../controllers/employeeController.js';
import auth from '../middleware/auth.js';
import checkRole from '../middleware/role.js';

const router = express.Router();

// Ruta para crear un gasto en /employee/create
router.post('/create', auth, checkRole('admin'), async (req, res) => {
  try {
    const newEmployee = await createEmployee(req.body);
    res
      .status(201)
      .json({ message: 'Empleado creado con éxito', employee: newEmployee });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al crear al empleado' });
  }
});

router.get('/get', auth, checkRole('admin'), async (req, res) => {
  try {
    const { includeDebts, debtStatus, startDate, endDate, debtsLimit } = req.query;

    const allowedStatuses = ['pending', 'paid', 'overdue', 'cancelled'];

    const opts = {
      includeDebts: includeDebts === 'true', // default en controller = false
      debtStatus: allowedStatuses.includes(String(debtStatus)) ? String(debtStatus) : undefined,
      // fechas opcionales en formato YYYY-MM-DD
      startDate: typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : undefined,
      endDate: typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : undefined,
      debtsLimit: Number.isFinite(Number(debtsLimit))
        ? Math.max(1, Math.min(Number(debtsLimit), 1000))
        : 100,
    };

    const employees = await getEmployees(opts);

    res
      .status(201)
      .json({ message: 'Empleados obtenidos', employees });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al obtener la tasa de cambio' });
  }
});

export default router;
