# Personalized Learning Platform

# 1. Motivation

## 1.1 Problem Statement

As education increasingly shifts toward digital and hybrid formats, learning management systems have become essential tools for course delivery. However, many existing platforms function primarily as content repositories rather than interactive, personalized learning environments. Educators often upload lecture slides, PDFs, and recorded videos, but meaningful engagement tools and integrated feedback mechanisms are limited. Students may struggle to track their progress, stay motivated, or receive timely insights into their performance.

In addition, educators frequently rely on multiple disconnected systems for content hosting, assignment submission, grading, communication, and deadline management. This fragmentation increases administrative workload and creates inefficiencies. The lack of integration between content delivery, assessment, analytics, and discussion tools results in a disjointed learning experience for both teachers and students.

## 1.2 Rationale and Significance

The proposed Personalized Learning Platform addresses these challenges by consolidating essential educational features into a unified system. It integrates user authentication with role-based access control, course creation and management, interactive quizzes and assignments, progress tracking, discussion forums, calendar integration, and certificate generation.

By leveraging PostgreSQL for structured data and cloud storage for scalable content management, the system ensures reliability, organization, and performance. Automated grading and analytics dashboards provide data-driven insights into student performance, helping educators make informed instructional decisions. Students benefit from clear visibility into deadlines, grades, and completion status, which supports accountability and engagement.

This project is worth pursuing because digital learning continues to expand, yet there remains a need for platforms that prioritize usability, personalization, and integration. Developing this system demonstrates practical full-stack engineering skills while solving a real-world problem in modern education.

## 1.3 Target User Groups

The primary users are educators and students. Educators need efficient tools to create courses, manage materials, evaluate assignments, and monitor progress. Students require structured learning paths, interactive content, timely feedback, and collaborative spaces for discussion. Educational institutions and training organizations may also benefit from a scalable and centralized learning solution.

## 1.4 Review of Existing Solutions

Platforms such as Moodle, Canvas, and Google Classroom provide course management capabilities but often emphasize administrative organization over personalized engagement. Interfaces can be complex, customization may be limited, and analytics features are not always deeply integrated.

This project aims to bridge these gaps by delivering a streamlined, interactive, and data-informed personalized learning environment.

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

### 2.3.7. Assignment Submission and Grading  

Students can:

- Submit text-based responses.
- Upload assignment files (PDF, images, documents).
- View submission status (submitted, late, graded).
- Receive grades and written feedback.

Teachers can:

- View all submissions for an assignment.
- Download submitted files.
- Assign grades and provide feedback.
- Update grades if necessary.

Validations:

- File type validation (PDF, JPG, PNG only).
- File size limit enforcement (e.g., max 10MB).
- Prevent duplicate submissions if policy requires.
- Deadline enforcement (mark as late if submitted after due time).
- Ensure only enrolled students can submit.
- Ensure only course teacher can grade.
- Validate grade range (e.g., 0–100).
- Prevent unauthorized access to other students’ submissions.

      Student Uploads File
              │
              ▼
      Server Action (Validate Submission)
              │
              ├── Validate Enrollment & Deadline
              ├── Validate File Type & Size
              ├── Upload File to Cloud Storage
              ├── Save Metadata in PostgreSQL
              └── Mark Submission Status
              │
              ▼
      Teacher Reviews Submission
              │
              ▼
      Grade + Feedback Saved
              │
              ▼
      Student Dashboard Updated

This feature demonstrates secure file handling, relational integrity, backend validation logic, and role-based authorization.

**Advanced Feature Category:** File Handling and Processing  

---

### 2.3.8. Calendar Integration for Deadlines  

Teachers can:

- Set assignment deadlines.
- Modify deadlines when necessary.

Students can:

- View upcoming deadlines on dashboard.
- See countdown indicators.
- Export deadlines via downloadable `.ics` calendar file.

Validations:

- Deadline stored in UTC to avoid timezone conflicts.
- Prevent invalid dates (past deadline during creation).
- Update dashboard dynamically when deadlines change.
- Ensure only teacher can modify deadline.
- Validate `.ics` file format correctness.

      Teacher Sets Deadline
              │
              ▼
      Deadline Stored in PostgreSQL
              │
              ▼
      Aggregation Query (Upcoming Deadlines)
              │
              ├── Display Countdown
              └── Generate .ics File
              │
              ▼
      Student Imports to Calendar

This feature requires structured date queries, dynamic file generation, and secure API handling.

**Advanced Feature Category:** Advanced State Management  

---

