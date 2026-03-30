# Fitness Center Backend API

Complete backend API for Fitness Center Management System built with Node.js, Express, and MongoDB.

## Features

- **Role-Based Authentication** (Customer, Coach, Admin)
- **JWT Token-based Security**
- **Booking Management System**
- **Coach Registration & Approval Workflow**
- **Customer Feedback & Rating System**
- **Complaint Management**
- **Announcements System**
- **Fitness Resources Library**
- **Complete RESTful API**

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/Milindahashankumara/fitness_center-backend.git
cd fitness_center-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
MONGO_URI=mongodb://localhost:27017/fitness_center
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

**Important:** Replace `MONGO_URI` with your actual MongoDB connection string and set a secure `JWT_SECRET`.

4. **Start MongoDB**

Make sure MongoDB is running on your system:

```bash
# For Windows (if installed as service)
net start MongoDB

# For Mac/Linux
sudo systemctl start mongod
```

5. **Run the server**

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Documentation

### Authentication Routes

#### Register User

```
POST /api/auth/register
```

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "customer"
}
```

#### Login

```
POST /api/auth/login
```

**Body:**

```json
{
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```

#### Get Current User

```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

#### Update Profile

```
PUT /api/auth/profile
Headers: Authorization: Bearer <token>
```

### Booking Routes

#### Get All Bookings

```
GET /api/bookings
Headers: Authorization: Bearer <token>
Query Params: ?customerEmail=email&coachId=id&status=pending
```

#### Create Booking

```
POST /api/bookings
Headers: Authorization: Bearer <token>
```

**Body:**

```json
{
  "coachId": "coach_id",
  "coachName": "Coach Name",
  "date": "2026-01-25",
  "time": "10:00",
  "sessionType": "Personal Training",
  "type": "personal",
  "duration": 60,
  "price": 50,
  "message": "Looking forward to the session",
  "location": "Studio A"
}
```

#### Update Booking Status

```
PUT /api/bookings/:id
Headers: Authorization: Bearer <token>
```

**Body:**

```json
{
  "status": "accepted"
}
```

### Coach Routes

#### Get All Coaches

```
GET /api/coaches
Query Params: ?coachStatus=approved&specialization=HIIT
```

#### Get Single Coach

```
GET /api/coaches/:id
```

#### Update Coach Status (Admin)

```
PUT /api/coaches/:id/status
Headers: Authorization: Bearer <admin_token>
```

**Body:**

```json
{
  "coachStatus": "approved"
}
```

### Feedback Routes

#### Get All Feedback

```
GET /api/feedback
Headers: Authorization: Bearer <token>
Query Params: ?status=pending&coachId=id
```

#### Create Feedback

```
POST /api/feedback
Headers: Authorization: Bearer <customer_token>
```

**Body:**

```json
{
  "coachId": "coach_id",
  "coachName": "Coach Name",
  "rating": 5,
  "feedback": "Excellent session!"
}
```

#### Update Feedback Status (Admin)

```
PUT /api/feedback/:id
Headers: Authorization: Bearer <admin_token>
```

**Body:**

```json
{
  "status": "approved"
}
```

### Complaint Routes

#### Get All Complaints

```
GET /api/complaints
Headers: Authorization: Bearer <token>
```

#### Create Complaint

```
POST /api/complaints
Headers: Authorization: Bearer <customer_token>
```

**Body:**

```json
{
  "subject": "Issue with facility",
  "category": "facility",
  "description": "Detailed description",
  "priority": "medium"
}
```

#### Update Complaint (Admin)

```
PUT /api/complaints/:id
Headers: Authorization: Bearer <admin_token>
```

**Body:**

```json
{
  "status": "resolved",
  "response": "Issue has been addressed"
}
```

### Announcement Routes

#### Get All Announcements

```
GET /api/announcements
Query Params: ?targetAudience=all&type=general
```

#### Create Announcement (Admin)

```
POST /api/announcements
Headers: Authorization: Bearer <admin_token>
```

**Body:**

```json
{
  "title": "New Classes Available",
  "content": "Check out our new yoga classes!",
  "type": "general",
  "priority": "medium",
  "targetAudience": "all"
}
```

### Resource Routes

#### Get All Resources

```
GET /api/resources
Query Params: ?category=workout-plan&difficulty=beginner
```

#### Create Resource (Admin)

```
POST /api/resources
Headers: Authorization: Bearer <admin_token>
```

**Body:**

```json
{
  "title": "Beginner Workout Plan",
  "description": "Perfect for starters",
  "category": "workout-plan",
  "difficulty": "beginner",
  "content": "Workout details here..."
}
```

## Database Models

### User Schema

- Customer, Coach, and Admin roles
- Profile information
- Coach-specific fields (specializations, certifications, hourly rate)

### Booking Schema

- Session booking management
- Status tracking (pending, accepted, rejected, completed, cancelled)

### Complaint Schema

- Customer complaints
- Status tracking and admin responses

### Feedback Schema

- Customer feedback and ratings
- Admin moderation

### Announcement Schema

- System-wide announcements
- Target audience filtering

### Resource Schema

- Fitness resources and guides
- Category and difficulty filtering

## Project Structure

```
fitness_center-backend/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── bookingController.js  # Booking management
│   ├── coachController.js    # Coach management
│   ├── complaintController.js
│   ├── feedbackController.js
│   ├── announcementController.js
│   └── resourceController.js
├── middlewares/
│   ├── auth.js              # JWT authentication
│   └── errorHandler.js      # Error handling
├── models/
│   ├── User.js
│   ├── Booking.js
│   ├── Complaint.js
│   ├── Feedback.js
│   ├── Announcement.js
│   └── Resource.js
├── routes/
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── coachRoutes.js
│   ├── complaintRoutes.js
│   ├── feedbackRoutes.js
│   ├── announcementRoutes.js
│   └── resourceRoutes.js
├── .env
├── .gitignore
├── app.ts
├── server.ts
├── package.json
└── README.md
```

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based access control
- Protected routes with middleware
- Input validation
- CORS configuration

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Success responses:

```json
{
  "success": true,
  "data": { ... }
}
```

## Development

To run in development mode with auto-reload:

```bash
npm run dev
```

## Testing

Test the API health:

```bash
curl http://localhost:5000/
```

Expected response:

```json
{
  "success": true,
  "message": "Fitness Center API is running"
}
```

## Deployment

1. Set `NODE_ENV=production` in .env
2. Update `MONGO_URI` with production database
3. Change `JWT_SECRET` to a secure random string
4. Configure `CLIENT_URL` to your frontend domain

## Frontend Integration

This backend is designed to work with the Fitness Center Frontend application. Make sure to:

1. Update frontend API base URL to match your backend URL
2. Handle JWT tokens in frontend localStorage
3. Send tokens in Authorization headers: `Bearer <token>`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

## Author

Fitness Center Development Team
