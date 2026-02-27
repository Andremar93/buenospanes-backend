// routes/index.js
import express from 'express';
import authRoutes from './auth.js';
import expenseRoutes from './expenses.js';
import exchangeRateRoutes from './exchangeRate.js';
import invoiceRoutes from './invoices.js';
import incomeRoutes from './incomes.js';
import employeeRoutes from './employee.js';
import employeeDebtRoutes from './employeeDebts.js';
import analyticsRoutes from './analytics.js';


const router = express.Router();

// Ruta de prueba
router.get('/', (req, res) => {
  res.json({
    message: 'API de Buenos Panes funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/auth',
      expenses: '/expenses',
      'exchange-rate': '/exchange-rate',
      invoices: '/invoices',
      incomes: '/incomes',
      employees: '/employees',
      'employee-debts': '/employee-debts'
    }
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    version: process.version
  });
});

// Ping endpoint
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Rutas de autenticación (públicas)
router.use('/auth', authRoutes);

// Rutas protegidas
router.use('/expenses', expenseRoutes);
router.use('/exchange-rate', exchangeRateRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/incomes', incomeRoutes);
router.use('/employees', employeeRoutes);
router.use('/employee-debts', employeeDebtRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
