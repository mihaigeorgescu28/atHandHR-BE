import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';  // Import cookie-parser
import dotenv from 'dotenv';
import emailController from "./controllers/emailController.js";
import userController from "./controllers/userController.js";
import timeManagementController from "./controllers/timeManagementController.js";
import leaveController from "./controllers/leaveController.js";
import siteMapController from "./controllers/siteMapController.js";
import { setupStaticFileServer } from './utils/utils.js';

// Initialize dotenv to load environment variables from .env file
dotenv.config();

// Create an instance of Express application
const app = express();

// Middleware to parse JSON
app.use(express.json());

// CORS configuration to allow credentials and specific origin
app.use(cors({
    origin: 'http://app.localhost:3000',  // Set this to the exact frontend origin
    credentials: true,  // Allow credentials (cookies) to be included in requests
  }));

  // Middleware to parse cookies
app.use(cookieParser());  // Add this line
  
// Set up secure static file server
setupStaticFileServer(app);

// Define routes
app.use('/emails', emailController);
app.use('/user', userController);
app.use('/timeManagement', timeManagementController);
app.use('/leave', leaveController);
app.use('/sitemap', siteMapController);


// Start the server
app.listen(8800, () => {
    console.log("Connected to backend");
});
