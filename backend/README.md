# Hollai Portfolio Backend

This is the backend server for the Hollai portfolio website, built with Node.js, Express, and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb+srv://adithyavholla23:%40d%21tHy%4023@hollai.ykdlaxn.mongodb.net/hollai
NODE_ENV=development
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Projects

- `GET /api/projects` - Get all projects
- `GET /api/projects/featured` - Get featured projects
- `GET /api/projects/:id` - Get a single project by ID

### Feedback

- `POST /api/feedback` - Submit new feedback
  - Required fields: name, email, subject, message
- `GET /api/feedback` - Get all feedback (for admin purposes)
- `PATCH /api/feedback/:id/status` - Update feedback status
  - Status options: 'new', 'read', 'replied'

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- cors for cross-origin requests
- dotenv for environment variables
- morgan for logging

## Project Structure

```
backend/
├── models/         # MongoDB models
├── routes/         # API routes
├── .env           # Environment variables
├── server.js      # Main application file
└── package.json   # Project dependencies
``` 