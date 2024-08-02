import mysql from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'C:/Users/mihai/source/repos/atHandHR-backend/backend/.env' });


let db;

function handleDisconnect() {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      setTimeout(handleDisconnect, 2000); // Try again after 2 seconds
    } else {
      console.log('Connected to the database.');
    }
  });

  db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

export default db;
