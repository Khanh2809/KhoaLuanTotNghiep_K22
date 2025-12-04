import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import lessonsRoutes from './routes/lessons.routes.js';
import enrollmentsRoutes from './routes/enrollments.routes.js';
import progressRoutes from './routes/progress.routes.js';
import instructorRoutes from './routes/instructor.courses.routes.js';
import instructorLessonsRoutes from './routes/instructor.lessons.routes.js';
import chatRoutes from './routes/chat.routes.js';
import quizRoutes from './routes/quiz.routes.js';

import adminRoutes from './routes/admin.routes.js'; // Import admin routes

import activityRoutes from './routes/activity.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import searchRoutes from './routes/search.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import roleRequestRoutes from './routes/role-requests.routes.js';
import learningPathRoutes from './routes/learning-path.routes.js';
import certificatesRoutes from './routes/certificates.routes.js';
const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';
const EXTRA_ORIGINS = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    FRONTEND_ORIGIN,
    ...EXTRA_ORIGINS,
    'http://localhost:3000', // dev local
  ])
);
// Cho phép domain Vercel (preview/production) dạng *.vercel.app
const allowedOriginPatterns = [/\.vercel\.app$/];

app.use(cookieParser());
// Tăng limit cho payload JSON/form để tránh lỗi PayloadTooLarge khi gửi nội dung lớn
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static uploads (demo): /images/<file> -> backend/public/images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.join(__dirname, '../public/images')));

const corsOptions = {
  origin(origin, callback) {
    // Cho phAcp request khA'ng cA3 Origin (Postman, curl, ...)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOriginPatterns.some((re) => re.test(origin))) {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
         // О`ап cho preflight, khA'ng cазn app.options('*', ...)

app.get('/', (_, res) => res.send('Backend API is running'));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);

// ...
app.use('/api/progress', progressRoutes);

app.use('/api/instructor', instructorRoutes);

app.use('/api/instructor/lessons', instructorLessonsRoutes);

app.use('/api/chat', chatRoutes);

app.use('/api/admin', adminRoutes); // Mount admin routes

app.use('/api', quizRoutes); // -> /api/quizzes...

app.use('/api/logs', activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/role-requests', roleRequestRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/certificates', certificatesRoutes);

export default app;
