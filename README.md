# Mini ERP + CRM Operations Portal

A complete, production-grade Mini ERP + CRM Operations Portal built with Node.js, TypeScript, Express, Prisma ORM, and React.

## Project Structure
- `backend/` - Node.js Express server with Prisma ORM
- `frontend/` - React application with Tailwind CSS (Clean white theme)

## 🚀 Quick Start Guide

### 1. Database Setup
Ensure you have PostgreSQL running locally or use a cloud database (Supabase/Neon).
If you want to use SQLite for quick testing without installing Postgres, change `provider = "postgresql"` to `provider = "sqlite"` in `backend/prisma/schema.prisma` and use `file:./dev.db` as the `DATABASE_URL`.

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database URL

# Run Prisma migrations & seed the database with sample data
npx prisma migrate dev --name init
npm run prisma:seed

# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Test Accounts (Seeded Data)
The database seed script creates the following accounts (Password for all is `*Role*@123`):
- **Admin**: `admin@erp.com` / `Admin@123`
- **Sales**: `sales@erp.com` / `Sales@123`
- **Warehouse**: `warehouse@erp.com` / `Warehouse@123`
- **Accounts**: `accounts@erp.com` / `Accounts@123`

## 📦 Features Implemented in Backend
1. **RBAC & JWT**: Full role-based route protection.
2. **Customers Module**: CRUD + timeline CRM notes.
3. **Products & Inventory Module**: Auto stock movement logging, low stock alerts, atomic inventory adjustments.
4. **Sales Challan Module**: Draft/Confirmed workflows, immutable product snapshots, atomic stock deduction preventing negative inventory.
5. **Admin Dashboard**: Aggregated metrics and recent activity feeds.
