import express from 'express';
import { createIncome, updateIncome, getIncomes } from '../controllers/incomeControllers.js';
import checkRole from '../middleware/role.js';

const router = express.Router();

// Ruta para crear un gasto en /expenses/create
router.post('/create', checkRole('admin', 'caja'), async (req, res) => {
    try {
        const newIncome = await createIncome(req.body)

        res.status(201).json({ message: 'Ingreso creado con éxito', income: newIncome });
    } catch (error) {

        const status = error.status || 500;
        const message = error.message || 'Error al crear el ingreso';
        res.status(status).json({ error: message });
    }
});

router.post('/get', checkRole('admin'), async (req, res) => {
    try {

        const incomes = await getIncomes(req.body)

        if (!incomes) {
            return res.status(404).json({ message: 'Ingresos no encontrados.' });
        }
        res.status(200).json({ message: 'Ingresos obtenidos', incomes: incomes });

       
    } catch (error) {
        console.error('Error al obtener ingresos:', error);
        res.status(500).json({ error: 'Error al obtener los ingresos' });
    }
});

// Actualizar ingreso
router.put('/:id', checkRole('admin', 'caja'), async (req, res) => {
    try {

        const updatedIncome = await updateIncome(req.params.id, req.body)
        if (!updatedIncome) {
            return res.status(404).json({ message: 'Ingreso no encontrado' });
        }
        res.status(200).json({ message: 'Ingreso actualizado', income: updatedIncome });
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el ingreso', error: error.message });
    }
});

export default router;
