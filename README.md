# LocData API - Indian Location Data API Dash

LocData API is a production-ready, full-stack SaaS platform designed to provide structured and high-performance access to Indian location data (States, Districts, Sub-districts, and Villages). It includes a robust backend API, a data ingestion pipeline for Excel datasets, and a premium administrative dashboard for usage tracking and API key management.

## 🚀 Features

- **Hierarchical Data Access**: Deeply nested location data (State > District > Sub-District > Village).
- **Admin Dashboard**: Real-time analytics, API call volume tracking, and system status monitoring.
- **API Key Management**: Secure generation and monitoring of client-side credentials.
- **Data Ingestion**: Optimized scripts to process large-scale Excel datasets into a relational SQLite database.
- **Rate Limiting & Security**: Built-in protection against API abuse.
- **Premium UI**: Modern, responsive dashboard with glassmorphism aesthetics and interactive charts.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Prisma ORM
- **Database**: SQLite
- **Frontend**: React, Vite, Recharts (Analytics), Lucide React (Icons)
- **Styling**: Vanilla CSS (Modern Design System)
- **Data Processing**: SheetJS (XLSX)

## 📦 Project Structure

```text
├── backend/          # Express server, Prisma schema, and Seeding scripts
├── frontend/         # React dashboard and Demo Client
├── data_processing/  # Python/JS scripts for data exploration
├── start_backend.bat # Windows shortcut to start API
└── start_frontend.bat# Windows shortcut to start Dashboard
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
node seed.js  # This populates the database from the Excel datasets
node server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

## 📖 API Usage

To access the data, include your API key in the request header:

`x-api-key: your_generated_pk_key`

### Endpoints
- `GET /api/v1/states`: List all states.
- `GET /api/v1/districts?state_id={id}`: List districts within a state.
- `GET /api/v1/subdistricts?district_id={id}`: List sub-districts.
- `GET /api/v1/villages?sub_district_id={id}`: List villages (paginated).
- `GET /api/v1/search?q={name}`: Search for villages by name.

## 📝 License
Distributed under the ISC License.
