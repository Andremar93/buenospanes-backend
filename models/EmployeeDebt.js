// models/EmployeeDebt.js
import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    concept: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitAmount: {
      // USD if type === 'standard', Bs if type === 'vale'
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    // Nuevos campos para pagos parciales
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const EmployeeDebtSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    // 'standard' => items in USD
    // 'vale'     => items in VES/Bs, converted to USD using exchangeRateSnapshot.rate
    type: {
      type: String,
      enum: ['standard', 'vale'],
      default: 'standard',
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Persisted total in USD (always)
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
      index: true,
    },

    paymentDate: {
      type: Date,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Embedded items
    items: {
      type: [ItemSchema],
      default: [],
    },

    /**
     * For "vale" debts we snapshot the rate used to convert Bs -> USD.
     * rate = Bs per 1 USD (e.g., 40.5 means 40.5 Bs = 1 USD)
     */
    exchangeRateSnapshot: {
      rate: { type: Number, min: 0 },
      date: { type: Date },
      source: { type: String, trim: true }, // optional: e.g., "BCV", "backend-service"
    },
  },
  {
    timestamps: true,
  }
);

/* ----------------------------- VIRTUALS ---------------------------------- */

// Virtual: sum of item subtotals in the *item currency* (only unpaid items)
EmployeeDebtSchema.virtual('itemsSubtotal').get(function () {
  return (this.items || []).reduce(
    (sum, it) => {
      if (it.isPaid) return sum; // Skip paid items
      return sum + Number(it.unitAmount || 0) * Number(it.quantity || 0);
    },
    0
  );
});

// Virtual: sum of paid item subtotals in the *item currency*
EmployeeDebtSchema.virtual('paidItemsSubtotal').get(function () {
  return (this.items || []).reduce(
    (sum, it) => {
      if (!it.isPaid) return sum; // Skip unpaid items
      return sum + Number(it.unitAmount || 0) * Number(it.quantity || 0);
    },
    0
  );
});

// Total in USD (derived at read time) - only unpaid items
EmployeeDebtSchema.virtual('calculatedTotalUSD').get(function () {
  const raw = Number(this.itemsSubtotal || 0);
  if (this.type === 'vale') {
    const rate = Number(this.exchangeRateSnapshot?.rate || 0);
    if (rate > 0) return Number((raw / rate).toFixed(2));
    // no rate? fall back to persisted totalAmount
    return Number(this.totalAmount || 0);
  }
  // standard => unitAmount is USD
  return Number(raw.toFixed(2));
});

// Total in Bs (derived at read time) - only unpaid items
EmployeeDebtSchema.virtual('calculatedTotalBs').get(function () {
  const raw = Number(this.itemsSubtotal || 0);
  if (this.type === 'vale') {
    // vale => raw already in Bs
    return Number(raw.toFixed(2));
  }
  // standard => convert USD -> Bs if we have a rate
  const rate = Number(this.exchangeRateSnapshot?.rate || 0);
  if (rate > 0) return Number((raw * rate).toFixed(2));
  return 0;
});

// Total paid in USD
EmployeeDebtSchema.virtual('calculatedPaidTotalUSD').get(function () {
  const raw = Number(this.paidItemsSubtotal || 0);
  if (this.type === 'vale') {
    const rate = Number(this.exchangeRateSnapshot?.rate || 0);
    if (rate > 0) return Number((raw / rate).toFixed(2));
    return 0;
  }
  // standard => unitAmount is USD
  return Number(raw.toFixed(2));
});

// Total paid in Bs
EmployeeDebtSchema.virtual('calculatedPaidTotalBs').get(function () {
  const raw = Number(this.paidItemsSubtotal || 0);
  if (this.type === 'vale') {
    // vale => raw already in Bs
    return Number(raw.toFixed(2));
  }
  // standard => convert USD -> Bs if we have a rate
  const rate = Number(this.exchangeRateSnapshot?.rate || 0);
  if (rate > 0) return Number((raw * rate).toFixed(2));
  return 0;
});

// Virtual para verificar si toda la deuda está pagada
EmployeeDebtSchema.virtual('isFullyPaid').get(function () {
  return this.items && this.items.length > 0 && this.items.every(item => item.isPaid);
});

// Virtual para obtener el porcentaje de pago
EmployeeDebtSchema.virtual('paymentPercentage').get(function () {
  if (!this.items || this.items.length === 0) return 0;
  const paidCount = this.items.filter(item => item.isPaid).length;
  return Math.round((paidCount / this.items.length) * 100);
});

/* ----------------------------- HELPERS ----------------------------------- */

