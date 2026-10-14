import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Inisialisasi Klien Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Error: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diatur di file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

// Multer Storage (Memory Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limit 10MB
});

// Helper Function Upload ke Supabase Storage
async function uploadToSupabaseBucket(file, folderName) {
  const fileName = `${folderName}/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw new Error(`Upload Storage Gagal: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// -------------------------------------------------------------
// 1. ENDPOINT DOKUMENTASI KEGIATAN
// -------------------------------------------------------------
app.post('/api/kegiatan', upload.single('image'), async (req, res) => {
  try {
    const { hari, tanggal, jam } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File gambar wajib diunggah!' });
    }

    const publicUrl = await uploadToSupabaseBucket(req.file, 'kegiatan');

    const { data, error } = await supabase
      .from('dokumentasi_kegiatan')
      .insert([{ file_path: publicUrl, hari, tanggal, jam }])
      .select();

    if (error) throw new Error(`Insert DB Gagal: ${error.message}`);

    res.json({ success: true, data: data[0], filePath: publicUrl });
  } catch (err) {
    console.error('Error POST /api/kegiatan:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/kegiatan', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dokumentasi_kegiatan')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error GET /api/kegiatan:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 2. ENDPOINT FOTO BON
// -------------------------------------------------------------
app.post('/api/bon', upload.single('image'), async (req, res) => {
  try {
    const { jenisPembelian, hargaPembelian, hari, tanggal, jam } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File gambar bon wajib diunggah!' });
    }

    const publicUrl = await uploadToSupabaseBucket(req.file, 'bon');

    const { data, error } = await supabase
      .from('foto_bon')
      .insert([
        {
          file_path: publicUrl,
          jenis_pembelian: jenisPembelian,
          harga_pembelian: parseFloat(hargaPembelian) || 0,
          hari,
          tanggal,
          jam
        }
      ])
      .select();

    if (error) throw new Error(`Insert DB Gagal: ${error.message}`);

    res.json({ success: true, data: data[0], filePath: publicUrl });
  } catch (err) {
    console.error('Error POST /api/bon:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/bon', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('foto_bon')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error GET /api/bon:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Backend Supabase berjalan di http://localhost:${PORT}`);
});