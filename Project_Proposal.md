# Personalized Learning Platform

# 1. Motivation


# 2. Objective and Key Features  

## 2.1 Project Objective  

The objective of this project is to design and implement a full-stack Personalized Learning Platform that enables educators to create, manage, and distribute interactive educational content, while allowing students to engage with materials, track progress, and receive structured feedback.

The platform aims to:

- Provide a centralized system for course delivery and learning management.

- Support personalized learning experiences through progress tracking and analytics.

- Enable structured interaction between teachers and students via assignments, quizzes, and discussion forums.

- Demonstrate mastery of modern full-stack web development using TypeScript, React/Next.js, PostgreSQL, cloud storage, authentication, and real-time features.

The system will focus on usability, responsiveness, and clear role-based access control, ensuring that different user roles (Teachers and Students) have appropriate permissions and workflows.

---

## 2.2 Technical Implementation  

---

## Technical Implementation Approach — Next.js Full-Stack  

This project adopts **Option A: Next.js Full-Stack Architecture (App Router)**.  
Frontend and backend logic are implemented within a unified TypeScript codebase while maintaining separation of concerns to educed deployment complexity (single full-stack app).

### Architecture Overview

    Next.js (App Router)
    │
    ├── Server Components (secure data fetching)
    ├── Server Actions (mutations: create course, submit assignment, grading)
    ├── Route Handlers (/api/* for uploads, websockets, integrations)
    ├── PostgreSQL (via Prisma)
    ├── Cloud Storage (DigitalOcean Spaces)
    └── Auth (Better Auth)

---

## Database Schema and Relationships  

The application uses **PostgreSQL** as the relational database.  
The **Many-to-Many Relationship** schema is normalized to support course management, enrollments, assessments, and analytics.

### Core Entities

- **User** (id, name, email, role)
- **Course** (id, title, description, teacherId)
- **Enrollment** (studentId, courseId)
- **Module** (id, courseId, title, order)
- **Content** (id, moduleId, fileUrl, type)
- **Quiz** (id, moduleId)
- **Question** (id, quizId, type, points)
- **Assignment** (id, moduleId, deadline)
- **Submission** (id, studentId, assignmentId, fileUrl, grade)
- **Deadline** (id, moduleId, assignmentId, time)
- **DiscussionPost** (id, courseId, authorId, content)
- **Certificate** (id, studentId, courseId, generatedAt)

### Entity Relationship Diagram (Textual)

    User (Teacher)
    │ 1
    └───────< creates >───────*
    Course
    │ 1
    ├───────< contains >───────*
    │ Module
    │ │
    │ ├── Content
    │ ├── Quiz ──< Question
    │ └── Assignment ──< deadline >── Submission
    │
    ├───────< has >───────* DiscussionPost
    │
    └───────< enrolls via >───────* Enrollment ────* User (Student)
    
    Course ────< completion >────── Certificate

---

## 2.3 Key Functional Features  

---

### 2.3.1. User Authentication and Authorization  

- Secure registration and login  
- Role-based access control (Teacher / Student)  
- Protected routes and server-side validation  

      User Registers / Logs In
      │
      ▼
      Auth Provider (Better Auth)
      │
      ▼
      Session / Token Issued
      │
      ▼
      Access Protected Route
      │
      ├── Role Check (Teacher / Student)
      └── Grant / Deny Access

**Advanced Feature Category:** User Authentication and Authorization  

---

### 2.3.2. Course Creation and Management  

Teachers can:

- Create, edit, and delete courses  
- Organize modules  
- Upload course materials (PDF, video)  
- Set deadlines  

Students can:

- Browse courses materials
- Enroll  
- Access structured content  

      Course
      │
      ├── Module 1
      │ ├── Content (PDF / Video)
      │ ├── Quiz
      │ └── Assignment
      │
      ├── Module 2
      │ └── ...

---

### 2.3.3. Interactive Content Builder (Quizzes & Assignments)  

- Multiple-choice quiz builder  
- Automatic grading  
- File-based assignment submission  
- Manual grading interface  

      Student Submission
      │
      ▼
      Server Action
      │
      ├── Validate Input
      ├── Store File in Cloud Storage
      ├── Save Metadata in PostgreSQL
      └── Trigger Grading Logic
      │
      ▼
      Feedback & Grade

**Advanced Feature Category:** File Handling and Processing  

---

### 2.3.4. Progress Tracking and Analytics Dashboard  

The system computes:

- Course completion percentage  
- Average quiz score  
- Assignment performance  
- Submission status
- Calendar and Deadline Management

      Raw Data (Submissions, Grades, Enrollments, Deadlines)
      │
      ▼
      Aggregation Queries (PostgreSQL)
      │
      ▼
      Derived Metrics (Completion %, Average Score, Deadline Countdown)
      │
      ▼
      Dashboard UI (Student / Teacher View)

**Advanced Feature Category:** Advanced State Management  

---

### 2.3.5. Discussion Forums (Real-Time)  

Each course includes a discussion forum supports live and real-time updates without requiring a page refresh.

      User Posts Message
      │
      ▼
      WebSocket / Real-Time Route Handler
      │
      ├── Save Message to PostgreSQL
      └── Broadcast to Connected Clients
      │
      ▼
      UI Updates Without Refresh

**Advanced Feature Category:** Real-Time Functionality  

---

### 2.3.6. Certificate Generation  

- Completion validation  
- Dynamic PDF generation  
- Downloadable certificate  

      Completion Criteria Met
      │
      ▼
      Server Action
      │
      ├── Verify Progress
      ├── Generate PDF
      ├── Store in Cloud Storage
      └── Save Record in PostgreSQL
      │
      ▼
      Student Downloads Certificate

---

## 2.3. Alignment with Course Requirements  

This project satisfies all core requirements:

- TypeScript (frontend and backend)
- Next.js Full-Stack (App Router)
- Tailwind CSS + shadcn/ui
- PostgreSQL relational database
- Cloud storage integration
- At least two advanced features:
  - Authentication & Authorization
  - Real-Time Functionality
  - File Handling & Processing
  - Advanced State Management

---

## 2.4. Discussion of project scope and feasibility within the timeframe

---

# 3. Tentative Plan

---

# 4. Initial Independent Reasoning (Before Using AI)

---

# 5. AI Assistance Disclosure





