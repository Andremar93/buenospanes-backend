import mongoose from 'mongoose';

const bankAccountsSchema = new mongoose.Schema(
    {
        bankName: {
            type: String,
            required: true,
            trim: true,
        },
        accountBalanceEndOfDay: {
            type: Number,
            required: true,
            min: 0
        },
        accountBalanceSummary: {
            type: Number,
            required: true,
            min: 0
        },
        date: { type: Date, default: Date.now, required: true },

    },
    { timestamps: true }
);

// Índices para mejor performance
bankAccountsSchema.index({ bankName: 1 });
const BankAccounts = mongoose.model('BankAccounts', bankAccountsSchema);

export default BankAccounts;
