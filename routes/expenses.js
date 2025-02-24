import express from 'express';
import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';

const router = express.Router();

// Ruta para crear un gasto en /expenses/create
router.post('/create', async (req, res) => {
    try {
        const { description, amount, currency, date, type, subType, paymentMethod, paid } = req.body;
        let amountBs;
        let amountDollars;

        // Obtener la tasa de cambio para la fecha especificada
        const rate = await getExchangeRateByDate(date);

        // Calcular la cantidad en Bs y en dólares
        if (currency === 'Bs') {
            amountBs = amount;
            amountDollars = (amount / rate.rate).toFixed(2);
        } else {
            amountBs = amount * rate.rate;
            amountDollars = amount;
        }

        // Crear y guardar el nuevo gasto
        const newExpense = new Expense({ description, amountBs, amountDollars, currency, date, type, subType, paymentMethod, paid });
        await newExpense.save();

        res.status(201).json({ message: 'Gasto creado con éxito', expense: newExpense });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al crear el gasto' });
    }
});

// Ruta para crear un gasto en /expenses/create by Invoice
// Ruta para crear un gasto en /expenses/create
router.post('/create-by-invoice', async (req, res) => {
    try {
        const { invoiceId, paymentMethod, date } = req.body;

        const invoice = await Invoice.findById(invoiceId);
        invoice.paid = true; // Cambiar el estado de "paid" a true

        // Guardar los cambios en la base de datos
        await invoice.save();

        const { description, currency, type } = invoice;
        let { amountDollars, amountBs } = invoice;
        // // Obtener la tasa de cambio para la fecha especificada
        const rate = await getExchangeRateByDate(date);
        if(!rate){
            return res.status(204).json({error: `Tasa del día ${date} no se encuentra en sistema.`})
        }

        // Calcular la cantidad en Bs y en dólares
        if (currency === 'Bs') {
            amountDollars = (amountBs / rate.rate).toFixed(2);
        } else {
            amountBs = amountDollars * rate.rate;
        }
        // // Crear y guardar el nuevo gasto
        const newExpense = new Expense({ description, amountBs, amountDollars, currency, date, type, paymentMethod, paid: true });
        await newExpense.save();

        res.status(201).json({ message: 'Gasto creado con éxito', expense: newExpense });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al crear el gasto' });
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

export default router;
