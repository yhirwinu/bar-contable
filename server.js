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

