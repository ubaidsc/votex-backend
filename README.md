# Secure Online Voting System 🗳️

A secure backend API for an online voting system built with Node.js, Express, MongoDB, and JWT authentication.

## Features

- JWT-based authentication with different user roles (Organizer and Voter)
- Secure password handling with bcrypt
- Role-based access control
- Email notifications for voters
- Comprehensive audit logging
- Swagger API documentation
- Security features including rate limiting, CORS, and input validation

## Project Structure

The application follows a modular architecture with clear separation of concerns:

- `controllers/` - Logic for handling requests
- `middleware/` - Custom middleware functions
- `models/` - MongoDB schemas and models
- `routes/` - API route definitions
- `utils/` - Utility functions and helpers
- `config/` - Configuration files

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and update the variables:
   ```
   cp .env.example .env
   ```

### Running the server

```
npm run dev
```

The server will start on the port defined in your `.env` file (default: 5000).

API documentation will be available at: `http://localhost:5000/api-docs`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register as an organizer
- `POST /api/auth/login` - Login as an organizer
- `POST /api/auth/voter-login` - Login as a voter
- `GET /api/auth/me` - Get current user profile
- `GET /api/auth/logout` - Logout

### Voters Management (Organizers only)

- `POST /api/voters` - Add a new voter
- `GET /api/voters` - List all voters
- `GET /api/voters/:id` - Get a specific voter
- `PUT /api/voters/:id` - Update voter information
- `DELETE /api/voters/:id` - Delete/deactivate a voter
- `POST /api/voters/:id/reset-password` - Reset voter password

### Polls Management

- `POST /api/polls` - Create a new poll (Organizers only)
- `GET /api/polls` - List all polls (Organizers only)
- `GET /api/polls/:id` - Get a specific poll
- `PUT /api/polls/:id` - Update a poll (Organizers only)
- `DELETE /api/polls/:id` - Delete a poll (Organizers only)
- `GET /api/polls/:id/results` - View poll results
- `GET /api/polls/available` - List polls available for voting (Voters only)

### Voting

- `POST /api/vote/:pollId` - Cast a vote (Voters only)
- `GET /api/vote/status/:pollId` - Check if already voted (Voters only)

## Security Features

- Password hashing using bcrypt
- JWT for secure authentication
- Rate limiting to prevent brute force attacks
- Input validation and sanitization
- Audit logging of all critical actions
- Role-based access control
- Soft deletion for data privacy
- CORS protection
- Helmet for security headers

## License

This project is licensed under the MIT License.