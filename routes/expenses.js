import express from 'express';
import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { createExpense, createExpenseByInvoice } from '../controllers/expenseControllers.js'
import { sendNotificationToAllUsers } from '../services/notificationService.js'
const router = express.Router();

// Ruta para crear un gasto en /expenses/create
router.post('/create', async (req, res) => {
    try {
        const newExpense = await createExpense(req.body);
        if (newExpense) {
            userId = req.body.userId
            const {username} = User.findById(userId)
            await sendNotificationToAllUsers({ title: `Gasto agregado`, body: `por: ${username}` });
        }
        res.status(201).json({ message: 'Gasto creado con éxito', expense: newExpense });
    } catch (error) {
        console.log(error);
        // Si el error tiene un status definido, lo usamos, si no, usamos 500
        const status = error.status || 500;
        const message = error.message || 'Error al crear el gasto';
        res.status(status).json({ error: message });
    }
});

// Ruta para crear un gasto en /expenses/create by Invoice
router.post('/create-by-invoice', async (req, res) => {
    try {
        const newExpenseByInvoice = await createExpenseByInvoice(req.body)
        res.status(201).json({ message: 'Gasto creado con éxito', expense: newExpenseByInvoice })
    } catch (error) {
        console.log(error);
        // Si el error tiene un status definido, lo usamos, si no, usamos 500
        const status = error.status || 500;
        const message = error.message || 'Error al crear el gasto';
        res.status(status).json({ error: message });
    }
});


// Ruta para obtener todos los gastos ordenados por la fecha más reciente
router.get('/get', async (req, res) => {
    try {
        // Obtener los gastos ordenados por la fecha más reciente
        const expenses = await Expense.find({ paid: true }).sort({ date: -1 }); // -1 para orden descendente

        // Devolver los gastos
        res.status(200).json(expenses);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al obtener los gastos' });
    }
});

router.get('/expenses-resume', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Crear fechas en la zona horaria local
        const startDateTime = new Date(startDate + 'T00:00:00');
        const endDateTime = new Date(endDate + 'T23:59:59.999');

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
