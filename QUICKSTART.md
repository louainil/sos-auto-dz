# Quick Start Guide

## Prerequisites
Make sure you have installed:
- Node.js (v16+)
- MongoDB (or use MongoDB Atlas)

## Step 1: Install Backend Dependencies

```powershell
cd backend
npm install
```

## Step 2: Configure Environment Variables

Create a `.env` file in the backend directory:
```powershell
copy .env.example .env
```

Edit the `.env` file and update the MongoDB connection string if needed.

## Step 3: Start MongoDB

If using MongoDB locally:
```powershell
# Make sure MongoDB service is running
mongod
```

Or use MongoDB Atlas (cloud) by updating `MONGODB_URI` in `.env`

## Step 4: Seed the Database (Optional but Recommended)

```powershell
# Still in backend directory
node seed.js
```

This will create sample service providers and test accounts.

## Step 5: Start the Backend Server

```powershell
# In backend directory
npm run dev
```

Server will run on http://localhost:5000

## Step 6: Install Frontend Dependencies

Open a new terminal:
```powershell
cd frontend
npm install
```

## Step 7: Start the Frontend

```powershell
# In frontend directory
npm run dev
```

Frontend will run on http://localhost:5173

## Test Accounts

After seeding the database, you can use these accounts:

**Client Account:**
- Email: `client@example.com`
- Password: `password123`

**Provider Accounts:**
- Email: `garageexpertauto@example.com`
- Password: `password123`

(Check console output after running seed.js for all test accounts)

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file exists and has correct values
- Check port 5000 is not in use

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check `.env` file in frontend directory
- Ensure CORS is enabled in backend (already configured)

### Database connection failed
- Check MongoDB is running
- Verify MONGODB_URI in backend `.env`
- If using MongoDB Atlas, check network access settings

## Development Workflow

1. Make changes to backend → auto-reloads (nodemon)
2. Make changes to frontend → auto-reloads (Vite HMR)
3. Test in browser at http://localhost:5173

Enjoy building with SOS Auto DZ! 🚗
