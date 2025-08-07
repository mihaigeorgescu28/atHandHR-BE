At Hand HR – Backend

![athandhrlogo](https://github.com/user-attachments/assets/93f92b3d-142d-4bc6-a181-8ad06c8fc724)


This is the backend codebase for At Hand HR, a lightweight HR management platform built for small remote teams. The backend is built with Node.js (Express) and connects to a MySQL database to handle authentication, API routes, and business logic.

🧰 Tech Stack
Node.js (Express)

MySQL

REST APIs

JSON Web Tokens (JWT)

Role-based access control

🚀 Key Features
Secure user authentication and session handling

RESTful API endpoints for employees, leave, documents, and time tracking

Role-based access for Admin, Manager, and Employee users

Input validation and error handling

CORS and request sanitisation

API structure ready for integration with a React frontend

📦 Setup
bash
Copy
Edit
git clone https://github.com/your-username/at-hand-hr-be.git
cd at-hand-hr-be
npm install
cp .env.example .env
# Add DB credentials to your .env file
npm start
🛡️ Security & Deployment
Database connection secured and restricted

Routes protected using JWT authentication

Deployed on a secured VPS alongside the frontend using Nginx
