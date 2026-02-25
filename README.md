# SOS Auto DZ - Backend & Frontend Integration

A full-stack automotive services platform connecting clients with mechanics, spare parts shops, and towing services across Algeria.

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React** with TypeScript
- **Vite** as build tool
- **Tailwind CSS** for styling

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env

# Edit .env and configure your MongoDB connection
# MONGODB_URI=mongodb://localhost:27017/sos-auto-dz
# JWT_SECRET=your_secret_key_here

# Start MongoDB (if running locally)
# mongod

# Run the backend server
npm run dev
```

The backend server will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Seed Database (Optional)

To populate the database with sample providers:

```bash
cd backend
node seed.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Service Providers
- `GET /api/providers` - Get all providers (with filters)
- `GET /api/providers/:id` - Get single provider
- `PUT /api/providers/:id` - Update provider (protected)
- `GET /api/providers/user/:userId` - Get provider by user ID (protected)

### Bookings
- `POST /api/bookings` - Create booking (protected)
- `GET /api/bookings` - Get user's bookings (protected)
- `GET /api/bookings/:id` - Get single booking (protected)
- `PUT /api/bookings/:id` - Update booking status (protected)
- `DELETE /api/bookings/:id` - Cancel booking (protected)

### Notifications
- `GET /api/notifications` - Get all notifications (protected)
- `PUT /api/notifications/:id/read` - Mark as read (protected)
- `DELETE /api/notifications` - Clear all notifications (protected)
- `DELETE /api/notifications/:id` - Delete notification (protected)

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sos-auto-dz
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### Frontend (.env)
```
VITE_REACT_APP_BACKEND_BASEURL=http://localhost:5000
```

## User Roles

- **CLIENT** - Regular users booking services
- **MECHANIC** - Garage owners/mechanics (with garage type: MECHANIC, ELECTRICIAN, AUTO_BODY)
- **PARTS_SHOP** - Spare parts retailers
- **TOWING** - Towing service providers
- **ADMIN** - Platform administrators

## Features

### For Clients
- Browse service providers by location, type, and car brand
- Real-time availability status
- Book appointments with providers
- Track booking status
- Receive notifications

### For Service Providers
- Create and manage professional profile
- Set working hours and availability
- Receive and manage booking requests
- Accept/decline bookings
- Update service status

### General
- Multi-language support (English, French, Arabic)
- Dark mode
- Geolocation-based search
- Responsive design
- JWT authentication
- Real-time notifications

## Project Structure

```
sos-auto-dz/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── ServiceProvider.js
│   │   ├── Booking.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── providers.js
│   │   ├── bookings.js
│   │   └── notifications.js
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/
    ├── components/
    ├── pages/
    ├── api.ts
    ├── types.ts
    ├── constants.ts
    ├── App.tsx
    └── package.json
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Build for Production

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## License

MIT
