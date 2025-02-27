import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
  sitef: { type: Number, required: true }, 
  puntoBs: { type: Number, required: true }, 
  efectivoBs: { type: Number, required: true }, 
  efectivoDolares: { type: Number, required: true }, 
  pagoMovil: { type: Number, required: true }, 
  bioPago: { type: Number, required: true }, 
  gastosBs: { type: Number, required: false }, 
  gastosDolares: { type: Number, required: false }, 
  totalSistema: { type: Number, required: false }, 
  notas: { type: String, required: true }, 
  date: { type: Date, default: Date.now, required: true }, 
}, { timestamps: true });

const Income = mongoose.model('Income', incomeSchema);

export default Income;
