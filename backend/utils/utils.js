// utils.js
import multer from 'multer';
import path from 'path';
import express from 'express';

export function generateRandomKey(length) {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < length; i++) {
    let randomIndex = Math.floor(Math.random() * chars.length);
    key += chars[randomIndex];
  }
  return key;
}

// Define storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "user_uploads/profile_pic"); // Specify the directory where files will be stored
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + extension);
  },
});

export const upload = multer({ storage: storage });

export function setupStaticFileServer(app) {
  const staticDirectory = path.join(process.cwd(), 'user_uploads', 'profile_pic');
  app.use('/user_uploads/profile_pic', express.static(staticDirectory, {
    setHeaders: (res, path) => {
      res.setHeader('Content-Security-Policy', "default-src 'self'");
      // Other security headers...
    },
  }));
}

