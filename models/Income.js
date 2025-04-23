import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
  sitef: { type: Number, required: true }, 
  puntoExterno: { type: Number, required: true }, 
  efectivoBs: { type: Number, required: true }, 
  efectivoDolares: { type: Number, required: true }, 
  pagomovil: { type: Number, required: true }, 
  biopago: { type: Number, required: true }, 
  gastosBs: { type: Number, required: true }, 
  gastosDolares: { type: Number, required: true }, 
  totalSistema: { type: Number, required: true }, 
  notas: { type: String, required: false }, 
  date: { type: Date, default: Date.now, required: true }, 
  googleRow: { type: Number, required: true }
}, { timestamps: true });

const Income = mongoose.model('Income', incomeSchema);

export default Income;
