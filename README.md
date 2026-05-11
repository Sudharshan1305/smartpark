# 🚗 SmartPark – Cloud-Based Parking Management System
CLOUD COMPUTING
## 📌 Project Overview

SmartPark is a full-stack web application designed to manage parking slots, bookings, and user authentication efficiently.
The system provides real-time slot availability, booking management, and analytics for administrators.

---

## 🏗️ Architecture

* **Frontend**: React.js
* **Backend**: Node.js + Express.js
* **Database**: MongoDB Atlas
* **Deployment**: Azure App Service
* **CI/CD**: GitHub Actions
* **Containerization**: Docker (Single Container Architecture)

---

## ⚙️ Features

### 👤 Authentication

* User Registration
* User Login (JWT-based authentication)

### 🅿️ Parking Management

* View available slots
* Slot recommendations
* Add/Delete slots (Admin)

### 📅 Booking System

* Create booking
* Cancel booking
* View booking history
* Generate receipt

### 📊 Admin Features

* View all bookings
* Analytics dashboard

---

## 🌐 Live Application

🔗 **Azure Deployment URL**
https://your-app-name.azurewebsites.net

---

## 🚀 CI/CD Pipeline (GitHub Actions)

This project uses GitHub Actions for Continuous Integration and Deployment.

### Pipeline Flow:

1. Code pushed to GitHub (main branch)
2. GitHub Actions workflow is triggered
3. Application is built
4. Automatically deployed to Azure App Service

---

## 🐳 Docker Setup (Local Development)

### Build Docker Image

```bash
docker build -t smartpark-app .
```

### Run Container

```bash
docker run -d \
  --name smartpark-container \
  -p 5000:5000 \
  --env-file .env.docker \
  smartpark-app
```

### Access Application

http://localhost:5000

---

## 📁 Folder Structure

```
smartpark/
│
├── client/                # React frontend
│   ├── build/
│   ├── src/
│   └── public/
│
├── server/                # Backend (Node.js + Express)
│   ├── client/build/      # React build served by backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── .github/workflows/     # CI/CD pipeline
└── README.md
```

---

## 🔧 Environment Variables

### Backend (.env / .env.docker)

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
PORT=5000
```

---

## 🧠 Key Design Decision

* Used **single container architecture**
* React frontend is served via Express backend
* Eliminates CORS issues
* Simplifies deployment and scaling

---

## 📈 Future Enhancements

* Kubernetes (AKS) deployment
* Azure Container Registry (ACR)
* Terraform for infrastructure automation
* Monitoring with Prometheus

---

## 👨‍💻 Author

**Sudharshan Krishnaa**
Computer Science & Engineering

---

## ✅ Status

✔ Full-stack application developed
✔ Deployed on Azure
✔ CI/CD implemented using GitHub Actions
✔ Docker containerization completed

---
