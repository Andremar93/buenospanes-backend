import express from 'express';
import { createIncome } from '../controllers/incomeControllers.js';

const router = express.Router();

// Ruta para crear un gasto en /expenses/create
router.post('/create', async (req, res) => {
    try {
        const newIncome = await createIncome(req.body)
        res.status(201).json({ message: 'Ingreso creado con éxito', expense: newIncome });
    } catch (error) {
        console.log(error);
        const status = error.status || 500;
        const message = error.message || 'Error al crear el ingreso';
        res.status(status).json({ error: message });
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
