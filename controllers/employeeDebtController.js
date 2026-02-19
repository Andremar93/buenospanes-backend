// controllers/employeeDebtController.js
import EmployeeDebt from '../models/EmployeeDebt.js';
import Employee from '../models/Employee.js';
import { AppError, ErrorTypes } from '../middleware/errorHandler.js';

/**
 * Create a new Employee Debt
 */
export const createEmployeeDebt = async (debtData, userId) => {
  try {
    const {
      employeeId,
      description = '',
      notes = '',
      type = 'standard', // 'standard' or 'vale'
      exchangeRateSnapshot = null, // optional, needed if type === 'vale'
      paymentDate,
      items = [],
    } = debtData;

    console.log(debtData)

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new AppError('Empleado no encontrado', 404, ErrorTypes.NOT_FOUND);
    }

    // Validate items
    if (!Array.isArray(items)) {
      throw new AppError('items debe ser un array', 400, ErrorTypes.VALIDATION_ERROR);
    }

    const validatedItems = items.map((item, idx) => {
      const { concept, unitAmount, quantity } = item || {};
      if (typeof concept !== 'string' || !concept.trim()) {
        throw new AppError(`El ítem #${idx + 1} requiere concept válido`, 400, ErrorTypes.VALIDATION_ERROR);
      }
      const qtyNum = Number(quantity);
      const amtNum = Number(unitAmount);
      if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
        throw new AppError(`quantity inválida en ítem #${idx + 1}`, 400, ErrorTypes.VALIDATION_ERROR);
      }
      if (Number.isNaN(amtNum) || amtNum < 0) {
        throw new AppError(`unitAmount inválido en ítem #${idx + 1}`, 400, ErrorTypes.VALIDATION_ERROR);
      }
      return {
        concept: concept.trim(),
        quantity: qtyNum,
        unitAmount: amtNum,
      };
    });

    // Create the debt
    const debt = new EmployeeDebt({
      employee: employeeId,
      description,
      notes,
      createdBy: userId,
      type,
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      exchangeRateSnapshot: exchangeRateSnapshot || undefined,
      items: validatedItems,
    });

    await debt.save(); // pre-save hook in model will recalc totalAmount

    // Return populated
    const populatedDebt = await EmployeeDebt.findById(debt._id)
      .populate('employee', 'name position')
      .populate('createdBy', 'username');

    return populatedDebt;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Error al crear la deuda del empleado: ${error.message}`,
      500,
      ErrorTypes.DATABASE_ERROR
    );
  }
};

/**
 * Get debts for a specific employee
 */
export const getEmployeeDebts = async (employeeId) => {
  try {
    const debts = await EmployeeDebt.find({ employee: employeeId })
      .populate('employee', 'name position')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    return debts;
  } catch (error) {
    throw new AppError('Error al obtener las deudas del empleado', 500, ErrorTypes.DATABASE_ERROR);
  }
};

/**
 * Get all debts with optional filters
 */
export const getAllDebts = async (filters = {}) => {
  try {
    const { status, employeeId, startDate, endDate, page = 1, limit = 20 } = filters;

    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const debts = await EmployeeDebt.find(query)
      .populate('employee', 'name position')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EmployeeDebt.countDocuments(query);

    return {
      debts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new AppError('Error al obtener las deudas', 500, ErrorTypes.DATABASE_ERROR);
  }
};

/**
 * Get a specific debt by ID
 */
export const getDebtById = async (debtId) => {
  try {
    const debt = await EmployeeDebt.findById(debtId)
      .populate('employee', 'name position')
      .populate('createdBy', 'username');

    if (!debt) {
      throw new AppError('Deuda no encontrada', 404, ErrorTypes.NOT_FOUND);
    }

    return debt;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al obtener la deuda', 500, ErrorTypes.DATABASE_ERROR);
  }
};

/**
 * Update a debt (description, notes, status)
 */
export const updateDebt = async (debtId, updateData) => {
  try {
    const debt = await EmployeeDebt.findById(debtId);
    if (!debt) {
      throw new AppError('Deuda no encontrada', 404, ErrorTypes.NOT_FOUND);
    }

    const allowedUpdates = ['description', 'notes', 'status', 'exchangeRateSnapshot'];
    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        debt[field] = updateData[field];
      }
    });

    if (updateData.status === 'paid' && !debt.paymentDate) {
      debt.paymentDate = new Date();
    }

    await debt.save();

    return await EmployeeDebt.findById(debtId)
      .populate('employee', 'name position')
      .populate('createdBy', 'username');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al actualizar la deuda', 500, ErrorTypes.DATABASE_ERROR);
  }
};

/**
 * Add items to an existing debt
 */
export const addItemsToDebt = async (debtId, itemsData) => {
  try {
    const debt = await EmployeeDebt.findById(debtId);
    if (!debt) {
      throw new AppError('Deuda no encontrada', 404, ErrorTypes.NOT_FOUND);
    }

    if (debt.status !== 'pending') {
      throw new AppError(
        'No se pueden agregar elementos a una deuda que no esté pendiente',
        400,
        ErrorTypes.INVALID_INPUT
      );
    }

    if (!Array.isArray(itemsData)) {
      throw new AppError('items debe ser un array', 400, ErrorTypes.VALIDATION_ERROR);
    }

    const validatedItems = itemsData.map((item, idx) => {
      const { concept, unitAmount, quantity } = item || {};
      if (typeof concept !== 'string' || !concept.trim()) {
        throw new AppError(`El ítem #${idx + 1} requiere concept válido`, 400, ErrorTypes.VALIDATION_ERROR);
      }
      const qtyNum = Number(quantity);
      const amtNum = Number(unitAmount);
      if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
        throw new AppError(`quantity inválida en ítem #${idx + 1}`, 400, ErrorTypes.VALIDATION_ERROR);
      }
      if (Number.isNaN(amtNum) || amtNum < 0) {
        throw new AppError(`unitAmount inválido en ítem #${idx + 1}`, 400, ErrorTypes.VALIDATION_ERROR);
      }
      return {
        concept: concept.trim(),
        quantity: qtyNum,
        unitAmount: amtNum,
      };
    });

    debt.items.push(...validatedItems);
    await debt.save(); // model recalculates totalAmount

    return await EmployeeDebt.findById(debtId)
      .populate('employee', 'name position')
      .populate('createdBy', 'username');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al agregar elementos a la deuda', 500, ErrorTypes.DATABASE_ERROR);
  }
};