### 2.3.9. PostgreSQL for Structured Data  

#### Key Advantages

- Enforces relational integrity via foreign keys.
- Supports many-to-many enrollment relationships.
- Enables complex aggregation queries (grade averages, completion %).
- Ensures transactional consistency for submissions and grading.
- Prevents orphaned records.

#### Validation Considerations

- Unique constraints (email, enrollment pairs).
- Foreign key constraints.
- Cascade rules for deletion (e.g., course deletion).
- Indexing for performance (assignmentId, courseId).
- Transaction handling for grading workflow.

---

### 2.3.10. Cloud Storage for Educational Content  

- Secure upload endpoints.
- MIME type verification.
- File size restriction.
- Signed URL or controlled access endpoint.
- Prevent direct public exposure of private submissions.
- Handle upload failure rollback.

      File Uploaded
              │
              ▼
      API Route
              │
              ├── Validate File
              ├── Upload to Cloud Storage
              └── Return File URL
              │
              ▼
      Metadata Saved in PostgreSQL

This approach prevents database bloat and aligns with modern scalable application architecture.

**Advanced Feature Category:** Cloud Integration & File Management  

---

## 2.4. Alignment with Course Requirements  

This project satisfies all core course technical requirements through a combination of full-stack architecture, structured data modeling, secure file handling, and advanced backend logic.

Advanced backend logic includes at least two of the following:

- Authentication & Authorization
- Real-Time Functionality
- File Handling & Processing
- Advanced State Management

### Full-Stack TypeScript Implementation

The entire application is built using TypeScript across both frontend and backend layers.  
Type safety ensures:

- Strongly typed API contracts between frontend and backend.
- Reduced runtime errors through compile-time validation.
- Clear interface definitions for database entities and request/response structures.
- Maintainable and scalable code architecture.

This demonstrates mastery of modern strongly-typed full-stack development practices.

---

### Next.js App Router Architecture

The project adopts the Next.js Full-Stack App Router model, which includes:

- Server Components for secure server-side data fetching.
- Server Actions for mutations such as assignment submission and grading.
- Route Handlers (`/api/*`) for file uploads, certificate generation, and calendar exports.
- Middleware for role-based access control.

This architecture demonstrates:

- Separation of concerns between client and server.
- Secure server-side logic execution.
- Efficient rendering and state management.

---

### PostgreSQL Relational Database with Normalized Schema

The system uses PostgreSQL with a normalized relational schema to support:

- Many-to-many relationships (students ↔ courses).
- One-to-many relationships (course → assignments → submissions).
- Aggregation queries for grade averages and progress tracking.
- Referential integrity via foreign keys and constraints.

Complex relational queries are required for:

- Computing course completion percentages.
- Validating assignment eligibility.
- Aggregating grades for analytics dashboards.
- Verifying completion criteria before certificate generation.

This demonstrates competency in structured data modeling and relational database design beyond simple CRUD storage.

---

### Cloud Storage Integration

Educational materials, assignment submissions, and generated certificates are stored in cloud object storage.

The system includes:

- Secure upload endpoints.
- File type and size validation.
- Storage of file metadata in PostgreSQL.
- Controlled access to private submission files.

This separation of file storage from structured relational data reflects industry best practices and demonstrates understanding and usage of scalable architecture design.

---

### Role-Based Authentication and Authorization

The application implements secure authentication and authorization logic.

Features include:

- Password hashing and secure session handling.
- Role-based access control (Teacher vs Student).
- Protected API routes.
- Validation to prevent unauthorized grading or submission access.

This demonstrates secure system design and backend enforcement of business logic constraints.

---

### Secure File Upload and Processing

Assignment submission and certificate generation involve:

- Server-side validation of uploaded files.
- Integration between API routes and cloud storage.
- Metadata tracking in PostgreSQL.
- Controlled file retrieval logic.

These features extend beyond simple form submission and require backend orchestration across multiple services.

---

### Complex Relational Queries and State Management

The system performs non-trivial database queries and derived state computation, including:

- Deadline aggregation and countdown calculations.
- Average grade computation.
- Submission status tracking.
- Completion validation for certificate eligibility.

This demonstrates advanced backend data processing and state management rather than simple record retrieval.

---

### Advanced Features Beyond CRUD

The platform includes multiple advanced features that extend beyond basic Create-Read-Update-Delete functionality:

- Calendar integration for deadlines (time-based aggregation and file generation).
- Certificate generation upon completion (PDF generation and conditional validation).
- Assignment grading workflows with role restrictions and validation.
- Real-time discussion forum updates via WebSocket integration.

