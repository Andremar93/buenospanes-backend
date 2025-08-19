# 🥖 Buenos Panes - Backend

Backend para el sistema de gestión de panadería Buenos Panes, construido con Node.js, Express y MongoDB.

## 🚀 Características

- **Autenticación JWT** con refresh tokens
- **Validación de datos** robusta con express-validator
- **Manejo de errores** estructurado y detallado
- **Seguridad** con Helmet, CORS y rate limiting
- **Compresión** de respuestas para mejor performance
- **Logging** estructurado
- **Configuración** centralizada por entorno
- **Google Sheets API** integrada
- **Gestión de gastos, ingresos, facturas y empleados**

## 📋 Prerrequisitos

- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB >= 5.0

## 🛠️ Instalación

1. **Clonar el repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd buenospanes-backend
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   # Editar .env con tus valores
   ```

4. **Variables de entorno requeridas**

   ```env
   # Configuración del servidor
   NODE_ENV=development
   PORT=3000
   CORS_ORIGIN=*

   # Base de datos MongoDB
   MONGO_URI=mongodb://localhost:27017
   MONGO_DB_NAME=panaderia

   # JWT (JSON Web Tokens)
   JWT_SECRET=tu_jwt_secret_super_seguro_aqui
   JWT_REFRESH_SECRET=tu_jwt_refresh_secret_super_seguro_aqui

   # Google Sheets API (opcional)
   GOOGLE_ENABLED=false
   GOOGLE_CLIENT_EMAIL=tu_email@proyecto.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=tu_clave_privada_aqui
   GOOGLE_SPREADSHEET_ID=tu_spreadsheet_id_aqui
   ```

## 🚀 Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

### Otros comandos

```bash
npm run lint          # Verificar código con ESLint
npm run lint:fix      # Corregir errores de ESLint automáticamente
npm run format        # Formatear código con Prettier
npm run audit         # Verificar vulnerabilidades de dependencias
npm run audit:fix     # Corregir vulnerabilidades automáticamente
```

## 📚 API Endpoints

### Autenticación (Público)

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Cerrar sesión

### Gastos (Admin)

- `POST /api/expenses/create` - Crear gasto
- `POST /api/expenses/create-by-invoice` - Crear gasto desde factura
- `PUT /api/expenses/:id` - Actualizar gasto
- `POST /api/expenses/get` - Obtener gastos
- `GET /api/expenses/expenses-resume` - Resumen de gastos

### Facturas (Admin)

- `POST /api/invoices/create` - Crear factura
- `GET /api/invoices/get` - Obtener facturas
- `PUT /api/invoices/:id` - Actualizar factura
- `DELETE /api/invoices/:id` - Eliminar factura

### Ingresos (Admin + Caja)

- `POST /api/incomes/create` - Crear ingreso
- `GET /api/incomes/get` - Obtener ingresos
- `PUT /api/incomes/:id` - Actualizar ingreso
- `DELETE /api/incomes/:id` - Eliminar ingreso

### Empleados (Admin)

- `POST /api/employees/create` - Crear empleado
- `GET /api/employees/get` - Obtener empleados
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado

### Tasa de Cambio (Admin)

- `POST /api/exchange-rate/create` - Crear tasa de cambio
- `GET /api/exchange-rate/get` - Obtener tasas de cambio
- `PUT /api/exchange-rate/:id` - Actualizar tasa de cambio

### Utilidades

- `GET /api/health` - Estado del servidor
- `GET /api/ping` - Ping simple

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación:

1. **Login**: `POST /api/auth/login` con username y password
2. **Token**: Incluir en header: `Authorization: Bearer <token>`
3. **Refresh**: Usar refresh token para renovar el token principal
4. **Expiración**: Tokens expiran en 24h, refresh tokens en 7 días

## 🏗️ Estructura del Proyecto

```
buenospanes-backend/
├── config/                 # Configuración centralizada
│   └── config.js
├── controllers/            # Controladores de la lógica de negocio
│   ├── authController.js
│   ├── expenseControllers.js
│   ├── incomeControllers.js
│   ├── invoiceControllers.js
│   ├── employeeController.js
│   └── exchangeRateController.js
├── middleware/             # Middleware personalizado
│   ├── auth.js            # Autenticación JWT
│   ├── role.js            # Verificación de roles
│   ├── validation.js      # Validación de datos
│   └── errorHandler.js    # Manejo de errores
├── models/                 # Modelos de MongoDB
│   ├── User.js
│   ├── Expense.js
│   ├── Income.js
│   ├── Invoice.js
│   ├── Employee.js
│   └── ExchangeRate.js
├── routes/                 # Definición de rutas
│   ├── index.js           # Rutas principales
│   ├── auth.js            # Rutas de autenticación
│   ├── expenses.js        # Rutas de gastos
│   ├── incomes.js         # Rutas de ingresos
│   ├── invoices.js        # Rutas de facturas
│   ├── employees.js       # Rutas de empleados
│   └── exchangeRate.js    # Rutas de tasa de cambio
├── helpers/                # Funciones auxiliares
│   ├── currencyHelpers.js # Manejo de monedas
│   └── dateHelpers.js     # Manejo de fechas
├── googleapi/              # Integración con Google Sheets
│   └── google.js
├── server.js               # Punto de entrada principal
├── package.json
├── .eslintrc.json         # Configuración ESLint
├── .prettierrc            # Configuración Prettier
└── README.md
```

## 🔒 Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso entre orígenes
- **Rate Limiting**: Límite de peticiones por IP
- **JWT**: Tokens seguros con expiración
- **Validación**: Sanitización de datos de entrada
- **Bcrypt**: Hash seguro de contraseñas

## 📊 Base de Datos

### Modelos principales:

- **User**: Usuarios del sistema (admin, caja)
- **Expense**: Gastos de la panadería
- **Income**: Ingresos de la panadería
- **Invoice**: Facturas pendientes
- **Employee**: Empleados de la panadería
- **ExchangeRate**: Tasas de cambio USD/BS

### Índices recomendados:

```javascript
// En los modelos, agregar índices para mejor performance
UserSchema.index({ username: 1 });
ExpenseSchema.index({ date: -1, type: 1 });
IncomeSchema.index({ date: -1, type: 1 });
InvoiceSchema.index({ date: -1, paid: 1 });
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test

# Tests en modo watch
npm run test:watch

# Cobertura de tests
npm run test:coverage
```

## 📝 Logging

El sistema incluye logging estructurado:

- **Console**: Para desarrollo
- **File**: Para producción (configurable)
- **Niveles**: error, warn, info, debug
- **Formato**: JSON estructurado

## 🚀 Deployment

### Variables de entorno para producción:

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://tu-dominio.com
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net
JWT_SECRET=secret_muy_largo_y_complejo
```

### Comandos de deployment:

```bash
npm ci --only=production
npm start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 🆘 Soporte

Para soporte técnico o preguntas:

- Crear un issue en GitHub
- Contactar al equipo de desarrollo

## 🔄 Changelog

### v1.0.0

- Implementación inicial del backend
- Sistema de autenticación JWT
- CRUD completo para gastos, ingresos, facturas y empleados
- Integración con Google Sheets
- Sistema de manejo de errores robusto
- Validación de datos con express-validator
- Configuración centralizada
- Middleware de seguridad
