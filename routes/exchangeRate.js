import express from 'express';
import ExchangeRate from '../models/ExchangeRate.js';

const router = express.Router();

// Ruta para crear un gasto en /exchange-rate/create
router.post('/create', async (req, res) => {
    try {
        const { rate } = req.body;
        const now = new Date();
        now.setUTCHours(now.getUTCHours() - 4);
        const date = now.toISOString().split('T')[0];
        const newRate = new ExchangeRate({ rate, date });
        await newRate.save();
        res.status(201).json({ message: 'Tasa almacenada con éxito', rate: newRate });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al crear la tasa' });
    }
});

// Obtener tasa de cambio para una fecha específica
router.get('/get/:date', async (req, res) => {
    try {
        const requestedDate = req.params.date; // como string
        const rate = await ExchangeRate.findOne({ date: requestedDate });

        if (!rate) {
            return res.status(204).json({ message: 'No se encontró tasa de cambio para la fecha especificada' });
        }

        res.status(200).json(rate);
    } catch (error) {
        console.log('Error al obtener tasa de cambio:', error);
        res.status(500).json({ message: 'Error al obtener la tasa de cambio' });
    }
});

export default router;
