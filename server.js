const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Konfigurasi Koneksi Database MariaDB
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
});

// 3. Definisi Model/Tabel Songs
const Song = sequelize.define('Song', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  artist: { type: DataTypes.STRING, allowNull: false },
  album: { type: DataTypes.STRING, allowNull: true },
  genre: { type: DataTypes.STRING, allowNull: true },
  duration_seconds: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'songs',
  timestamps: false
});

// Sync database agar tabel sinkron otomatis dengan backend
sequelize.sync()
  .then(() => console.log('Database & tables synced!'))
  .catch(err => console.error('Error syncing database:', err));

// =========================================================================
// ENDPOINT WAJIB (Sesuai Instruksi Tugas Besar)
// =========================================================================

// GET /health - Mengecek status backend dan database
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate(); // Cek koneksi ke DB
    res.json({
      status: "success",
      message: "Backend is running",
      database: "connected",
      student: {
        name: "Giva Gusliana",
        nim: "2311523022"
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Backend is running, but database is not connected",
      database: "disconnected",
      student: {
        name: "Giva Gusliana",
        nim: "2311523022"
      }
    });
  }
});

// GET /schema - Untuk dibaca otomatis oleh Frontend asisten
app.get('/schema', (req, res) => {
  res.json({
    student: { name: "Giva Gusliana", nim: "2311523022" },
    resource: {
      name: "songs",
      label: "Data Lagu",
      description: "Aplikasi untuk mengelola daftar lagu favorit"
    },
    fields: [
      { name: "title", label: "Judul Lagu", type: "text", required: true, showInTable: true, searchable: true },
      { name: "artist", label: "Penyanyi / Musisi", type: "text", required: true, showInTable: true, searchable: true },
      { name: "album", label: "Album", type: "text", required: false, showInTable: true, searchable: true },
      { name: "genre", label: "Genre", type: "text", required: false, showInTable: true, searchable: true },
      { name: "duration_seconds", label: "Durasi (Detik)", type: "number", required: true, showInTable: true }
    ],
    endpoints: {
      list: "/songs",
      detail: "/songs/{id}",
      create: "/songs",
      update: "/songs/{id}",
      delete: "/songs/{id}"
    }
  });
});

// GET /songs - Mengambil data lagu dan mendukung pencarian segala parameter (query, search, title, dll)
app.get('/songs', async (req, res) => {
  try {
    // Menangkap segala kemungkinan parameter pencarian dari frontend penguji
    const searchKeyword = req.query.search || req.query.q || req.query.query || req.query.title || req.query.artist || '';
    
    let options = {};
    
    if (searchKeyword) {
      options.where = {
        [Op.or]: [
          { title: { [Op.like]: `%${searchKeyword}%` } },
          { artist: { [Op.like]: `%${searchKeyword}%` } },
          { album: { [Op.like]: `%${searchKeyword}%` } },
          { genre: { [Op.like]: `%${searchKeyword}%` } }
        ]
      };
    }

    const data = await Song.findAll(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /songs/:id - Mengambil detail satu lagu berdasarkan ID
app.get('/songs/:id', async (req, res) => {
  try {
    const data = await Song.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /songs - Menambahkan lagu baru ke database
app.post('/songs', async (req, res) => {
  try {
    const newData = await Song.create(req.body);
    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// PUT /songs/:id - Mengubah data lagu berdasarkan ID
app.put('/songs/:id', async (req, res) => {
  try {
    const data = await Song.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    
    await data.update(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE /songs/:id - Menghapus lagu dari database
app.delete('/songs/:id', async (req, res) => {
  try {
    const data = await Song.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    
    await data.destroy();
    res.json({ success: true, message: "Data deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Root Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "API songs running successfully",
    student: {
      name: "Giva Gusliana",
      nim: "2311523022"
    }
  });
});

// Menjalankan Server
app.listen(PORT, () => {
  console.log(`Server backend berjalan di http://localhost:${PORT}`);
});