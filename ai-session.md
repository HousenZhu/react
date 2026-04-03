# AI Interaction Record 

## Session 1: AI Chatbot Integration

### Prompt (you sent to AI)

most data are storged in postsql server. educational content files are uploaded to cloud using AWS. how to make this ai chatpot Personalized

### AI Response (trimmed)

right now your chatbot is just a generic LLM wrapper. To make it personalized, you need to connect it to your PostgreSQL data + AWS content and give it context about the specific user.

Think of it like this:

❌ Current: “AI answers generally”
✅ Target: “AI answers based on this student, this course, this progress, this content”

🔑 Core Idea: Retrieval-Augmented Personalization (RAG)

Instead of training a model, you:

Fetch relevant user + course data
Fetch relevant content (PDFs/videos summaries)
Inject into prompt
Let LLM generate personalized answer

### What Your Team Did With It

From our system, we use PostgreSQL to store data like:
    User profile (role, enrolled courses)
    Progress (completed modules, scores)
    Assignments + submissions
    Quiz performance
    Deadlines

We created context builder file to build PostgreSQL context and then pluged into our AI API. In this way AI can have a good grasp of background knowledge about the current interacting user, so that it can make personalized suggestions and adaptive explanations

---

## Session 2: Fixing Inconsistent Progress Calculation

### Prompt (you sent to AI)

I calculate student progress using modules, quizzes, assignments. progress is incorrect (shows 40% when all quizzes and assignments are done). Check our design progress calculation logic below:

### AI Response (trimmed)

What was incorrect or misleading:

The suggested model mixed module-level completion with assessment-level completion, leading to misleading results.
It assumed modules themselves could be meaningfully “completed,” which did not match our system design.

### What Your Team Did With It

Replaced the logic with a simpler and more accurate rule:
    Progress = based only on passed quizzes + completed assignments

Verified correctness by:
    Testing multiple student scenarios (no submissions, partial completion, full completion)
    Cross-checking database records (submissions, grades)
    Ensuring progress updates correctly after grading
