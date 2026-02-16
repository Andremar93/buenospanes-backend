import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    rate: { type: Number, required: true }
  },
  { timestamps: true }
);

const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

export default ExchangeRate; 