Each of these features requires backend validation, relational modeling, and cross-layer coordination between database, server logic, and UI components.

Together, these implementations demonstrate comprehensive understanding of full-stack system design, structured data modeling, secure backend processing, and scalable architecture — fully satisfying the technical requirements. Each advanced feature extends beyond basic CRUD operations and demonstrates backend logic, data modeling, validation, and file processing.

---

## 2.5. Discussion of project scope and feasibility within the timeframe

To ensure feasibility within the project timeframe, the scope is intentionally controlled:

- Only two user roles (Teacher and Student).
- Quiz limited to multiple-choice format.
- Basic discussion forum (no advanced moderation tools).
- Video upload optional (external link supported initially).
- Calendar integration via `.ics` export rather than deep external API integration.
- Certificate design template fixed (no customization builder).

The MVP prioritizes:

- Secure authentication.
- Course management.
- Assignment submission and grading.
- Deadline tracking.
- Certificate generation.

Advanced features are implemented in controlled complexity to balance ambition and feasibility.

Given a three-member team, responsibilities can be divided across:

- Authentication & User Management.
- Course & Assignment Workflow.
- Analytics, Calendar, and Certificate Generation.

This structured approach ensures timely completion while maintaining technical depth and system reliability.

---

# 3. Tentative Plan

## 3.1 Development Strategy

Our team will adopt an incremental development approach. We will first establish the system architecture and database schema, then implement core functionality (authentication and course workflow), followed by advanced features (analytics, calendar integration, certificate generation, and real-time discussion).

Development will proceed in layers to ensure stable integration and reduce conflicts. Version control will be managed using feature branches, with regular internal testing and review before merging.

## 3.2 Responsibility Breakdown
Zhiyuan Diao – System Architecture & Security

Next.js full-stack architecture setup

PostgreSQL schema design and Prisma configuration

Authentication and role-based authorization

Middleware protection and secure API validation

Relational integrity enforcement

Integration testing across modules

Zhiyuan ensures secure backend logic and overall system stability.


Housen Zhu – Course & Assignment Workflow

Course creation and enrollment logic

Module and content management

Quiz (multiple-choice) implementation

Assignment creation and submission system

File upload validation and cloud storage integration

Teacher grading interface

Housen focuses on the primary teaching and learning workflow.


Tianrui Du – Analytics & Advanced Features

Progress tracking computation

Dashboard analytics (completion %, grade averages)

Deadline aggregation and countdown logic

.ics calendar export generation

Certificate PDF generation

Real-time discussion forum implementation

Tianrui develops derived-state computation and advanced backend functionality.

## 3.3 Week-by-Week Plan
Week 1 – Architecture & Authentication

Initialize Next.js App Router project

Design and migrate PostgreSQL schema

Implement authentication and role-based access control

Set up protected routes and core layout

Outcome: Secure login system and foundational architecture.

Week 2 – Core Learning Workflow

Implement course creation and enrollment

Build module organization

Develop assignment creation and submission system

Integrate cloud file upload

Implement grading interface

Outcome: Fully functioning assignment submission and grading workflow.

Week 3 – Analytics & Advanced Features

Implement progress tracking and dashboard metrics

Add deadline management and calendar export

Develop certificate generation

Implement real-time discussion forum

Conduct integration testing and bug fixes

Outcome: Feature-complete MVP with analytics and advanced backend functionality.

3.4 Risk Management

Potential challenges include authorization errors, relational inconsistencies, file handling issues, and complex aggregation queries.

To mitigate risk, we will:

Finalize the database schema early

Integrate features incrementally

Perform continuous internal testing

Keep advanced features controlled in scope

# 4. Initial Independent Reasoning (Before Using AI)

This section documents our team’s original planning discussion before consulting any AI tools. The decisions below reflect our early technical reasoning, assumptions, and collaboration strategy.

---

## 4.1 Application Structure and Architecture  

### Initial Decision Between Next.js Full-Stack (App Router) and Separate React Frontend + Express Backend  

After comparing both options, we decided to use **Next.js with the App Router**.

Since this is a course project with a limited timeline, we wanted to avoid spending too much time designing and maintaining a separate REST API layer. Managing two separate codebases (frontend and backend) would require additional setup and API handling across services. We felt this could increase complexity and slow down development. Also we do not have strong experience designing backend APIs from scratch using Express. Next.js allows us to write server-side logic using the same language and framework we already know. This felt more efficient for our skill set.

---

