import express from 'express';
import {
  createIncome,
  updateIncome,
  getIncomes
} from '../controllers/incomeControllers.js';
import auth from '../middleware/auth.js';
import checkRole from '../middleware/role.js';

const router = express.Router();

// Ruta para crear un gasto en /expenses/create
router.post('/create', auth, checkRole('admin', 'caja'), async (req, res) => {
  try {
    const result = await createIncome(req.body, req.user.id);
    const income = result.income ?? result;
    const createdExpenses = result.createdExpenses ?? [];
    const createdDebts = result.createdDebts ?? [];
    res.status(201).json({
      message: 'Ingreso creado con éxito',
      income,
      createdExpenses,
      createdDebts
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al crear el ingreso';
    res.status(status).json({ error: message });
  }
});

router.post('/get', auth, checkRole('admin'), async (req, res) => {
  try {
    const incomes = await getIncomes(req.body);

    if (!incomes) {
      return res.status(404).json({ message: 'Ingresos no encontrados.' });
    }
    res.status(200).json({ message: 'Ingresos obtenidos', incomes });
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({ error: 'Error al obtener los ingresos' });
  }
});

// Actualizar ingreso
router.put('/:id', auth, checkRole('admin', 'caja'), async (req, res) => {
  try {
    const updatedIncome = await updateIncome(req.params.id, req.body);
    if (!updatedIncome) {
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }
    res
      .status(200)
      .json({ message: 'Ingreso actualizado', income: updatedIncome });
  } catch (error) {
    res
      .status(400)
      .json({
        message: 'Error al actualizar el ingreso',
        error: error.message
      });
  }
});

export default router;