/**
 * Delete a debt
 */
export const deleteDebt = async (debtId) => {
  try {
    const debt = await EmployeeDebt.findById(debtId);
    if (!debt) {
      throw new AppError('Deuda no encontrada', 404, ErrorTypes.NOT_FOUND);
    }

    if (debt.status !== 'pending') {
      throw new AppError('No se puede eliminar una deuda que no esté pendiente', 400, ErrorTypes.INVALID_INPUT);
    }

    await EmployeeDebt.findByIdAndDelete(debtId);
    return { message: 'Deuda eliminada exitosamente' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al eliminar la deuda', 500, ErrorTypes.DATABASE_ERROR);
  }
};

/**
 * Get debts summary per employee
 */
export const getDebtsSummary = async () => {
  try {
    const summary = await EmployeeDebt.aggregate([
      {
        $group: {
          _id: '$employee',
          totalDebts: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0],
            },
          },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $project: {
          employee: {
            _id: '$employee._id',
            name: '$employee.name',
            position: '$employee.position',
          },
          totalDebts: 1,
          totalAmount: 1,
          pendingAmount: 1,
          paidAmount: 1,
        },
      },
    ]);

    return summary;
  } catch (error) {
    throw new AppError('Error al obtener el resumen de deudas', 500, ErrorTypes.DATABASE_ERROR);
  }
};

/**
 * Mark specific items as paid
 */
