import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

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

  let pool;
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Connected to MySQL pool (Configured via .env)');
    pool.getConnection().then(conn => {
      console.log('Successfully connected to MySQL database');
      conn.release();
    }).catch(err => {
      console.error('MySQL Connection Test Failed!', err.message);
    });
  } catch (err) {
    console.error('MySQL Pool Creation Error:', err);
  }

  app.use(express.json());
  app.use(cors());
  app.set('trust proxy', 1);

  // เพิ่ม Log เพื่อดู Request ที่เข้ามา
  app.use((req, res, next) => {
    // ตัด /server.cjs ออกจาก URL ถ้ามี (เพื่อรองรับการเรียกตรงบน IIS)
    if (req.url.startsWith('/server.cjs')) {
      req.url = req.url.replace('/server.cjs', '');
      if (req.url === '') req.url = '/';
    }
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
  
  app.use(session({
    secret: 'edugen-secret-key-123',
    resave: true,
    saveUninitialized: true,
    cookie: { 
      secure: false, // เปลี่ยนเป็น true ถ้าใช้ https และมีปัญหา
      maxAge: 24 * 60 * 60 * 1000 
    }
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
    } catch (error) {
      console.error('Registration Error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.code === 'ER_DUP_ENTRY' ? 'หมายเลขประจำตัวประชาชนนี้ได้สมัครเข้ามาในระบบแล้ว' : `เกิดข้อผิดพลาดในการลงทะเบียน: ${error.message}` 
      });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { citizen_id, password } = req.body;
    console.log(`Login attempt for: ${citizen_id}`);
    
    if (!citizen_id || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (citizen_id === 'admin' && password === 'admin123') {
      req.session.user = { id: 0, role: 'admin', name: 'System Admin' };
      return res.json({ success: true, user: req.session.user });
    }
    
    try {
      console.log('Querying database for user...');
      const [rows] = await pool.execute('SELECT * FROM teachers WHERE citizen_id = ?', [citizen_id]);
      const user = rows[0];
      
      if (user) {
        console.log('User found, comparing password...');
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          if (user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'บัญชีของคุณกำลังรอการตรวจสอบจากผู้ดูแลระบบ' });
          }
          req.session.user = { 
            id: user.id, 
            role: user.role || 'teacher', 
            name: user.name, 
            surname: user.surname,
            ai_key: user.ai_key, 
            school: user.school,
            position: user.position
          };
          console.log('Login successful');
          res.json({ success: true, user: req.session.user });
        } else {
          console.log('Password mismatch');
          res.status(401).json({ success: false, message: 'เลขประจำตัวหรือรหัสผ่านไม่ถูกต้อง' });
        }
      } else {
        console.log('User not found');
        res.status(401).json({ success: false, message: 'เลขประจำตัวหรือรหัสผ่านไม่ถูกต้อง' });
      }
    } catch (error) {
      console.error('Login Database Error:', error);
      res.status(500).json({ success: false, message: `Database error: ${error.message}` });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.session?.user) {
      res.json({ success: true, user: req.session.user });
    } else {
      res.status(401).json({ success: false });
    }
  });

  app.get('/debug/files', async (req, res) => {
    try {
      const distPath = path.resolve(__dirname, 'dist');
      const files = await fs.readdir(distPath);
      res.json({ distPath, files });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Admin Routes
  app.get('/api/admin/teachers', async (req, res) => {
    if (req.session?.user?.role !== 'admin') return res.status(403).send();
    try {
      const [rows] = await pool.execute('SELECT id, citizen_id, name, surname, school, position, status, role FROM teachers');
      res.json(rows);
    } catch (error) { res.status(500).send(); }
  });

  app.post('/api/admin/change-role', async (req, res) => {
    if (req.session?.user?.role !== 'admin') return res.status(403).send();
    const { id, role } = req.body;
    try {
      await pool.execute('UPDATE teachers SET role = ? WHERE id = ?', [role, id]);
      res.json({ success: true });
    } catch (error) { res.status(500).send(); }
  });

  app.post('/api/admin/approve', async (req, res) => {
    if (req.session?.user?.role !== 'admin') return res.status(403).send();
    const { id, status } = req.body;
    try {
      await pool.execute('UPDATE teachers SET status = ? WHERE id = ?', [status, id]);
      res.json({ success: true });
    } catch (error) { res.status(500).send(); }
  });

  app.post('/api/admin/delete-teacher', async (req, res) => {
    if (req.session?.user?.role !== 'admin') return res.status(403).send();
    const { id } = req.body;
    try {
      await pool.execute('DELETE FROM teachers WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) { res.status(500).send(); }
  });

  app.post('/api/admin/db-sync', async (req, res) => {
    if (req.session?.user?.role !== 'admin') return res.status(403).send();
    try {
      // Idempotent table creation
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS teachers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          citizen_id VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          surname VARCHAR(100) NOT NULL,
          school VARCHAR(200),
          position VARCHAR(100),
          password VARCHAR(255) NOT NULL,
          ai_key VARCHAR(255),
          role ENUM('teacher', 'admin') DEFAULT 'teacher',
          status ENUM('pending', 'active', 'rejected') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migrating existing table to add role column if missing
      try {
        await pool.execute('ALTER TABLE teachers ADD COLUMN role ENUM(\'teacher\', \'admin\') DEFAULT \'teacher\'');
      } catch (e) {
        // Column might already exist
      }

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS exercises (
          id INT AUTO_INCREMENT PRIMARY KEY,
          teacher_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          course VARCHAR(100),
          grade VARCHAR(50),
          indicators TEXT,
          content LONGTEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        )
      `);

      // Add columns if they don't exist (using a simple check)
      // This is a basic way to ensure schema evolution
      res.json({ success: true, message: 'ฐานข้อมูลได้รับการปรับปรุงเรียบร้อยแล้ว' });
    } catch (error) { 
      console.error('DB Sync Error:', error);
      res.status(500).json({ success: false, message: error.message }); 
    }
  });

  // Exercise Routes
  app.get('/api/exercises', async (req, res) => {
    const user = req.session?.user;
    if (!user) return res.status(401).send();
    try {
      const [rows] = await pool.execute('SELECT * FROM exercises WHERE teacher_id = ? ORDER BY created_at DESC', [user.id]);
      res.json(rows);
    } catch (error) { res.status(500).send(); }
  });

  app.post('/api/exercises', async (req, res) => {
    const user = req.session?.user;
    if (!user) return res.status(401).send();
    const { title, course, grade, indicators, content } = req.body;
    try {
      await pool.execute(
        'INSERT INTO exercises (teacher_id, title, course, grade, indicators, content) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, title, course, grade, indicators, JSON.stringify(content)]
      );
      res.json({ success: true });
    } catch (error) { res.status(500).send(); }
  });

  app.put('/api/exercises/:id', async (req, res) => {
    const user = req.session?.user;
    if (!user) return res.status(401).send();
    const { id } = req.params;
    const { title, course, grade, content } = req.body;
    try {
      await pool.execute(
        'UPDATE exercises SET title = ?, course = ?, grade = ?, content = ? WHERE id = ? AND teacher_id = ?',
        [title, course, grade, JSON.stringify(content), id, user.id]
      );
      res.json({ success: true });
    } catch (error) { res.status(500).send(); }
  });

  app.delete('/api/exercises/:id', async (req, res) => {
    const user = req.session?.user;
    if (!user) return res.status(401).send();
    const { id } = req.params;
    try {
      await pool.execute('DELETE FROM exercises WHERE id = ? AND teacher_id = ?', [id, user.id]);
      res.json({ success: true });
    } catch (error) { res.status(500).send(); }
  });

  app.post('/api/profile/key', async (req, res) => {
    const user = req.session?.user;
    if (!user) return res.status(401).send();
    const { ai_key } = req.body;
    try {
      await pool.execute('UPDATE teachers SET ai_key = ? WHERE id = ?', [ai_key, user.id]);
      req.session.user.ai_key = ai_key;
      req.session.save(() => {
        res.json({ success: true });
      });
    } catch (error) { 
      console.error('Update key error:', error);
      res.status(500).send(); 
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // ใช้ process.cwd() เพื่อให้มั่นใจเรื่องตำแหน่งใน Windows และ IIS
    const rootPath = process.cwd();
    const distPath = path.join(rootPath, 'dist');
    
    console.log('Root directory:', rootPath);
    console.log('Serving static files from:', distPath);
    
    // ตั้งค่าให้ Express ส่งไฟล์ Static โดยตรง
    app.use(express.static(distPath));
    
    // สำหรับ SPA: ถ้าหาไฟล์ไม่เจอ ให้ส่ง index.html กลับไป
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // On Windows IIS/iisnode, we listen to process.env.PORT directly
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started`);
  });
}

startServer();
