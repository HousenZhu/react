# AI Interaction Record (ai-session.md)

## Session 1: Fixing Inconsistent Progress Calculation

### Prompt (you sent to AI)

We calculate student progress using modules, quizzes, and assignments.
Right now progress seems incorrect (e.g., shows 40% even when all quizzes and assignments are done).

Our schema includes:
- Course → Module → Quiz / Assignment
- Submission and grading data

How should we design progress calculation logic?

### AI Response (trimmed)

AI suggested combining:
- module completion
- quiz completion
- assignment completion

and averaging them into a percentage score.

### What Your Team Did With It

- **What was useful:**
  - Helped identify that progress logic should be based on measurable completion criteria.
  - Highlighted that multiple factors (modules, quizzes, assignments) need to be considered.

- **What was incorrect or misleading:**
  - The suggested model mixed **module-level completion** with **assessment-level completion**, leading to misleading results.
  - It assumed modules themselves could be meaningfully “completed,” which did not match our system design.

- **What we changed and how we verified:**
  - Replaced the logic with a simpler and more accurate rule:
    - Progress = based only on **passed quizzes + completed assignments**
  - Verified correctness by:
    - Testing multiple student scenarios (no submissions, partial completion, full completion)
    - Cross-checking database records (submissions, grades)
    - Ensuring progress updates correctly after grading


---

## Session 2: Debugging Dashboard / UI State Issue

### Prompt (you sent to AI)

<copy/paste>

Our Next.js dashboard sometimes does not update after submitting assignments or grading.
We are using server actions and client components.

What could cause stale UI state or inconsistent updates?

### AI Response (trimmed)

AI suggested possible causes:
- stale client-side state
- missing revalidation after server actions
- incorrect use of server vs client components
- caching issues

### What Your Team Did With It

- **What was useful:**
  - Helped narrow down likely causes (especially **missing revalidation** and stale state).
  - Pointed to areas to investigate instead of randomly debugging.

- **What was incorrect or not directly applicable:**
  - Some suggestions assumed patterns (e.g., specific caching configs) that were not used in our project.
  - Not all proposed fixes applied to our architecture.

- **What we changed and how we verified:**
  - Ensured server actions triggered proper data refresh (re-fetch / re-render).
  - Reviewed component boundaries (server vs client).
  - Verified fixes by:
    - Re-running full workflows (submit → grade → dashboard update)
    - Checking UI consistency across navigation and refresh
    - Confirming no stale data remained

---

## Session 3: Designing Certificate Generation Flow

### Prompt (you sent to AI)

<copy/paste>

We want to generate certificates when a student completes a course.
Requirements:
- validate completion
- generate PDF
- store in cloud storage
- allow download

What is a good backend flow?

### AI Response (trimmed)

AI suggested:
- verify completion conditions
- generate PDF server-side
- upload to storage
- store reference in database
- return download link

### What Your Team Did With It

- **What was useful:**
  - Provided a clear **step-by-step backend flow**.
  - Helped structure the implementation into validation → generation → storage → retrieval.

- **What needed adaptation:**
  - AI did not consider our exact schema or progress logic.
  - Storage/security details needed to be aligned with our cloud setup.

- **What we implemented and how we verified:**
  - Implemented certificate generation using:
    - completion check based on quizzes + assignments
    - server action to generate PDF
    - upload to cloud storage
    - store certificate record in PostgreSQL
  - Verified correctness by:
    - Testing edge cases (incomplete vs completed course)
    - Ensuring certificates only generate when criteria are met
    - Validating download and storage behavior
  