## 4.2 Data and State Design  

### Initial Database Design Thinking  

When we first discussed the data design, we agreed that the platform naturally fits a relational model. The system revolves around structured a many-to-many relationships between users, courses, enrollments, assignments, and submissions, so using **PostgreSQL** felt like the most logical choice.

### Client-Side and Server-Side State Design  

we decided to divide application state into long / short term data. Long-term data including users, courses, enrollments, submissions, grades, and discussion posts will be stored in PostgreSQL and accessed through server-side logic. Client-side UI state will include temporary or interaction-based data, such as form inputs and temporary quiz selections. 

---

## 4.3 Feature Selection and Scope Decisions

Our initial feature discussion focused on defining a realistic MVP before adding advanced features.

We identified the main workflow:

- Teacher creates course.
- Teacher uploads materials.
- Student enrolls.
- Student submits assignment.
- Teacher grades submission.

We considered adding advanced features such as:

- Real-time collaborative editing
- Advanced quiz types (drag-and-drop, coding questions)
- Deep analytics dashboards
- External API integrations

However, we decided to prioritize:

- Assignment submission and grading
- Calendar integration for deadlines
- Certificate generation upon completion

We selected these advanced features because they:

- Extend beyond simple CRUD operations.
- Require backend logic and validation.
- Are achievable within the timeframe.
- Demonstrate relational querying and file handling.

We intentionally limited complexity by:

- Supporting only two roles (Teacher and Student).
- Restricting quiz types to multiple-choice.
- Using `.ics` export instead of full external calendar API integration.
- Using a fixed certificate template rather than a customizable builder.

Our early tradeoff mindset was: depth over breadth.

---

## 4.4 Anticipated Challenges

Before implementation, we identified several potential challenges:

### Authentication and Authorization

Ensuring that:

- Only teachers can grade.
- Only enrolled students can submit.
- Students cannot access other students’ submissions.

We anticipated minor authorization bugs if not handled carefully.

### Relational Data Integrity

Managing foreign keys and ensuring that:

- Deleting a course does not orphan records.
- Submissions are correctly linked to assignments.
- Aggregation queries are accurate.

### File Handling

Handling:

- File validation (size, type).
- Secure upload to cloud storage.
- Preventing unauthorized access to private files.

### Derived State Computation

Calculating:

- Completion percentage.
- Average grades.
- Deadline countdowns.

We expected these computations to require careful SQL queries and backend validation.

---

## 4.5 Early collaboration plan

---

# 5. AI Assistance Disclosure

## 5.1 AI Tool Assistance

---

## 5.2 Sections Developed Without AI Assistance

- The selection of the **Personalized Learning Platform** as our project topic.
- The initial problem statement and motivation for building a unified learning system.
- The decision to use **Next.js Full-Stack architecture** instead of separating frontend and backend.
- The choice of **PostgreSQL** as a relational database due to structured relationships (users, enrollments, submissions, grades).
- The identification of core features:
  - Course creation and management
  - Assignment submission and grading
  - Role-based authentication (Teacher / Student)
- Early scope constraints, such as limiting roles to two and restricting quiz types to multiple choice.

These decisions were made through internal team discussion based on prior coursework, technical familiarity, and feasibility within the project timeline.

---

## 5.3 How AI Was Used

AI tools were used primarily for refinement and clarity rather than idea generation. Specifically, AI assisted with:

- Improving the structure and wording of proposal sections.
- Expanding technical explanations to better align with grading rubrics.
- Suggesting validation considerations (e.g., file size limits, foreign key constraints).
- Strengthening the “Alignment with Course Requirements” section.
- Improving formatting consistency in Markdown.

AI did not determine the core architecture, feature set, or overall direction of the project.

---

## 5.4 Examples of AI Influence and Team Consideration

One idea influenced by AI was the suggestion to explicitly frame certain features (e.g., calendar integration and certificate generation) as “advanced features” tied to backend logic, file processing, and relational validation.

AI suggested emphasizing how these features go beyond basic CRUD operations. After discussing this internally, we considered:

- Whether increasing the technical complexity (e.g., deeper external API integration for calendar sync) would introduce unnecessary risk.
- Whether expanding certificate customization would exceed the project timeline.
- Whether adding more advanced features would compromise feasibility.

We ultimately adopted the structural framing (highlighting backend validation and relational queries) but intentionally kept the implementation scope controlled (e.g., `.ics` export instead of full external API integration).

This reflects our approach: AI was used to improve wording and completeness, while final design decisions and scope limitations were determined by the team.