export const markItemsAsPaid = async (debtId, itemIndexes, userId) => {
  try {
    const debt = await EmployeeDebt.findById(debtId);
    console.log(debt, itemIndexes, userId, 'markItemsAsPaid')
    if (!debt) {
      throw new AppError('Deuda no encontrada', 404, ErrorTypes.NOT_FOUND);
    }

    if (debt.status === 'cancelled') {
      throw new AppError('No se pueden modificar items de una deuda cancelada', 400, ErrorTypes.INVALID_INPUT);
    }

    // Validar que los índices sean válidos
    if (!Array.isArray(itemIndexes) || itemIndexes.length === 0) {
      throw new AppError('Debe proporcionar al menos un índice de item válido', 400, ErrorTypes.VALIDATION_ERROR);
    }

    // Validar que los índices estén dentro del rango
    itemIndexes.forEach(index => {
      if (index < 0 || index >= debt.items.length) {
        throw new AppError(`Índice de item inválido: ${index}`, 400, ErrorTypes.VALIDATION_ERROR);
      }
    });

    // Marcar items como pagados
    await debt.markItemsAsPaid(itemIndexes, userId);

    // Retornar la deuda actualizada
    return await EmployeeDebt.findById(debtId)
      .populate('employee', 'name position')
      .populate('createdBy', 'username')
      .populate('items.paidBy', 'username');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Error al marcar items como pagados: ${error.message}`,
      500,
      ErrorTypes.DATABASE_ERROR
    );
  }
};

/**
 * Mark specific items as unpaid
 */
export const markItemsAsUnpaid = async (debtId, itemIndexes) => {
  try {
    const debt = await EmployeeDebt.findById(debtId);
    if (!debt) {
      throw new AppError('Deuda no encontrada', 404, ErrorTypes.NOT_FOUND);
    }

    if (debt.status === 'cancelled') {
      throw new AppError('No se pueden modificar items de una deuda cancelada', 400, ErrorTypes.INVALID_INPUT);
    }

    // Validar que los índices sean válidos
    if (!Array.isArray(itemIndexes) || itemIndexes.length === 0) {
      throw new AppError('Debe proporcionar al menos un índice de item válido', 400, ErrorTypes.VALIDATION_ERROR);
    }

    // Validar que los índices estén dentro del rango
    itemIndexes.forEach(index => {
      if (index < 0 || index >= debt.items.length) {
        throw new AppError(`Índice de item inválido: ${index}`, 400, ErrorTypes.VALIDATION_ERROR);
      }
    });

    // Marcar items como no pagados
    await debt.markItemsAsUnpaid(itemIndexes);

    // Retornar la deuda actualizada
    return await EmployeeDebt.findById(debtId)
      .populate('employee', 'name position')
      .populate('createdBy', 'username')
      .populate('items.paidBy', 'username');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Error al marcar items como no pagados: ${error.message}`,
      500,
      ErrorTypes.DATABASE_ERROR
    );
  }
};

/**
 * Get payment history for a specific debt
 */
export const getDebtPaymentHistory = async (debtId) => {
  try {
    const debt = await EmployeeDebt.findById(debtId)
      .populate('employee', 'name position')
      .populate('createdBy', 'username')
      .populate('items.paidBy', 'username');

    if (!debt) {
      throw new AppError('Deuda no encontrada', 404, ErrorTypes.NOT_FOUND);
    }

    // Separar items pagados y no pagados
    const paidItems = debt.items.filter(item => item.isPaid);
    const unpaidItems = debt.items.filter(item => !item.isPaid);

    // Calcular totales
    const totalPaidUSD = debt.calculatedPaidTotalUSD;
    const totalUnpaidUSD = debt.calculatedTotalUSD;
    const totalPaidBs = debt.calculatedPaidTotalBs;
    const totalUnpaidBs = debt.calculatedTotalBs;

    return {
      debt: {
        _id: debt._id,
        employee: debt.employee,
        description: debt.description,
        type: debt.type,
        status: debt.status,
        totalAmount: debt.totalAmount,
        paymentPercentage: debt.paymentPercentage,
        isFullyPaid: debt.isFullyPaid,
        createdAt: debt.createdAt,
        updatedAt: debt.updatedAt,
      },
      items: {
        paid: paidItems,
        unpaid: unpaidItems,
        total: debt.items.length,
        paidCount: paidItems.length,
        unpaidCount: unpaidItems.length,
      },
      totals: {
        paid: {
          USD: totalPaidUSD,
          Bs: totalPaidBs,
        },
        unpaid: {
          USD: totalUnpaidUSD,
          Bs: totalUnpaidBs,
        },
        original: {
          USD: debt.items.reduce((sum, item) => {
            const subtotal = Number(item.unitAmount || 0) * Number(item.quantity || 0);
            if (debt.type === 'vale') {
              const rate = Number(debt.exchangeRateSnapshot?.rate || 0);
              return sum + (rate > 0 ? Number((subtotal / rate).toFixed(2)) : 0);
            }
            return sum + Number(subtotal.toFixed(2));
          }, 0),
        },
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Error al obtener el historial de pagos: ${error.message}`,
      500,
      ErrorTypes.DATABASE_ERROR
    );
  }
};
