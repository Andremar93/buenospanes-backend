import express from 'express';
import Expense from '../models/Expense.js';
import {
  createExpense,
  createExpenseByInvoice,
  updateExpenseById,
  getExpenses
} from '../controllers/expenseControllers.js';
import auth from '../middleware/auth.js';
import checkRole from '../middleware/role.js';

const router = express.Router();

// Ruta para crear un gasto en /expenses/create
router.post('/create', auth, checkRole('admin'), async (req, res) => {
  try {
    const newExpense = await createExpense(req.body);
    res
      .status(201)
      .json({ message: 'Gasto creado con éxito', expense: newExpense });
  } catch (error) {
    console.log(error);
    // Si el error tiene un status definido, lo usamos, si no, usamos 500
    const status = error.status || 500;
    const message = error.message || 'Error al crear el gasto';
    res.status(status).json({ error: message });
  }
});

// Ruta para crear un gasto en /expenses/create by Invoice
router.post('/create-by-invoice', auth, checkRole('admin'), async (req, res) => {
  try {
    const newExpenseByInvoice = await createExpenseByInvoice(req.body);
    res
      .status(201)
      .json({
        message: 'Gasto creado con éxito',
        expense: newExpenseByInvoice
      });
  } catch (error) {
    console.log(error);
    // Si el error tiene un status definido, lo usamos, si no, usamos 500
    const status = error.status || 500;
    const message = error.message || 'Error al crear el gasto';
    res.status(status).json({ error: message });
  }
});

// Ruta para actualizar un gasto por su ID
router.put('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const expenseId = req.params.id;
    const updateData = { ...req.body };

    const response = await updateExpenseById(expenseId, updateData);
    res
      .status(200)
      .json({ message: 'Gasto actualizado con éxito', expense: response });
  } catch (error) {
    console.error('Error actualizando gasto:', error);
    res.status(500).json({ error: 'Error al actualizar el gasto' });
  }
});

// Ruta para obtener todos los gastos ordenados por la fecha más reciente
router.post('/get', auth, checkRole('admin'), async (req, res) => {
  try {
    // Obtener los gastos ordenados por la fecha más reciente
    const expenses = await getExpenses(req.body);
    if (!expenses) {
      return res.status(404).json({ message: 'Gastos no encontrados.' });
    }
    // Devolver los gastos
    res.status(200).json({ message: 'Gastos obtenidos', expenses });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al obtener los gastos' });
  }
});

router.get('/expenses-resume', auth, checkRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Crear fechas en la zona horaria local
    const startDateTime = new Date(`${startDate}T00:00:00`);
    const endDateTime = new Date(`${endDate}T23:59:59.999`);

    const expenses = await Expense.find({
      paid: true,
      date: {
        $gte: startDateTime,
        $lte: endDateTime
      }
    }).sort({ date: -1 });

    const aggregatedData = await Expense.aggregate([
      {
        $match: {
          paid: true,
          date: {
            $gte: startDateTime,
            $lte: endDateTime
          }
        }
      },
      {
        $group: {
          _id: null,
          totalDollars: { $sum: '$amountDollars' },
          totalBs: { $sum: '$amountBs' }
        }
      }
    ]);

    const paymentMethodTotals = await Expense.aggregate([
      {
        $match: {
          paid: true,
          date: {
            $gte: startDateTime,
            $lte: endDateTime
          }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalDollars: { $sum: '$amountDollars' },
          totalBs: { $sum: '$amountBs' }
        }
      },
      {
        $project: {
          paymentMethod: '$_id',
          totalDollars: { $round: [{ $toDouble: '$totalDollars' }, 2] },
          totalBs: { $round: [{ $toDouble: '$totalBs' }, 2] },
          _id: 0
        }
      }
    ]);

    if (expenses.length === 0) {
      return res.status(200).json({
        expenses: [],
        totals: {
          totalDollars: 0,
          totalBs: 0
        },
        paymentMethodTotals: []
      });
    }

    res.status(200).json({
      expenses,
      totals: {
        totalDollars: Number(aggregatedData[0].totalDollars.toFixed(2)),
        totalBs: Number(aggregatedData[0].totalBs.toFixed(2))
      },
      paymentMethodTotals
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al obtener el resumen de gastos' });
  }
});

export default router;
