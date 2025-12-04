import multer from 'multer';
import path from 'path';

// Lưu file vào backend/public/images, giữ nguyên tên file (demo)
const storage = multer.diskStorage({
  // Giả định chạy từ thư mục backend; nếu chạy từ root, vẫn trỏ đúng tới backend/public/images
  destination: path.join(process.cwd(), 'public', 'images'),
  filename: (_req, file, cb) => cb(null, file.originalname),
});

export const uploadImage = multer({ storage });
