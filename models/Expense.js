import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  amountDollars: { type: Number, required: true }, // Monto en $ o Bs
  amountBs: { type: Number, required: true }, // Monto en $ o Bs
  currency: { type: String, enum: ['$', 'Bs'], required: true }, // Moneda
  type: { type: String, required: true }, // Tipo de gasto
  subType: { type: String, required: false }, // Subtipo de gasto
  paymentMethod: { type: String, required: false }, // Como se paga
  description: { type: String, required: true }, // Descripcion del gasto
  date: { type: Date, default: Date.now, required: true }, // Fecha del gasto
  paid: { type: Boolean, required: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: false },
  googleRow: { type: Number, required: true },
  usuario: {type: String, required: true}
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
