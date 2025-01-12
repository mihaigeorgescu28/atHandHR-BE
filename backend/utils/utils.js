import multer from 'multer';
import path from 'path';
import express from 'express';
import fs from 'fs';
import authenticateToken from '../middleware/authenticateToken.js';
import { authorizeFileAccess } from '../middleware/authorizeFileAccess.js';

/* ----------------------------------
 ✅ Generate Random Key
----------------------------------- */
export function generateRandomKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    key += chars[randomIndex];
  }
  return key;
}

/* ✅ Ensure Directory Exists */
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`📁 Directory created: ${directory}`);
  }
}

/* ----------------------------------
 ✅ Sanitize ClientID or ClientName
----------------------------------- */
function sanitizeClientID(clientID) {
  return clientID.replace(/[^a-zA-Z0-9-_]/g, '_'); // Allow alphanumeric, dash, and underscore
}

/* ----------------------------------
 ✅ Define Storage Configuration for Profile Pictures
----------------------------------- */
const profilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const clientID = sanitizeClientID(req.body.ClientID || req.headers['clientid'] || 'default_client');
    const uploadPath = path.join('user_uploads', clientID, 'profile_pics');
    ensureDirectoryExists(uploadPath);
    console.log(`📂 Profile Picture Upload Path: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const originalName = path.basename(file.originalname, path.extname(file.originalname));
    const extension = path.extname(file.originalname);
    cb(null, `${originalName}_${Date.now()}${extension}`);
  }
});

/* ✅ Storage for Company Documents */
const companyDocStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const clientID = sanitizeClientID(
      req.body.ClientID || req.headers['clientid'] || 'default_client'
    );
    console.log('🔍 ClientID for upload:', clientID); // Debugging
    const uploadPath = path.join('user_uploads', clientID, 'company_documents');
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const originalName = path.basename(file.originalname, path.extname(file.originalname));
    const extension = path.extname(file.originalname);
    cb(null, `${originalName}_${Date.now()}${extension}`);
  },
});




/* ----------------------------------
 ✅ Define Storage Configuration for Generic Uploads
----------------------------------- */
const genericStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const clientID = sanitizeClientID(req.body.ClientID || req.headers['clientid'] || 'default_client');
    const uploadPath = path.join('user_uploads', clientID, 'generic_uploads');
    ensureDirectoryExists(uploadPath);
    console.log(`📂 Generic Upload Path: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const originalName = path.basename(file.originalname, path.extname(file.originalname));
    const extension = path.extname(file.originalname);
    cb(null, `generic_${originalName}_${Date.now()}${extension}`);
  }
});

/* ----------------------------------
 ✅ Multer Upload Instances
----------------------------------- */
export const uploadProfilePic = multer({ storage: profilePicStorage });
export const uploadCompanyDoc = multer({ storage: companyDocStorage });
export const uploadGeneric = multer({ storage: genericStorage });

/* ----------------------------------
 ✅ Static File Serving Setup
----------------------------------- */
export function setupStaticFileServer(app) {
  const uploadDir = path.join(process.cwd(), 'user_uploads');

  // Secure static file-serving
  app.use(
    '/user_uploads',
    authenticateToken, // Authenticate the user
    authorizeFileAccess, // Authorize access based on clientid
    express.static(uploadDir) // Serve files if both checks pass
  );

  console.log('✅ Secure static file server set up at: /user_uploads');
}

/* ----------------------------------
 ✅ Log File Details for Debugging
----------------------------------- */
export function logUploadedFileDetails(req) {
  if (req.file) {
    console.log(`📁 File Uploaded: ${req.file.originalname}`);
    console.log(`📂 Stored At: ${req.file.path}`);
  } else {
    console.warn('⚠️ No file uploaded.');
  }
}



