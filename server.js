const { Sequelize, DataTypes, Op } = require('sequelize');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 1. Inisialisasi Sequelize (Membaca Environment Variables dari Cloud Run)
const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    port: 3306
  }
);

// 2. Definisi Model Booking
const Booking = sequelize.define('Booking', {
  client_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vendor_package: {
    type: DataTypes.STRING,
    allowNull: false
  },
  event_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  total_payment: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('Pending', 'Down Payment', 'Lunas'),
    defaultValue: 'Pending'
  }
}, {
  tableName: 'bookings',
  timestamps: false
});

// Tes Koneksi dan Sinkronisasi Model
sequelize.authenticate()
  .then(() => console.log('Sukses terhubung ke MariaDB.'))
  .catch(err => console.error('Gagal terhubung ke database:', err));

// 3. Endpoint /health
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'UP', database: 'CONNECTED' });
  } catch (error) {
    res.status(500).json({ status: 'DOWN', error: error.message });
  }
});

// 4. Endpoint /schema (Penting untuk Automasi Form & Tabel Frontend)
app.get('/schema', (req, res) => {
  res.json({
    student: {
      name: "Giva Gusliana",
      nim: "2311523022"
    },
    activeResource: "bookings",
    schema: {
      id: "int",
      client_name: "string",
      vendor_package: "string",
      event_date: "date",
      total_payment: "number",
      payment_status: "string"
    },
    fields: [
      { name: "client_name", label: "Nama Klien", type: "text", required: true },
      { name: "vendor_package", label: "Paket Vendor", type: "text", required: true },
      { name: "event_date", label: "Jadwal Acara", type: "date", required: true },
      { name: "total_payment", label: "Total Pembayaran (Rp)", type: "number", required: true },
      { name: "payment_status", label: "Status Pembayaran", type: "text", required: true }
    ]
  });
});

// 5. Endpoint CRUD Operasi Data
// GET (Read & Search)
app.get('/bookings', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const startTime = Date.now();
    
    // Logika Pencarian berdasarkan nama klien
    const queryOptions = {
      limit,
      offset,
      where: search ? { client_name: { [Op.like]: `%${search}%` } } : {}
    };

    const { count, rows } = await Booking.findAndCountAll(queryOptions);
    const responseTime = Date.now() - startTime;

    res.json({
      data: rows,
      total: count,
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST (Create)
app.post('/bookings', async (req, res) => {
  try {
    const newBooking = await Booking.create(req.body);
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (Update)
app.put('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Data tidak ditemukan' });
    await booking.update(req.body);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE (Delete)
app.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Data tidak ditemukan' });
    await booking.destroy();
    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Jalankan Server di Port Container Cloud Run
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Wedding Organizer aktif di port ${PORT}`);
});