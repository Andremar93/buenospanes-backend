import express from 'express';
import Employee from '../models/Employee.js';
import { createEmployee, getEmployees } from '../controllers/employeeController.js';

const router = express.Router();

// Ruta para crear un gasto en /employee/create
router.post('/create', async (req, res) => {
    try {
        const newEmployee = await createEmployee(req.body);
        res.status(201).json({ message: 'Empleado creado con éxito', employee: newEmployee });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al crear al empleado' });
    }
});


router.get('/get', async (req, res) => {
    try {
        console.log('GET EMPLOYEES')
        const employees = await getEmployees()
        res.status(201).json({ message: 'Empleados obtenidos', employees: employees });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al obtener la tasa de cambio' });
    }
});

export default router;
