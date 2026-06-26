# ShopEase 🛒

ShopEase is a modern, robust, and intelligent e-commerce platform built with an emphasis on seamless user experiences, security, and AI-driven customer support. Designed with a scalable micro-service-oriented architecture, ShopEase provides a comprehensive online shopping environment enhanced by state-of-the-art Generative AI.

---

## 🚀 Core Features

- **🛍️ Complete E-Commerce Flow**: Browse products, manage shopping carts, secure checkout, and real-time order tracking.
- **🤖 AI Shopping Assistant (Function Calling & RAG)**: ShopEase features an advanced, integrated AI chatbot. Utilizing **Function Calling**, the AI can dynamically query the product database in real-time. Utilizing **RAG (Retrieval-Augmented Generation)**, the AI uses a Vector Store to deeply understand shop policies, enabling it to provide accurate and highly contextual recommendations.
- **🔐 Secure Authentication**: Robust user authentication and authorization using Spring Security and stateless JWTs (Access & Refresh tokens).
- **📦 Third-Party Integrations**: Fully integrated with standard delivery services (GHN) and Cloudinary for optimized media storage.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Zustand, Axios
- **Backend**: Java 21, Spring Boot 3, Spring Security, Spring Data JPA
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: PostgreSQL / MySQL
- **Infrastructure & Build**: Docker, Docker Compose, Maven
- **Caching**: Redis
- **AI Integrations**: Google Gemini, Groq (LLaMA 3)

---

## 🏛️ Architecture Highlights

### AI Provider Strategy Pattern (Auto-Fallback)
To prevent vendor lock-in and ensure high availability, the AI Chat feature implements a robust **Strategy Pattern** with an **Auto-Fallback mechanism**. 

The system defines a unified `AiChatService` interface with multiple implementations (`GeminiChatServiceImpl`, `GroqChatServiceImpl`, and `MockChatServiceImpl`). 
- **High Availability**: The `AutoFallbackChatServiceImpl` is designated as the `@Primary` bean. When a user sends a message, it first attempts to process the request using the primary AI provider (Gemini).
- **Seamless Failover**: If Gemini hits a rate limit or goes down, the system dynamically catches the failure and immediately routes the request to Groq. If Groq also fails, it gracefully degrades to a local Mock service, ensuring the customer always receives a response without ever seeing a system crash.

### RAG (Retrieval-Augmented Generation) & Function Calling
- **Vector Store**: The system embeds shop policies and guidelines into a local vector store. When users ask specific policy questions, the system retrieves the most relevant context before sending it to the LLM.
- **Function Calling**: The LLM is equipped with tools to query the live relational database, allowing it to accurately suggest products, check stock, and format rich markdown responses containing real store links.

---

## ⚙️ Environment Variables

To run the project locally, you must configure the environment variables. A template is provided in `.env.example`. Create a `.env` file in the root directory and populate it with your credentials:

```env
# Database Credentials
MYSQL_PASSWORD=your_database_password
MYSQL_USERNAME=your_database_username
MYSQL_DATABASE=shop-db
MYSQL_PORT=3306
MYSQL_HOST=localhost

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets
JWT_ACCESS_KEY=your_jwt_access_secret_key_here
JWT_REFRESH_KEY=your_jwt_refresh_secret_key_here

# AI Provider API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Third-Party Services
GHN_TOKEN=your_ghn_api_token
GHN_SHOP_ID=your_ghn_shop_id
GHN_BASE_URL=https://online-gateway.ghn.vn/shiip/public-api
CLOUDINARY_LINK=cloudinary://key:secret@cloud_name
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_app_password
```

---

## 🏁 Getting Started

Follow these steps to set up and run the ShopEase project on your local machine:

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ShopEase.git
cd ShopEase
```

### 2. Configure Environment Variables
Copy the provided `.env.example` file to create your own `.env` file:
```bash
cp .env.example .env
```
Open the `.env` file and fill in your specific database, JWT, and AI API credentials.

### 3. Spin Up the Entire Application (Recommended)
We have configured Docker Compose to build and run the entire stack (Database, Redis, Backend, Frontend) seamlessly. Ensure Docker is installed and running, then execute:
```bash
docker-compose up --build -d
```
Once the containers are up and healthy, the application will be accessible at:
- **Frontend**: `http://localhost:80`
- **Backend API**: `http://localhost:8080`

### Alternative: Manual Setup for Development

If you prefer to run the services manually for development:

1. **Infrastructure**: Run `docker-compose up db redis -d` to start just the database and Redis.
2. **Backend**: Navigate to `backend` and run `mvn clean spring-boot:run`.
3. **Frontend**: Navigate to `frontend` and run `npm install` followed by `npm run dev` (Access at `http://localhost:5173`).
