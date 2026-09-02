# Footwear ERP + CRM Operations Portal

Mini ERP and CRM Operations Portal built with Node.js, TypeScript, Express, Prisma ORM, and React.

## Project Structure
- `backend/` - Node.js Express server with Prisma ORM
- `frontend/` - React application with Tailwind CSS

## Quick Start Guide

### 1. Database Setup
Configure a PostgreSQL database. Set the connection string as `DATABASE_URL` in your backend environment variables.

### 2. Backend Setup
\`\`\`bash
cd backend
npm install

# Setup environment variables
cp .env.example .env

# Run Prisma migrations & seed the database
npx prisma migrate dev --name init
npm run prisma:seed

# Start the server
npm run dev
\`\`\`

### 3. Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Test Accounts
The database seed script generates the following test accounts:
- **Admin**: admin@erp.com / Admin@123
- **Sales**: sales@erp.com / Sales@123
- **Warehouse**: warehouse@erp.com / Warehouse@123
- **Accounts**: accounts@erp.com / Accounts@123

## System Features
1. **RBAC & Authentication**: JWT-based role-based access control.
2. **Customers Module**: CRM management with follow-up notes.
3. **Products & Inventory Module**: Stock movement logging, low stock alerts, and inventory adjustments.
4. **Sales Challan Module**: Order workflows, product pricing snapshots, and automated stock deduction.
5. **Admin Dashboard**: Aggregated operational metrics.
