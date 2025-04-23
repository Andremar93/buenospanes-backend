import express from 'express';
import Invoice from '../models/Invoice.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';
import { createInvoice } from '../controllers/invoiceControllers.js'

const router = express.Router();

// Crear una nueva factura
router.post('/create', async (req, res) => {
  try {
    const newInvoice = await createInvoice(req.body)
    res.status(201).json({ message: 'Factura creada exitosamente', invoice: newInvoice });
  } catch (error) {
    console.log('error', error)
    // Si el error tiene un status definido, lo usamos, si no, usamos 500
    const status = error.status || 500;
    const message = error.message || 'Error al crear el gasto';
    res.status(status).json({ error: message });
  }
});

// Obtener todas las facturas
router.get('/get', async (req, res) => {
  try {
    const invoices = await Invoice.find({ paid: false }).sort({ date: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(400).json({ message: 'Error al obtener las facturas', error: error.message });
  }
});

// Obtener una factura por ID
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Error al obtener la factura', error: error.message });
  }
});

// Actualizar una factura
router.put('/:id', async (req, res) => {
  try {
    const { customer, amount, dueDate, status } = req.body;

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { customer, amount, dueDate, status, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    res.status(200).json({ message: 'Factura actualizada', invoice: updatedInvoice });
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar la factura', error: error.message });
  }
});

// Eliminar una factura
router.delete('/:id', async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    res.status(200).json({ message: 'Factura eliminada' });
  } catch (error) {
    res.status(400).json({ message: 'Error al eliminar la factura', error: error.message });
  }
});

export default router;
