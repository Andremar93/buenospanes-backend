import Invoice from '../models/Invoice.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';
import { calculateAmounts } from '../helpers/currencyHelpers.js';
import Employee from '../models/Employee.js';

// Crear un nuevo gasto
export const createEmployee = async (employeeData) => {
    try {
        const { name, weeklySalary, id, accountNumber } = employeeData;
        if (!name || !weeklySalary) {
            throw { status: 400, message: 'Datos incompletos para crear al empleado' };
        }

        const newEmployee = new Employee({
            name, weeklySalary, id, accountNumber
        });

        await newEmployee.save();
        return newEmployee;

    } catch (error) {
        // Si ya es un error lanzado manualmente, lo re-lanzamos
        if (error.status) throw error;

        // Si es un error inesperado, lo manejamos como interno
        console.error('createEmployee Error:', error);
        throw { status: 500, message: 'Error interno del servidor' };
    }
};

export const getEmployees = async () => {
    try {
        const employees = await Employee.find();
        return employees;
    } catch (error) {
        if (error.status) throw error; // Custom thrown error, rethrow

        console.error('getEmployees Error:', error);

        // Throw an Error instance with status property
        const serverError = new Error('Error interno del servidor');
        serverError.status = 500;
        throw serverError;
    }
};

