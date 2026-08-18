const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
// Sirve los archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Base de datos en memoria
let usuarios = [
  { id: 1, usuario: 'admin', password: '123' }
];

let inventario = [
  { id: 1, nombre: 'Cerveza', categoria: 'Cervezas', stock: 120 }
];

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

// Endpoint para consultar el inventario actual
app.get('/api/inventario', (req, res) => {
  res.json(inventario);
});

// Mantener el servidor activo y escuchando en Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});
