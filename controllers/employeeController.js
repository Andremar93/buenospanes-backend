import Employee from '../models/Employee.js';
import EmployeeDebt from '../models/EmployeeDebt.js';

// Crear un nuevo empleado (igual a tu versión actual)
export const createEmployee = async (employeeData) => {
  try {
    const { name, weeklySalary, id, accountNumber } = employeeData;
    if (!name || !weeklySalary) {
      throw { status: 400, message: 'Datos incompletos para crear al empleado' };
    }

    const newEmployee = new Employee({ name, weeklySalary, id, accountNumber });
    await newEmployee.save();
    return newEmployee;
  } catch (error) {
    if (error.status) throw error;
    console.error('createEmployee Error:', error);
    throw { status: 500, message: 'Error interno del servidor' };
  }
};

/**
 * Obtener empleados. Si includeDebts=true, trae las deudas embebidas (con filtros).
 *
 * options:
 *  - includeDebts?: boolean (default: false)
 *  - debtStatus?: 'pending' | 'paid' | 'overdue' | 'cancelled'
 *  - startDate?: string (YYYY-MM-DD)
 *  - endDate?: string (YYYY-MM-DD)
 *  - debtsLimit?: number (límite de deudas por empleado, default: 100)
 */
export const getEmployees = async (options = {}) => {
  try {
    const {
      includeDebts = false,
      debtStatus,
      startDate,
      endDate,
      debtsLimit = 100,
    } = options;

    if (!includeDebts) {
      // Solo empleados, como antes
      return await Employee.find();
    }

    // Filtros para las deudas en el $lookup
    const matchDebts = {};
    if (debtStatus) matchDebts.status = debtStatus;

    if (startDate || endDate) {
      matchDebts.createdAt = {};
      if (startDate) matchDebts.createdAt.$gte = new Date(startDate);
      if (endDate) matchDebts.createdAt.$lte = new Date(endDate);
    }

    const debtsCollection = EmployeeDebt.collection.collectionName; // nombre seguro de la colección

    const pipeline = [
      // Puedes proyectar campos del empleado aquí si quieres limitar
      {
        $lookup: {
          from: debtsCollection,
          let: { empId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$employee', '$$empId'] },
                ...matchDebts,
              },
            },
            // Ordena deudas más recientes primero
            { $sort: { createdAt: -1 } },
            // Limita por empleado (para no traer miles)
            ...(Number.isFinite(debtsLimit) && debtsLimit > 0
              ? [{ $limit: debtsLimit }]
              : []),
            // Opcional: reducir payload de cada deuda
            {
              $project: {
                _id: 1,
                description: 1,
                type: 1,
                status: 1,
                totalAmount: 1,
                paymentDate: 1,
                createdAt: 1,
                // Si quieres los ítems completos, déjalo. Si no, quítalo.
                items: 1,
              },
            },
          ],
          as: 'debts',
        },
      },
    ];

    const employees = await Employee.aggregate(pipeline);
    return employees;
  } catch (error) {
    if (error.status) throw error;
    console.error('getEmployees Error:', error);
    const serverError = new Error('Error interno del servidor');
    serverError.status = 500;
    throw serverError;
  }
};
