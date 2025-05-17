import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  supplier: { type: String, required: true }, // Proveedor
  dueDate: { type: Date, default: Date.now, required: true }, // Fecha de vencimiento
  amountDollars: { type: Number, required: true }, // Monto en $ o Bs
  amountBs: { type: Number, required: true }, // Monto en $ o Bs
  currency: { type: String, enum: ['$', 'Bs'], required: true }, // Moneda
  type: { type: String, required: true }, // Tipo de gasto
  subType: { type: String, required: false }, // Subtipo de gasto
  paymentMethod: { type: String, required: false }, // Como se paga
  description: { type: String, required: true }, // Descripcion del gasto
  date: { type: Date, default: Date.now, required: true }, // Fecha del gasto
  paid: { type: Boolean, required: true },
  googleRow: { type: Number, required: true },
  numeroFactura: { type: String, required: false}
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
