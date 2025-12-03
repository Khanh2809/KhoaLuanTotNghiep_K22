import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

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

app.use(cookieParser());
app.use(express.json());

// ✅ CORS cho cookie – KHÔNG dùng '*'
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};
app.use(cors(corsOptions));           // đủ cho preflight, không cần app.options('*', ...)

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
