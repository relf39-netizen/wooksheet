import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import session from 'express-session';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database setup (MySQL)
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edugen_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  let pool: mysql.Pool;
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Connected to MySQL pool (Configured via .env)');
    // Test connection
    pool.getConnection().then(conn => {
      console.log('Successfully connected to MySQL database');
      conn.release();
    }).catch(err => {
      console.error('MySQL Connection Test Failed! Please check your .env settings or MySQL server status:', err.message);
    });
  } catch (err) {
    console.error('MySQL Pool Creation Error:', err);
  }

  app.use(express.json());
  app.use(cors());
  app.use(session({
    secret: 'edugen-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { citizen_id, name, surname, school, position, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.execute(
        'INSERT INTO teachers (citizen_id, name, surname, school, position, password, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [citizen_id, name, surname, school, position, hashedPassword, 'pending']
      );
      res.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ กรุณารอการอนุมัติจากผู้ดูแลระบบ' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.code === 'ER_DUP_ENTRY' ? 'เลขประจำตัวประชาชนนี้ถูกใช้งานแล้ว' : 'เกิดข้อผิดพลาดในการลงทะเบียน' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { citizen_id, password } = req.body;
    
    // Admin login special case
    if (citizen_id === 'admin' && password === 'admin123') {
      (req as any).session.user = { id: 0, role: 'admin', name: 'System Admin' };
      return res.json({ success: true, user: (req as any).session.user });
    }

    try {
      const [rows]: any = await pool.execute('SELECT * FROM teachers WHERE citizen_id = ?', [citizen_id]);
      const user = rows[0];

      if (user && await bcrypt.compare(password, user.password)) {
        if (user.status !== 'active') {
          return res.status(403).json({ success: false, message: 'บัญชีของคุณกำลังรอการตรวจสอบจากผู้ดูแลระบบ' });
        }
        (req as any).session.user = { id: user.id, role: 'teacher', name: user.name, ai_key: user.ai_key };
        res.json({ success: true, user: (req as any).session.user });
      } else {
        res.status(401).json({ success: false, message: 'เลขประจำตัวหรือรหัสผ่านไม่ถูกต้อง' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    if ((req as any).session?.user) {
      res.json({ success: true, user: (req as any).session.user });
    } else {
      res.status(401).json({ success: false });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    (req as any).session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Admin Routes
  app.get('/api/admin/teachers', async (req, res) => {
    if ((req as any).session?.user?.role !== 'admin') return res.status(403).send();
    try {
      const [rows] = await pool.execute('SELECT id, citizen_id, name, surname, school, position, status FROM teachers');
      res.json(rows);
    } catch (error) {
      res.status(500).send();
    }
  });

  app.post('/api/admin/approve', async (req, res) => {
    if ((req as any).session?.user?.role !== 'admin') return res.status(403).send();
    const { id, status } = req.body;
    try {
      await pool.execute('UPDATE teachers SET status = ? WHERE id = ?', [status, id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).send();
    }
  });

  // Exercise Routes
  app.get('/api/exercises', async (req, res) => {
    const user = (req as any).session?.user;
    if (!user) return res.status(401).send();
    try {
      const [rows] = await pool.execute('SELECT * FROM exercises WHERE teacher_id = ? ORDER BY created_at DESC', [user.id]);
      res.json(rows);
    } catch (error) {
      res.status(500).send();
    }
  });

  app.post('/api/exercises', async (req, res) => {
    const user = (req as any).session?.user;
    if (!user) return res.status(401).send();
    const { title, course, grade, indicators, content } = req.body;
    try {
      await pool.execute(
        'INSERT INTO exercises (teacher_id, title, course, grade, indicators, content) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, title, course, grade, indicators, JSON.stringify(content)]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).send();
    }
  });

  app.put('/api/profile/key', async (req, res) => {
    const user = (req as any).session?.user;
    if (!user) return res.status(401).send();
    const { ai_key } = req.body;
    try {
      await pool.execute('UPDATE teachers SET ai_key = ? WHERE id = ?', [ai_key, user.id]);
      (req as any).session.user.ai_key = ai_key;
      res.json({ success: true });
    } catch (error) {
      res.status(500).send();
    }
  });

  // Vite setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
