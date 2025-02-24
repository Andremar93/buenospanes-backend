import Expense from '../models/Expense.js';

// Crear un nuevo ingreso o gasto
export const createExpense = async (description, amountBs, amountDollars, currency, date, type, subType, paymentMethod, paid, invoiceId) => {

  try {

    console.log('createExpense from Controller')
    console.log(description, amountBs, amountDollars, currency, date, type, subType, paymentMethod, paid, invoiceId)
    const newExpense = new Expense({ description, amountBs, amountDollars, currency, date, type, subType, paymentMethod, paid, invoiceId });
    await newExpense.save();
    return true
  } catch (error) {
    console.log('createExpenseFromController', error)
    return false;
  }
};


