# Final Report

## Team Information

## Motivation

## Objectives

## Technical Stack

- **Chosen approach:** **Next.js Full-Stack** (App Router). We implemented both frontend UI and backend API routes in one codebase.
- **Language:** TypeScript for both client and server logic.
- **Frontend/UI:** React, Tailwind CSS, Radix UI primitives, and reusable custom UI components.
- **Backend/API:** Next.js route handlers and server components; server-side actions for course and analytics operations.
- **Authentication & Authorization:** better-auth with session-based login and role-aware routing for **STUDENT** and **TEACHER** users.
- **Database solution:** PostgreSQL with Prisma ORM (`prisma/schema.prisma`) and Prisma Client.
- **Database tooling:** Prisma schema migration/push workflows, Prisma Studio, and seed script (`prisma/seed.ts`).
- **Cloud storage:** AWS S3-compatible file upload integration for course content, submissions, and certificates.
- **Validation and utilities:** Zod for schema validation, date-fns for date handling, and shared utility modules.
- **Build/dev tooling:** Next.js build pipeline, ESLint, PostCSS, and TypeScript compiler checks.

## Features

The system supports end-to-end learning management workflows for both instructors and students.

1. **Role-based dashboards**
	- Separate teacher and student experiences after login.
	- Supports course management, learning progress tracking, and activity summaries.

2. **Course lifecycle management (Teacher)**
	- Create, edit, publish/unpublish courses.
	- Structure courses into modules and attach content, assignments, and quizzes.
	- Meets project requirements for instructor-side course administration.

3. **Enrollment and learning flow (Student)**
	- Browse courses, enroll, view course content, and continue learning.
	- Dashboard and course pages show progress bars and learning status.
	- Supports objective of providing guided, trackable learning progression.

4. **Assignments and grading**
	- Students submit assignment work (text/file).
	- Teachers review, grade, and provide feedback.
	- Includes pending/reviewed submission views to streamline review workflow.

5. **Quizzes and attempts**
	- Quiz attempts are stored with pass/fail outcomes and scores.
	- Enables measurable assessment and contributes to course progress analytics.

6. **Analytics and reporting**
	- Teacher analytics dashboard for course-level metrics.
	- Course-specific analytics tab includes enrollment, completion, grading, and module breakdown.
	- Directly supports objective of data-informed teaching decisions.

7. **Certificates**
	- Certificates generated and displayed for completed learning outcomes.
	- Verifiable listing and downloadable certificate files.

8. **Real-time discussion support**
	- Discussion stream endpoint and message broadcasting support course communication features.

9. **Integrated AI chatbot**
	- In-dashboard assistant for quick support.
	- Includes minimize/expand interaction to avoid interrupting core workflows.

Overall, these features satisfy typical course-project requirements: authentication, role-based access, CRUD data management, analytics, file handling, and production-style full-stack architecture.

## User Guide

> Add screenshots in the indicated places (recommended filenames shown below).

### 1) Sign in and access dashboard
1. Open the app URL.
2. Log in with a valid teacher or student account.
3. You will be redirected to the role-specific dashboard.

**Screenshot suggestion:** `docs/screenshots/login-and-dashboard.png`

### 2) Teacher workflow

#### A. Create and publish a course
1. Go to **Dashboard ¡ú My Courses ¡ú Create Course**.
2. Enter course title/description and save.
3. Open the created course and add modules.
4. Add content, assignments, and quizzes inside modules.
5. Publish the course when ready.

**Screenshot suggestion:** `docs/screenshots/teacher-create-course.png`

#### B. Review submissions
1. Go to **Dashboard ¡ú Submissions**.
2. Use **Pending** tab to open ungraded work.
3. Enter grade + feedback and submit review.
4. Check **Reviewed** tab to confirm graded items.

**Screenshot suggestion:** `docs/screenshots/teacher-submissions-tabs.png`

#### C. View analytics
1. Go to **Dashboard ¡ú Analytics** for platform-level teacher metrics.
2. Open a specific course and select the **Analytics** tab for course-level insights.

**Screenshot suggestion:** `docs/screenshots/teacher-analytics.png`

### 3) Student workflow

#### A. Enroll and learn
1. Browse available courses.
2. Enroll in a course.
3. Open **Dashboard ¡ú My Courses** and continue from the course page.

**Screenshot suggestion:** `docs/screenshots/student-my-courses.png`

#### B. Submit assignments and take quizzes
1. Inside a course, open an assignment and submit required work.
2. Open quizzes and complete attempts.
3. Track status from dashboard pages.

