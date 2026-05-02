import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import teacherRoutes from './routes/teacher.routes';
import studentRoutes from './routes/student.routes';
import parentRoutes from './routes/parent.routes';
import educatorRoutes from './routes/educator.routes';
import uploadRoutes from './routes/upload.routes';
import nfcRoutes from './routes/nfc.routes';
import admissionPublicRoutes from './routes/admission.public.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS - origines locales + preview / prod Vercel si présentes
const frontendOrigins = (() => {
  const fromEnv = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (process.env.VERCEL_URL) {
    fromEnv.push(`https://${process.env.VERCEL_URL}`);
  }
  return fromEnv;
})();

app.use(cors({
  origin: frontendOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware pour logger les requêtes (en développement)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/educator', educatorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/nfc', nfcRoutes);
app.use('/api/public/admissions', admissionPublicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'School Manager API is running' });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
