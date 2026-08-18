const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Datos iniciales de ejemplo
let inventario = [
  { id: 1, nombre: 'Cerveza Corona', categoria: 'Cervezas', precio: 2.50, stock: 48 },
  { id: 2, nombre: 'Ron Santa Teresa (Botella)', categoria: 'Licores', precio: 25.00, stock: 12 },
  { id: 3, nombre: 'Gin Tonic Clásico', categoria: 'Tragos', precio: 6.00, stock: 30 }
];

let ventas = [];

// Rutas de la API
app.get('/api/inventario', (req, res) => res.json(inventario));
app.get('/api/ventas', (req, res) => res.json(ventas));

app.post('/api/ventas', (req, res) => {
  const { productoId, cantidad } = req.body;
  const producto = inventario.find(p => p.id === parseInt(productoId));

  if (!producto || producto.stock < cantidad) {
    return res.status(400).json({ error: 'Stock insuficiente' });
  }

  producto.stock -= parseInt(cantidad);
  const total = producto.precio * parseInt(cantidad);
  const nuevaVenta = {
    id: ventas.length + 1,
    producto: producto.nombre,
    cantidad: parseInt(cantidad),
    total: total,
    hora: new Date().toLocaleTimeString()
  };
  ventas.push(nuevaVenta);
  res.json({ exito: true, venta: nuevaVenta });
});

app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
