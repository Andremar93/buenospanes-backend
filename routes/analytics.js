// routes/analyitcs.js
import express from 'express';
import { getMonthlyCashFlow } from '../controllers/analytics.js';
import auth from '../middleware/auth.js';
import checkRole from '../middleware/role.js';

const router = express.Router();

router.use(auth, checkRole('admin'));

router.get('/monthly-cash-flow', getMonthlyCashFlow);

export default router;