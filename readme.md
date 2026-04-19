# Factory Tracking Web Application

## 📦 Overview

This project is a **factory work tracking system** designed to manage and monitor container-based workflows.

It currently supports two container types:

* **Neck Trucks (NT000–NT999)** → 28 slots
* **Body Trucks (BT000–BT999)** → 14 slots

Each slot can store a **single part number**, and all changes are tracked for traceability.

---

## 🚀 Startup Procedure

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/factory-tracking.git
cd factory-tracking
```

---

### 2. Start PostgreSQL

#### Option A — Local Postgres

Make sure Postgres is running:

```bash
sudo systemctl start postgresql
```

Create the database:

```bash
createdb -U postgres factory_tracking
```

---

#### Option B — Docker (recommended)

```bash
docker-compose up -d
```

---

### 3. Backend Setup (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Ensure `.env` contains:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/factory_tracking
```

Start backend:

```bash
uvicorn app.main:app --reload --port 8003
```

API will be available at:

```
http://127.0.0.1:8003
```

Swagger docs:

```
http://127.0.0.1:8003/docs
```

---

### 4. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://127.0.0.1:5173
```

---

## 🧪 Current Usage

### Create a container

* Go to **Containers page**
* Enter:

  * `NT001` → creates neck truck (28 slots)
  * `BT001` → creates body truck (14 slots)

---

### Manage slots

* Click a container
* Click any slot
* Enter a part number to assign
* Leave blank to clear

---

### Example

* Slot 1 → `PART-10023`
* Slot 2 → `BODY-7781`

---

### View history

Each slot change logs:

* old value
* new value
* operator
* timestamp

---

### Dashboard

Displays:

* total neck trucks
* total body trucks
* occupied slots
* empty slots

---

## 🧠 Current Architecture

### Backend

* FastAPI
* SQLAlchemy
* PostgreSQL

### Frontend

* React (Vite)
* React Router

### Database Tables

* `containers`
* `container_slots`
* `slot_history`

---

## ⚙️ Development Workflow

```bash
git checkout dev
# make changes
git add .
git commit -m "your message"
git push
```

---

## 🔮 Future Improvements

### 🔧 Core Features

* Replace `prompt()` with proper modal UI
* Add barcode scanner input for part numbers
* Bulk slot assignment (scan + fill)
* Add container status:

  * empty
  * in progress
  * complete
  * maintenance

---

### 👥 User System

* Operator login
* Track user per action
* Role-based permissions (admin/operator)

---

### 📍 Factory Tracking

* Track physical location of each truck
* Add workstations / zones
* Movement history

---

### 📊 Reporting

* Daily production reports
* Slot utilization metrics
* Export to CSV / Excel

---

### 🧩 Data Enhancements

* Master parts table
* Validate part numbers
* Add quantity support per slot (optional)

---

### ⚡ Performance / Scale

* Pagination for containers
* Caching dashboard stats
* Background jobs for heavy operations

---

### 🐳 DevOps

* Full Docker setup (backend + frontend + db)
* CI/CD pipeline
* Environment configs (dev/staging/prod)

---

## 📌 Notes

* Container type is inferred from code (`NT` vs `BT`)
* Slots are automatically created on container creation
* History tracking is always enabled

---

## 🧱 Next Milestone

* Seed script to auto-generate test data
* Improved UI/UX for slot interaction
* Real-world workflow integration (scan-based input)

---

## 👷 Author

Built for factory workflow tracking and optimization.
