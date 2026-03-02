# Personalized Learning Platform

# 1. Motivation
## 1.1 Problem Statement

As education increasingly shifts toward digital and hybrid formats, learning management systems (LMS) have become central to course delivery. However, many existing platforms primarily serve as content repositories rather than interactive, personalized learning environments. Educators typically upload slides, PDFs, and recorded lectures, but tools for meaningful engagement, progress tracking, and integrated feedback are often limited.

Students may struggle to monitor their performance, stay motivated, or receive timely insights into their learning progress. At the same time, educators frequently rely on multiple disconnected systems for assignments, grading, communication, and deadline management. This fragmentation increases administrative workload and creates an inconsistent user experience. The lack of integration between content delivery, assessment, analytics, and discussion tools results in inefficiencies for both teachers and students.

## 1.2 Rationale and Significance

The proposed Personalized Learning Platform addresses these issues by consolidating essential educational functions into a unified system. It integrates role-based authentication, course management, quizzes and assignments, progress tracking, discussion forums, calendar support, and certificate generation within a single platform.

Using PostgreSQL for structured relational data and cloud storage for scalable content management ensures reliability and performance. Automated grading and analytics dashboards provide actionable insights into student performance, enabling data-informed instructional decisions. Students benefit from clear visibility into deadlines, grades, and completion status, supporting accountability and engagement.

As digital learning continues to expand, there is a growing need for platforms that prioritize usability, integration, and personalized feedback. This project addresses that need while demonstrating practical full-stack engineering skills applied to a real-world educational challenge.

## 1.3 Target User Groups

The primary users are educators and students. Educators require tools to create and manage courses, distribute materials, evaluate assignments, and monitor student progress. Students need structured learning paths, interactive assessments, timely feedback, and collaborative discussion spaces. Educational institutions and training organizations may also benefit from a centralized, scalable solution.

## 1.4 Review of Existing Solutions

Existing platforms such as Moodle, Canvas, and Google Classroom provide course management capabilities but often emphasize administration over personalization. Customization can be limited, and analytics features are not always deeply integrated.

This project aims to deliver a streamlined, interactive, and data-driven learning environment that addresses these limitations.

# 2. Objective and Key Features  

## 2.1 Project Objective  

The objective of this project is to design and implement a full-stack Personalized Learning Platform that enables educators to create, manage, and distribute interactive educational content, while allowing students to engage with materials, track progress, and receive structured feedback.

The platform aims to:

- Provide a centralized system for course delivery and learning management.

- Support personalized learning experiences through progress tracking and analytics.

- Enable structured interaction between teachers and students via assignments, quizzes, and discussion forums.

- Demonstrate mastery of modern full-stack web development using TypeScript, React/Next.js, PostgreSQL, cloud storage, authentication, and real-time features.

The system will focus on usability, responsiveness, and clear role-based access control, ensuring that different user roles (Teachers and Students) have appropriate permissions and workflows.

## 2.2 Technical Implementation  

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

## 2.3 Key Functional Features  

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
      ├── Role Check (Teacher / Student)
      └── Grant / Deny Access

**Advanced Feature Category:** User Authentication and Authorization  

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

### 2.3.3. Discussion Forums (Real-Time)  

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

### 2.3.4. Certificate Generation  

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

### 2.3.5. Assignment Submission and Grading  

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

      Student Uploads File
              │
              ▼
      Server Action (Validate Submission)
              │
              ▼
      Teacher Reviews Submission
              │
              ▼
      Grade + Feedback Saved
              │
              ▼
      Student Dashboard Updated

### 2.3.6. Calendar Integration for Deadlines  

Teachers can:

- Set assignment deadlines.
- Modify deadlines when necessary.

Students can:

- View upcoming deadlines on dashboard.
- See countdown indicators.
- Export deadlines via downloadable `.ics` calendar file.

### 2.3.7. PostgreSQL for Structured Data  

- Enforces relational integrity via foreign keys.
- Supports many-to-many enrollment relationships.
- Enables complex aggregation queries (grade averages, completion %).
- Ensures transactional consistency for submissions and grading.
- Prevents orphaned records.

### 2.3.8. Cloud Storage for Educational Content  

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

## 2.4. Alignment with Course Requirements  

This project satisfies all core course technical requirements through a combination of full-stack architecture, structured data modeling, secure file handling, and advanced backend features.

Core Technical Requirements are satisfied by:

- The project adopts the Next.js Full-Stack App Router model
- The project is built using TypeScript across both frontend and backend layers.
- The system uses PostgreSQL with a normalized relational schema
- Educational materials, assignment submissions, and generated certificates are stored in cloud object storage.

Advanced backend features includes following (detailed explanation are in 2.3):

- Authentication & Authorization
- Real-Time Functionality
- File Handling & Processing

## 2.5. Discussion of project scope and feasibility within the timeframe

To ensure feasibility within the project timeframe, the scope is intentionally controlled:

- Only two user roles (Teacher and Student).
- Quiz limited to multiple-choice format.
- Basic discussion forum (no advanced moderation tools).
- Video upload optional (external link supported initially).
- Calendar integration via `.ics` export rather than deep external API integration.
- Certificate design template fixed (no customization builder).

Our system prioritizes:

- Secure authentication.
- Course management.
- Assignment submission and grading.
- Deadline tracking.
- Certificate generation.

Advanced features are implemented in controlled complexity to balance ambition and feasibility.

---

# 3. Tentative Plan

## 3.1 Development Strategy

Our team will adopt an incremental development approach. We will first establish the system architecture and database schema, then implement core functionality (authentication and course workflow), followed by advanced features (analytics, calendar integration, certificate generation, and real-time discussion).

