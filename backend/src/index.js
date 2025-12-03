// src/index.js
import dotenv from 'dotenv';
import app from './app.js';
import { startSchedulers } from './jobs/scheduler.js';
dotenv.config(); // Load env vars from .env

app.get('/', (req, res) => {
  res.send('Backend API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

startSchedulers();