**Screenshot suggestion:** `docs/screenshots/student-assignment-quiz.png`

#### C. Check certificates
1. Open **Dashboard ¡ú Certificates**.
2. View earned certificates and download available files.

**Screenshot suggestion:** `docs/screenshots/student-certificates.png`

### 4) Use chatbot assistant
1. Use the floating chatbot in dashboard pages.
2. Ask questions related to learning/workflow.
3. Minimize or expand the chatbot as needed.

**Screenshot suggestion:** `docs/screenshots/chatbot-minimized-expanded.png`

## Development Guide

### Environment setup and configuration

1. **Prerequisites**
	- Node.js **20 LTS** (recommended for stable Next.js behavior)
	- npm (bundled with Node)
	- PostgreSQL running locally

2. **Install dependencies**
	- Run: `npm install`

3. **Configure environment variables**
	- Copy `.env.example` to `.env`.
	- Set at minimum:
	  - `DATABASE_URL`
	  - `BETTER_AUTH_SECRET`
	  - `BETTER_AUTH_URL`
	  - `NEXT_PUBLIC_APP_URL`

4. **Role/auth considerations**
	- Ensure seed users or test users exist for both `TEACHER` and `STUDENT` roles.

### Database initialization

1. Generate Prisma client:
	- `npm run db:generate`

2. Sync schema to database:
	- `npm run db:push`

3. Seed initial data:
	- `npm run db:seed`

4. (Optional) Inspect DB in Prisma Studio:
	- `npm run db:studio`

If migrations are preferred in your workflow, use `npm run db:migrate` instead of `db:push`.

### Cloud storage configuration

The project supports S3-backed file storage.

1. In `.env`, set:
	- `AWS_ACCESS_KEY_ID`
	- `AWS_SECRET_ACCESS_KEY`
	- `AWS_S3_BUCKET`
	- `AWS_S3_REGION`

2. Keep upload folder conventions used by the app (`courses`, `assignments`, `submissions`, `certificates`, `profiles`).

3. Verify bucket permissions/CORS allow app uploads and file retrieval.

4. For local-only testing, you may keep these values unset if your storage layer has fallback behavior.

### Local development and testing

1. Start development server:
	- `npm run dev`

2. Open:
	- `http://localhost:3000`

3. Recommended manual test checklist:
	- Login/logout for both roles.
	- Teacher: create/publish course, add module/content/assignment/quiz.
	- Student: enroll, submit assignment, attempt quiz.
	- Teacher: grade submission and verify reviewed tab updates.
	- Verify progress bars on dashboard and courses pages.
	- Verify analytics pages/tabs display expected metrics.
	- Verify certificate listing/download behavior.
	- Verify chatbot send/minimize/expand behavior.

4. Build verification:
	- `npm run build`

5. Lint checks:
	- `npm run lint`

## AI Assistance & Verification (Summary)

### Where AI meaningfully contributed

AI tools were used as an implementation assistant in limited, targeted stages:

- **Architecture and workflow exploration:** validating role-based dashboard flow, analytics structure, and feature decomposition before implementation.
- **Database/query implementation support:** drafting and refining Prisma query shapes for nested progress, analytics, reviewed submissions, and certificate eligibility.
- **Debugging support:** identifying and resolving issues such as stale progress logic, route/runtime inconsistencies, and UI regressions (e.g., chatbot and certificate UI behavior).
- **Documentation support:** drafting structured report sections and improving technical clarity.

AI was not used as an autonomous source of truth; outputs were treated as suggestions and reviewed before integration.

### One representative mistake or limitation in AI output

A representative limitation was an initially inconsistent progress model that mixed module-level and assessment-level completion, which produced misleading percentages (e.g., lower completion despite quizzes/assignments being done). The team revised the model to a clearer rule based only on **passed quizzes + completed assignments**.

Detailed examples, prompts, and correction history are documented in **ai-session.md**.

### How correctness was verified

Correctness was verified through standard engineering checks rather than trusting AI output directly:

- **Manual user-flow testing:** teacher and student paths (course creation, enrollment, submissions, grading, analytics, certificates, chatbot behavior).
- **Data validation in application state/database:** checking that progress, completion, and certificate eligibility aligned with persisted records and expected outcomes.
- **Build/type checks:** resolving TypeScript and runtime issues before acceptance.
- **Regression checks:** re-testing related pages after each change (dashboard, course detail, analytics, certificates).

Concrete session-level evidence is referenced in **ai-session.md**.

## Individual Contributions

## Lessons Learned and Concluding Remarks
