import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    position: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    weeklySalary: { 
      type: Number, 
      required: true,
      min: 0
    },
    accountNumber: { 
      type: String, 
      required: false,
      trim: true
    },
    idNumber: { 
      type: String, 
      required: false,
      trim: true
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: false,
      trim: true
    },
    startDate: {
      type: Date,
      required: false,
      default: Date.now
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Índices para mejor performance
employeeSchema.index({ name: 1 });
employeeSchema.index({ position: 1 });
employeeSchema.index({ active: 1 });
employeeSchema.index({ startDate: -1 });

// Virtual para obtener el nombre completo
employeeSchema.virtual('fullName').get(function() {
  return this.name;
});

// Método para obtener empleados activos
employeeSchema.statics.findActive = function() {
  return this.find({ active: true });
};

// Método para desactivar empleado
employeeSchema.methods.deactivate = function() {
  this.active = false;
  return this.save();
};

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
