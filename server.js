const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos en memoria (puedes adaptarla o expandirla)
let usuarios = [
  { id: 1, usuario: 'admin', password: '123' } // Credenciales de acceso corregidas
];

let inventario = [
  { id: 1, nombre: 'Cerveza', categoria: 'Cervezas', stock: 120 } // Stock inicial en unidades
];

let ventas = [];

// 1. Endpoint de Login corregido
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = usuarios.find(u => u.usuario === usuario && u.password === password);
  
  if (user) {
    res.json({ success: true, message: 'Acceso exitoso', user: { id: user.id, usuario: user.usuario } });
  } else {
    res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
  }
});

// 2. Endpoint para consultar el inventario actual
app.get('/api/inventario', (req, res) => {
  res.json(inventario);
});

// 3. Endpoint para procesar ventas, descontar inventario y registrar moneda de pago
app.post('/api/vender', (req, res) => {
  const { productoId, presentacion, moneda } = req.body; // presentacion: 1, 6 o 12 | moneda: 'USD' o 'BS'
  
  const producto = inventario.find(p => p.id === parseInt(productoId));
  if (!producto) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado en el inventario' });
  }

  let unidadesADescontar = parseInt(presentacion);
  if (producto.stock < unidadesADescontar) {
    return res.status(400).json({ success: false, message: 'Stock insuficiente para completar esta venta' });
  }

  let precioTotal = 0;
  if (unidadesADescontar === 1) {
    precioTotal = moneda === 'USD' ? 1.00 : 700; // 1$ o su proporción en Bs
  } else if (unidadesADescontar === 6) {
    precioTotal = moneda === 'USD' ? 5.00 : 4200.00; // Medio tobo
  } else if (unidadesADescontar === 12) {
    precioTotal = moneda === 'USD' ? 10.00 : 8000.00; // Tobo de 12 (Promoción)
  } else {
    return res.status(400).json({ success: false, message: 'Presentación no válida' });
  }

  // Descontar unidades del inventario
  producto.stock -= unidadesADescontar;

  // Registrar la venta en el historial diario
  const nuevaVenta = {
    id: ventas.length + 1,
    productoId: producto.id,
    productoNombre: producto.nombre,
    unidadesDescontadas: unidadesADescontar,
    total: precioTotal,
    moneda: moneda,
    fecha: new Date()
  };
  ventas.push(nuevaVenta);

  res.json({
    success: true,
    message: 'Venta registrada y stock actualizado con éxito',
    nuevoStock: producto.stock,
    venta: nuevaVenta
  });
});

// Servir el archivo frontend principal para cualquier otra ruta
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
