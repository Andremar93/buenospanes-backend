import express from 'express';
import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';

const router = express.Router();

// Ruta para crear un gasto en /expenses/create
router.post('/create', async (req, res) => {
    try {
        const { 
            sitef, 
  puntoBs, 
  efectivoBs, 
  efectivoDolares, 
  pagoMovil, 
  bioPago, 
  gastosBs, 
  gastosDolares, 
  totalSistema, 
  notas,
  date
 } = req.body;
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
        const newIncome = new Income({   sitef, 
            puntoBs, 
            efectivoBs, 
            efectivoDolares, 
            pagoMovil, 
            bioPago, 
            gastosBs, 
            gastosDolares, 
            totalSistema, 
            notas,date});
        await newIncome.save();

        res.status(201).json({ message: 'Ingreso creado con éxito', expense: newIncome });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al crear el ingreso' });
    }
});


// Ruta para obtener todos los ingresos ordenados por la fecha más reciente
router.get('/get', async (req, res) => {
    try {
        // Obtener los gastos ordenados por la fecha más reciente
        const incomes = await Income.find({ paid: true }).sort({ date: -1 }); // -1 para orden descendente

        // Devolver los gastos
        res.status(200).json(incomes);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al obtener los gastos' });
    }
});

export default router;
