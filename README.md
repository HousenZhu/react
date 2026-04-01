# Personalized Learning Platform

A full-stack learning management system built with Next.js 14, TypeScript, PostgreSQL, and Better Auth.

## Video Demo

https://www.youtube.com/watch?v=XEOUFniIkoA

## ? Features

- **User Authentication**: Secure registration/login with role-based access (Teacher/Student)
- **Course Management**: Create, edit, and publish courses with modules
- **Content Delivery**: Support for PDFs, videos, and external links
- **Quizzes**: Multiple-choice quizzes with automatic grading
- **Assignments**: Submit work, receive grades and feedback
- **Progress Tracking**: Monitor completion percentage and analytics
- **Discussion Forums**: Real-time course discussions
- **Certificates**: Generate PDF certificates on course completion
- **Calendar Export**: Export deadlines to .ics format

## ?? Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma |
| Auth | Better Auth |
| Storage | Local filesystem |
| Styling | Tailwind CSS |
| Validation | Zod |

## ? Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Install Dependencies

```bash
cd react
npm install
```

### 2. Set Up PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE learning_platform;
CREATE USER learning_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE learning_platform TO learning_user;

# Grant schema permissions
\c learning_platform
GRANT ALL ON SCHEMA public TO learning_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO learning_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO learning_user;
\q
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Update `.env` with your values:

```env
# Database
DATABASE_URL="postgresql://learning_user:your_password@localhost:5432/learning_platform"

# Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-generated-secret"
BETTER_AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Push Database Schema

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ? Project Structure

```
src/
念岸岸 app/                    # Next.js App Router pages
岫   念岸岸 api/               # API routes
岫   岫   念岸岸 auth/          # Better Auth endpoints
岫   岫   念岸岸 upload/        # File upload handling
岫   岫   念岸岸 calendar/      # ICS export
岫   岫   念岸岸 certificates/  # Certificate verification
岫   岫   弩岸岸 discussion/    # Real-time SSE
岫   念岸岸 (auth)/            # Auth pages (login, register)
岫   弩岸岸 (dashboard)/       # Protected dashboard pages
念岸岸 actions/               # Server Actions
岫   念岸岸 course.ts          # Course CRUD
岫   念岸岸 enrollment.ts      # Enrollment management
岫   念岸岸 module.ts          # Module management
岫   念岸岸 content.ts         # Content management
岫   念岸岸 quiz.ts            # Quiz & questions
岫   念岸岸 assignment.ts      # Assignment management
岫   念岸岸 submission.ts      # Submission & grading
岫   念岸岸 discussion.ts      # Discussion posts
岫   念岸岸 certificate.ts     # Certificate generation
岫   弩岸岸 analytics.ts       # Dashboard analytics
念岸岸 lib/                   # Utilities
岫   念岸岸 auth.ts            # Better Auth config
岫   念岸岸 auth-server.ts     # Server-side auth helpers
岫   念岸岸 auth-client.ts     # Client-side auth
岫   念岸岸 db.ts              # Prisma client
岫   念岸岸 storage.ts         # Local file storage
岫   念岸岸 pdf.ts             # Certificate PDF generation
岫   念岸岸 calendar.ts        # ICS generation
岫   念岸岸 validations.ts     # Zod schemas
岫   弩岸岸 utils.ts           # Helper functions
念岸岸 types/                 # TypeScript types
弩岸岸 middleware.ts          # Route protection
```

## ?? Database Schema

### Core Entities

- **User**: Teachers and students with role-based access
- **Course**: Created by teachers, enrolled by students
- **Module**: Organizes course content
- **Content**: PDF, video, link resources
- **Quiz/Question**: Multiple-choice assessments
- **Assignment/Submission**: Student work and grading
- **DiscussionPost**: Course forums with replies
- **Certificate**: Completion certificates

### Key Relationships

- User ↙ Course (1:N as teacher)
- User ? Course (M:N via Enrollment)
- Course ↙ Module ↙ Content/Quiz/Assignment
- User ↙ Submission ↙ Assignment

## ? Authentication

Using Better Auth with email/password:

```typescript
// Client-side
import { signIn, signUp, signOut, useSession } from "@/lib/auth-client";

// Sign up
await signUp.email({
  email: "user@example.com",
  password: "password123",
  name: "John Doe",
  role: "STUDENT", // or "TEACHER"
});

// Sign in
await signIn.email({
  email: "user@example.com",
  password: "password123",
});
```

## ? Server Actions

All mutations use Next.js Server Actions:

```typescript
// Course operations
import { createCourse, updateCourse, deleteCourse } from "@/actions";

// Create a course (teacher only)
const course = await createCourse({
  title: "Web Development 101",
  description: "Learn the basics",
});

// Enroll in a course (student)
import { enrollInCourse } from "@/actions";
await enrollInCourse(courseId);
```

## ? File Uploads

Files are stored locally in `/public/uploads/`:

```typescript
// Client-side upload
const formData = new FormData();
formData.append("file", file);
formData.append("folder", "submissions");

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

const { url, key } = await response.json();
```

## ? Calendar Export

Export deadlines to calendar:

```typescript
// Download .ics file
window.location.href = `/api/calendar/export?courseId=${courseId}`;
```

## ? Testing the API

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'

# Login and save session
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "test@example.com", "password": "password123"}'

# Check session
curl http://localhost:3000/api/auth/get-session -b cookies.txt

# Upload a file (authenticated)
curl -X POST http://localhost:3000/api/upload \
  -b cookies.txt \
  -F "file=@/path/to/file.pdf"

# Verify a certificate
curl "http://localhost:3000/api/certificates/verify?number=CERT-123456"
```

## ?? Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio (GUI) |
| `npm run db:seed` | Seed sample data |

## ? Troubleshooting

### Database Connection Error

Ensure PostgreSQL is running:

```bash
# Test connection
psql -d learning_platform -U learning_user
```

### Permission Denied for Schema

Grant schema permissions:

```sql
\c learning_platform
GRANT ALL ON SCHEMA public TO learning_user;
```

### Port Already in Use

```bash
lsof -ti:3000 | xargs kill -9
```

### Update User Role to Teacher

```bash
psql -d learning_platform -c "UPDATE users SET role = 'TEACHER' WHERE email = 'your@email.com';"
```

## ? Team

| Member | Responsibilities |
|--------|-----------------|
| Zhiyuan Diao | Architecture, Auth, Database |
| Housen Zhu | Course, Assignment, Grading |
| Tianrui Du | Analytics, Calendar, Certificates |

## ? License

MIT License - Built for CS Course Project
