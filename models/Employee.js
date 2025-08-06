import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    weeklySalary: { type: Number, required: true }, // Monto en $
    name: { type: String, required: true }, // Nombre
    accountNumber: { type: String, required: false }, // Numero de cuenta
    idNumber: { type: String, required: false }, // Tipo de gasto
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;

