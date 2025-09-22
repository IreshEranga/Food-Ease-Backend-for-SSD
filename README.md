# Tastigo - Online Food Ordering and Delivery App (Backend)

TastiGo is a scalable and modular restaurant management and food ordering platform built using a Microservices Architecture. This backend repository provides RESTful APIs for managing restaurant data, menu items, user authentication, shopping cart operations, order processing, and administrative functions.

Each core business capability—such as user management, restaurant service, payment processing, and order tracking—is implemented as an independent microservice to promote loose coupling, high scalability, and easy maintenance.

The entire backend system is containerized using Docker, enabling seamless deployment across environments. For orchestration and service discovery, Kubernetes is employed to manage service replicas, ensure high availability, and support horizontal scaling.

## 🚀 Features

- User Authentication with JWT (Admin and Customer roles)
- Restaurant registration with license file upload
- Menu management per restaurant (categories, items, prices)
- Cart and order management
- Search and filtering
- Admin and Customer dashboards
- Cloudinary integration for file uploads
- MongoDB (via Mongoose) as the database

## 🛠️ Technologies

- Node.js
- Express.js
- MongoDB & Mongoose
- Cloudinary (for license uploads)
- JWT for Authentication
- Multer for file handling
- Dotenv for environment management
- CORS & Helmet for security

## 📦 Installation

1. **Clone the repository:**

```bash
git clone https://my_projects_iresh-admin@bitbucket.org/my_projects_iresh/food-ease-backend.git
cd tastigo-backend
```
2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**
 Create a .env files in each service and add the following:
 ```
 PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🐳 Running with Docker
To run all services in containers:

1. **Build and run with Docker Compose**

```docker-compose up --build```

2. **Stop containers**

```docker-compose down```

Ensure you have Docker and Docker Compose installed before running.

## 🔌 API Usage

**Base URL**

``` http://localhost:5000/api/ ```

**Services Endpoints**

## 👨‍💻 Developed By



