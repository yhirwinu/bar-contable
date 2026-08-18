const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
// Sirve los archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Base de datos de usuarios
let usuarios = [
  { id: 1, usuario: 'admin', password: '123' },
  { id: 2, usuario: 'yhirwin', password: 'Inc.123' }
];

// Base de datos de inventario
let inventario = [
  { id: 1, nombre: 'Cerveza', categoria: 'Cervezas', stock: 120 }
];

// Base de datos de ventas (Cuentas de hoy)
let ventas = [];

// Precios y reglas de descuento para las cervezas
const preciosCerveza = {
    unidad: { qty: 1, dolares: 1, bolivares: 800 },
    tobo6: { qty: 6, dolares: 5, bolivares: 4200 },
    tobo12: { qty: 12, dolares: 10, bolivares: 8000 }
};

// Endpoint de Login
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = usuarios.find(u => u.usuario === usuario && u.password === password);
  
  if (user) {
    res.json({ success: true, message: 'Acceso exitoso', user: { id: user.id, usuario: user.usuario } });
  } else {
    res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
  }
});

// Endpoint para consultar el inventario
app.get('/api/inventario', (req, res) => {
  res.json(inventario);
});

// Endpoint para procesar una venta y descontar stock
app.post('/api/ventas', (req, res) => {
    const { idProducto, tipoVenta, metodoPago } = req.body;
    const producto = inventario.find(p => p.id === parseInt(idProducto));

    if (!producto) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

    const detalleVenta = preciosCerveza[tipoVenta];
    if (!detalleVenta) return res.status(400).json({ success: false, message: 'Tipo de venta inválido' });

    if (producto.stock < detalleVenta.qty) {
        return res.status(400).json({ success: false, message: `Stock insuficiente. Tienes ${producto.stock} unidades.` });
    }

    // Descontar inventario (1, 6 o 12 unidades)
    producto.stock -= detalleVenta.qty;

    // Registrar ingreso de dinero
    const monto = metodoPago === 'dolares' ? detalleVenta.dolares : detalleVenta.bolivares;
    const nuevaVenta = {
        id: ventas.length + 1,
        producto: producto.nombre,
        tipoVenta: tipoVenta,
        metodoPago: metodoPago,
        monto: monto,
        fecha: new Date().toISOString()
    };
    
    ventas.push(nuevaVenta);

    res.json({ success: true, message: 'Venta procesada con éxito', venta: nuevaVenta });
});

// Endpoint para consultar las ventas (Cuentas de hoy)
app.get('/api/ventas', (req, res) => {
    res.json(ventas);
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Mantener el servidor activo
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});