Development will proceed in layers to ensure stable integration and reduce conflicts. Version control will be managed using feature branches, with regular internal testing and review before merging.

## 3.2 Responsibility Breakdown

| Member           | Area                    | Key Responsibilities                                                                                                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zhiyuan Diao** | Architecture & Security | - Next.js setup <br> - DB schema & Prisma <br> - Auth & role control <br> - Middleware & API validation <br> - Relational integrity <br> - Integration testing |
| **Housen Zhu**   | Course & Assignment     | - Course & enrollment logic <br> - Modules & content <br> - MCQ quizzes <br> - Assignment submission <br> - File upload & storage <br> - Grading interface     |
| **Tianrui Du**   | Analytics & Advanced    | - Progress metrics <br> - Dashboard stats <br> - Deadline & countdown <br> - `.ics` export <br> - Certificate PDF <br> - Real-time forum                       |

## 3.3 Week-by-Week Plan
| Week       | Focus             | Main Tasks                                                                                            | Outcome                     |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------------- | --------------------------- |
| **Week 1** | Architecture      | - Init Next.js <br> - Design DB <br> - Implement auth <br> - Protect routes                           | Secure system foundation    |
| **Week 2** | Core Workflow     | - Course & modules <br> - Assignment system <br> - File upload <br> - Grading                         | Working submission workflow |
| **Week 3** | Advanced Features | - Progress dashboard <br> - Deadline export <br> - Certificates <br> - Real-time forum <br> - Testing | Complete MVP                |


## 3.4 Risk Management

Potential challenges include authorization errors, relational inconsistencies, file handling issues, and complex aggregation queries.

To mitigate risk, we will:

Finalize the database schema early

Integrate features incrementally

Perform continuous internal testing

Keep advanced features controlled in scope

# 4. Initial Independent Reasoning (Before Using AI)

This section documents our team’s original planning discussion before consulting any AI tools. The decisions below reflect our early technical reasoning, assumptions, and collaboration strategy.

## 4.1 Application Structure and Architecture  

After comparing both options, we decided to use **Next.js with the App Router**.

Since this is a course project with a limited timeline, we wanted to avoid spending too much time designing and maintaining a separate REST API layer. Managing two separate codebases (frontend and backend) would require additional setup and API handling across services. We felt this could increase complexity and slow down development. Also we do not have strong experience designing backend APIs from scratch using Express. Next.js allows us to write server-side logic using the same language and framework we already know. This felt more efficient for our skill set.

## 4.2 Data and State Design  

When we first discussed the data design, we agreed that the platform naturally fits a relational model. The system revolves around structured a many-to-many relationships between users, courses, enrollments, assignments, and submissions, so using **PostgreSQL** felt like the most logical choice.

we decided to divide application state into long / short term data. Long-term data including users, courses, enrollments, submissions, grades, and discussion posts will be stored in PostgreSQL and accessed through server-side logic. Client-side UI state will include temporary or interaction-based data, such as form inputs and temporary quiz selections. 

## 4.3 Feature Selection and Scope Decisions

Our initial feature discussion focused on defining a realistic baseline before adding advanced features.

We identified the main workflow:

- Teacher creates course.
- Teacher uploads materials.
- Student enrolls.
- Student submits assignment.
- Teacher grades submission.

We considered adding advanced features such as:

- Real-time discussion platform
- Advanced quiz types (drag-and-drop, coding questions)
- External API integrations

We selected these advanced features because they:

- Extend beyond simple CRUD operations.
- Are achievable within the timeframe.

We intentionally limited complexity by:

- Supporting only two roles (Teacher and Student).
- Restricting quiz types to multiple-choice.
- Using `.ics` export instead of full external calendar API integration.

## 4.4 Anticipated Challenges

Before implementation, we identified two potential challenges:

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

## 4.5 Early collaboration plan

At the start of the project, we divided responsibilities based on technical dependency and individual strengths to reduce integration risks.

Zhiyuan was responsible for system architecture, database schema, authentication, and authorization. Since all features rely on relational integrity and role validation, centralizing these components ensured consistency and minimized schema conflicts.

Housen focused on the core learning workflow, including course creation, assignments, submission, and grading. Grouping these connected features under one owner maintained logical coherence across the teaching process.

Tianrui handled analytics and advanced features such as progress tracking, calendar export, certificate generation, and the discussion forum. These features build on submission and grading data, allowing development after the core workflow was defined.

# 5. AI Assistance Disclosure

## 5.1 AI Tool Assistance

AI tools were used mainly to improve clarity, organization, and wording of the proposal. After we independently decided on the project topic, architecture, features, and scope, AI helped refine technical explanations and align sections with the grading rubric.

AI also assisted in strengthening justifications for design choices and ensuring consistency across sections. However, all major technical decisions and planning were made by the team. AI served primarily as a writing and refinement tool rather than a source of core ideas.

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

---

## 5.4 Examples of AI Influence and Team Consideration

One idea influenced by AI was the suggestion to explicitly frame certain features (e.g., calendar integration and certificate generation) as “advanced features” tied to backend logic, file processing, and relational validation.

AI suggested emphasizing how these features go beyond basic CRUD operations. After discussing this internally, we considered:

- Whether increasing the technical complexity (e.g., deeper external API integration for calendar sync) would introduce unnecessary risk.
- Whether expanding certificate customization would exceed the project timeline.
- Whether adding more advanced features would compromise feasibility.

We ultimately adopted the structural framing (highlighting backend validation and relational queries) but intentionally kept the implementation scope controlled (e.g., `.ics` export instead of full external API integration).

AI was used to improve wording and completeness, while final design decisions and scope limitations were determined by the team.
