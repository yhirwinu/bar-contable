const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la base de datos SQLite central
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      categoria TEXT,
      precio REAL,
      stock INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cuentasHoy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      pedido TEXT,
      montoTotalUSD REAL,
      montoTotalBs REAL,
      montoTotal REAL,
      estado TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cuentasPendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deudor TEXT,
      concepto TEXT,
      monto REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS registroVentas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hora TEXT,
      nombre TEXT,
      pedido TEXT,
      montoTotal REAL,
      monedaCobrada TEXT,
      montoReal REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      user TEXT PRIMARY KEY,
      pass TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cajaEntradas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dia TEXT,
      fecha TEXT,
      monto REAL,
      montoUSD REAL,
      montoBs REAL
    )`);

    // Valores por defecto iniciales si la BD está totalmente nueva
    db.get("SELECT value FROM config WHERE key = 'tasa'", (err, row) => {
      if (!row) {
        db.run("INSERT INTO config (key, value) VALUES ('tasa', '840')");
      }
    });

    db.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
      if (row && row.count === 0) {
        db.run("INSERT INTO usuarios (user, pass) VALUES ('yhirwin', 'Inc.123')");
      }
    });

    db.get("SELECT COUNT(*) as count FROM cajaEntradas", (err, row) => {
      if (row && row.count === 0) {
        const dias = [
          { dia: 'Lun', fecha: 'Lunes' },
          { dia: 'Mar', fecha: 'Martes' },
          { dia: 'Mié', fecha: 'Miércoles' },
          { dia: 'Jue', fecha: 'Jueves' },
          { dia: 'Vie', fecha: 'Viernes' }
        ];
        dias.forEach(d => {
          db.run("INSERT INTO cajaEntradas (dia, fecha, monto, montoUSD, montoBs) VALUES (?, ?, 0, 0, 0)", [d.dia, d.fecha]);
        });
      }
    });
  });
}

// API Endpoints para la sincronización en vivo
app.get('/api/state', (req, res) => {
  const state = {};
  db.get("SELECT value FROM config WHERE key = 'tasa'", (err, row) => {
    state.tasa = row ? parseFloat(row.value) : 840;

    db.all("SELECT * FROM inventario", (err, rows) => {
      state.inventario = rows || [];

      db.all("SELECT * FROM cuentasHoy", (err, rows) => {
        state.cuentasHoy = (rows || []).map(c => ({ ...c, pedido: JSON.parse(c.pedido || '[]') }));

        db.all("SELECT * FROM cuentasPendientes", (err, rows) => {
          state.cuentasPendientes = rows || [];

          db.all("SELECT * FROM registroVentas", (err, rows) => {
            state.registroVentas = rows || [];

            db.all("SELECT * FROM usuarios", (err, rows) => {
              state.usuarios = rows || [];

              db.all("SELECT * FROM cajaEntradas", (err, rows) => {
                state.cajaEntradas = rows || [];
                res.json(state);
              });
            });
          });
        });
      });
    });
  });
});

app.post('/api/state', (req, res) => {
  const { tasa, inventario, cuentasHoy, cuentasPendientes, registroVentas, usuarios, cajaEntradas } = req.body;

  db.serialize(() => {
    if (tasa !== undefined) {
      db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('tasa', ?)", [tasa]);
    }

    if (inventario) {
      db.run("DELETE FROM inventario");
      const stmt = db.prepare("INSERT INTO inventario (id, nombre, categoria, precio, stock) VALUES (?, ?, ?, ?, ?)");
      inventario.forEach(p => stmt.run(p.id, p.nombre, p.categoria, p.precio, p.stock));
      stmt.finalize();
    }

    if (cuentasHoy) {
      db.run("DELETE FROM cuentasHoy");
      const stmt = db.prepare("INSERT INTO cuentasHoy (id, nombre, pedido, montoTotalUSD, montoTotalBs, montoTotal, estado) VALUES (?, ?, ?, ?, ?, ?, ?)");
      cuentasHoy.forEach(c => stmt.run(c.id, c.nombre, JSON.stringify(c.pedido), c.montoTotalUSD, c.montoTotalBs, c.montoTotal, c.estado));
      stmt.finalize();
    }

    if (cuentasPendientes) {
      db.run("DELETE FROM cuentasPendientes");
      const stmt = db.prepare("INSERT INTO cuentasPendientes (id, deudor, concepto, monto) VALUES (?, ?, ?, ?)");
      cuentasPendientes.forEach(p => stmt.run(p.id, p.deudor, p.concepto, p.monto));
      stmt.finalize();
    }

    if (registroVentas) {
      db.run("DELETE FROM registroVentas");
      const stmt = db.prepare("INSERT INTO registroVentas (id, hora, nombre, pedido, montoTotal, monedaCobrada, montoReal) VALUES (?, ?, ?, ?, ?, ?, ?)");
      registroVentas.forEach(r => stmt.run(r.id, r.hora, r.nombre, r.pedido, r.montoTotal, r.monedaCobrada, r.montoReal));
      stmt.finalize();
    }

    if (usuarios) {
      db.run("DELETE FROM usuarios");
      const stmt = db.prepare("INSERT INTO usuarios (user, pass) VALUES (?, ?)");
      usuarios.forEach(u => stmt.run(u.user, u.pass));
      stmt.finalize();
    }

    if (cajaEntradas) {
      db.run("DELETE FROM cajaEntradas");
      const stmt = db.prepare("INSERT INTO cajaEntradas (id, dia, fecha, monto, montoUSD, montoBs) VALUES (?, ?, ?, ?, ?, ?)");
      cajaEntradas.forEach(c => stmt.run(c.id, c.dia, c.fecha, c.monto, c.montoUSD, c.montoBs));
      stmt.finalize();
    }

    res.json({ success: true });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
