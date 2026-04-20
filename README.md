# NEXUS - AI Hiring Manager

## 🚀 Getting Started

### 🐳 Running with Docker (Recommended)
The easiest way to run the full stack (Frontend, Backend, and Database) is using Docker Compose.

1.  **Build and start the containers:**
    ```bash
    docker-compose up --build
    ```
2.  **Access the application:**
    *   **Frontend:** [http://localhost:5173](http://localhost:5173)
    *   **Backend API Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)

---

### 💻 Local Development (Manual)

#### 1. Start the Backend
```bash
# From the root directory
cd backend
# Activate virtual environment
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001
```

#### 2. Start the Frontend
```bash
# From the root directory
cd frontend
npm install
npm run dev
```