function round2(n) {
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

// Try to fetch exchange rate for a given date from an optional ExchangeRate model
async function resolveRateIfNeeded(doc) {
  if (doc.type !== 'vale') return; // only required for vale
  if (doc.exchangeRateSnapshot?.rate > 0) return; // already provided

  // If you maintain a collection with daily rates, you can look it up here:
  // Expected schema: { date: Date, rate: Number } with rate=Bs per USD
  let ExchangeRate;
  try {
    ExchangeRate = mongoose.model('ExchangeRate');
  } catch {
    ExchangeRate = null;
  }

  if (!ExchangeRate) {
    throw new mongoose.Error.ValidationError(
      new Error('ExchangeRate model not registered and no exchangeRateSnapshot.rate provided for vale.')
    );
  }

  // Use createdAt (or now for new docs) to find nearest rate at or before that date
  const refDate = doc.createdAt || new Date();
  const rateDoc =
    (await ExchangeRate.findOne({ date: { $lte: refDate } }).sort({ date: -1 })) ||
    (await ExchangeRate.findOne().sort({ date: -1 })); // fallback to latest

  if (!rateDoc?.rate) {
    throw new mongoose.Error.ValidationError(
      new Error('No exchange rate found to convert vale amount and exchangeRateSnapshot.rate was not provided.')
    );
  }

  doc.exchangeRateSnapshot = {
    rate: Number(rateDoc.rate),
    date: rateDoc.date,
    source: doc.exchangeRateSnapshot?.source || 'ExchangeRate.collection',
  };
}

function recalcTotals(doc) {
  const subtotal = (doc.items || []).reduce((sum, it) => {
    if (it.isPaid) return sum; // Skip paid items
    const q = Number(it.quantity || 0);
    const u = Number(it.unitAmount || 0);
    return sum + q * u;
  }, 0);

  if (doc.type === 'vale') {
    const rate = Number(doc.exchangeRateSnapshot?.rate || 0);
    doc.totalAmount = rate > 0 ? round2(subtotal / rate) : round2(doc.totalAmount || 0);
  } else {
    // standard: USD
    doc.totalAmount = round2(subtotal);
  }
}

/* ------------------------------ HOOKS ------------------------------------ */

// Validate and compute before save
EmployeeDebtSchema.pre('validate', async function (next) {
  try {
    // Ensure rate for vale if not provided
    await resolveRateIfNeeded(this);

    // Auto-set paymentDate if status changed to paid (on create/validate)
    if (this.isModified('status') && this.status === 'paid' && !this.paymentDate) {
      this.paymentDate = new Date();
    }

    next();
  } catch (err) {
    next(err);
  }
});

EmployeeDebtSchema.pre('save', function (next) {
  try {
    recalcTotals(this);
    next();
  } catch (err) {
    next(err);
  }
});

// Support updates via findOneAndUpdate (e.g., items or type changed)
EmployeeDebtSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;
  try {
    // We might need a rate if the doc is now 'vale' and rate missing
    await resolveRateIfNeeded(doc);
    recalcTotals(doc);
    // Auto paymentDate if paid
    if (doc.isModified?.('status') ? doc.isModified('status') : true) {
      if (doc.status === 'paid' && !doc.paymentDate) {
        doc.paymentDate = new Date();
      }
    }
    await doc.save();
  } catch (err) {
    console.error('Error recalculating totals in post(findOneAndUpdate):', err);
  }
});

/* ------------------------------ METHODS ---------------------------------- */

EmployeeDebtSchema.methods.markAsPaid = function () {
  this.status = 'paid';
  if (!this.paymentDate) this.paymentDate = new Date();
  return this.save();
};

// Método para marcar items específicos como pagados
EmployeeDebtSchema.methods.markItemsAsPaid = function (itemIndexes, userId) {
  if (!Array.isArray(itemIndexes)) {
    throw new Error('itemIndexes debe ser un array');
  }

  const now = new Date();
  itemIndexes.forEach(index => {
    if (index >= 0 && index < this.items.length) {
      this.items[index].isPaid = true;
      this.items[index].paidAt = now;
      this.items[index].paidBy = userId;
    }
  });

  // Recalcular totales
  recalcTotals(this);
  
  // Actualizar status si todos los items están pagados
  if (this.isFullyPaid) {
    this.status = 'paid';
    if (!this.paymentDate) this.paymentDate = now;
  }

  return this.save();
};

// Método para marcar items específicos como no pagados
EmployeeDebtSchema.methods.markItemsAsUnpaid = function (itemIndexes) {
  if (!Array.isArray(itemIndexes)) {
    throw new Error('itemIndexes debe ser un array');
  }

  itemIndexes.forEach(index => {
    if (index >= 0 && index < this.items.length) {
      this.items[index].isPaid = false;
      this.items[index].paidAt = undefined;
      this.items[index].paidBy = undefined;
    }
  });

  // Recalcular totales
  recalcTotals(this);
  
  // Actualizar status si ya no está completamente pagada
  if (this.status === 'paid' && !this.isFullyPaid) {
    this.status = 'pending';
    this.paymentDate = undefined;
  }

  return this.save();
};

/* ------------------------------ INDEXES ---------------------------------- */

EmployeeDebtSchema.index({ employee: 1, status: 1 });
EmployeeDebtSchema.index({ createdAt: -1 });
EmployeeDebtSchema.index({ createdBy: 1 });
EmployeeDebtSchema.index({ 'items.isPaid': 1 }); // Índice para items pagados

/* --------------------------- SERIALIZATION -------------------------------- */

EmployeeDebtSchema.set('toJSON', { virtuals: true, getters: true });
EmployeeDebtSchema.set('toObject', { virtuals: true, getters: true });

const EmployeeDebt = mongoose.model('EmployeeDebt', EmployeeDebtSchema);
export default EmployeeDebt;
