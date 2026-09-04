# KnowledgeFlow — Paid Development Milestone

## Hiring Task for Atlassian Forge Developer

---

## Overview

We are building **KnowledgeFlow**, a knowledge capture and expert Q&A workflow app for **Confluence Cloud**, distributed through the **Atlassian Marketplace**.

This is a paid milestone task. You will build the core foundation of the app. If your work meets our standards, you will be offered an ongoing developer role to continue building KnowledgeFlow and other Atlassian Marketplace apps.

**Budget:** 10,000 BDT (fixed payment upon submission)
**Deadline:** 10 calendar days from task assignment
**Stack:** Atlassian Forge, Custom UI (React), Forge SQL


---

## What KnowledgeFlow Does

When someone in an organization has a question that isn't answered by existing Confluence documentation, they post it through KnowledgeFlow. The app routes the question to the right subject-matter expert based on topic tags, tracks the response, and when the expert answers, the Q&A pair can be converted into a permanent Confluence FAQ page.

**This milestone covers the core Q&A workflow only.** AI features, SLA tracking, analytics, and advanced features are out of scope.

---

## Deliverables

### 1. Forge App Foundation

- [ ] Working Forge app using **Custom UI** (not UI Kit)
- [ ] Proper `manifest.yml` with all required modules, permissions, and scopes
- [ ] **Forge SQL** database with the schema described below
- [ ] App deploys successfully to a Confluence Cloud development site
- [ ] Clean project structure following Forge best practices

### 2. Confluence Space Page Module — "Space Q&A Board"

A dedicated page within each Confluence space where users can see all questions related to that space.

**Displays:**
- List of all questions in the current space, sorted by newest first
- Each question shows: title, author, topic tags, status (Open / Answered / FAQ Published), date posted
- Filter by status (All / Open / Answered / FAQ Published)
- Filter by topic tag
- "Ask a Question" button that opens the question submission form

### 3. Ask a Question Flow

**Form fields:**
- Question title (required, max 200 characters)
- Question body / context (optional, supports basic text — no rich text editor required)
- Topic tags (select from existing tags, multi-select)
- The space key is automatically captured from the current Confluence space

**On submit:**
- Question is saved to Forge SQL
- The app identifies which expert(s) are assigned to the selected topic tags
- Question status is set to "Open"
- The assigned expert receives an **in-app flag notification** (Forge `requestConfluence` to the notifications API, or use Forge's built-in notification mechanism) informing them a new question has been assigned to them
- If no expert is assigned to the selected topics, the question is still created with status "Open" and tagged as "Unassigned"

### 4. Answer a Question Flow

**When an expert (or any user) opens a question:**
- Full question is displayed (title, body, author, date, tags, status)
- If the question has answers, they are displayed below
- Any user can submit an answer (text input, no rich text required)
- The question author can mark one answer as "Accepted"
- When an answer is accepted, the question status changes to "Answered"

### 5. Admin Configuration Panel

A **Forge Admin Page** (accessible from Confluence Administration > Apps) where a Confluence admin can:

- **Manage Topics:** Create, rename, and delete topic tags
- **Manage Expert Assignments:** Assign Confluence users as experts for specific topics. One user can be expert for multiple topics. One topic can have multiple experts.
- **Set default space** for FAQ page generation (text input for space key)

### 6. Confluence Global Page — Dashboard (Basic)

A global page accessible from the Confluence Apps menu showing:

- Total questions count (all spaces)
- Open questions count
- Answered questions count
- List of the 10 most recent questions across all spaces (clickable, linking to the space Q&A page)
- List of top 5 experts by number of answers given

### 7. FAQ Page Generation (Basic)

When a question has an accepted answer, a "Publish as FAQ" button appears (visible to the question author and admins only).

**On click:**
- The app creates a new Confluence page in the configured FAQ space
- Page title: the question title
- Page body: the question body followed by a horizontal rule followed by the accepted answer
- The page is created using the Confluence REST API via Forge's `requestConfluence`
- The question status changes to "FAQ Published"
- The Confluence page URL is stored in the database

---

## Database Schema (Forge SQL)

Use these tables. You may add indexes or minor adjustments, but the core structure should match.

```sql
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE experts (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  space_key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  author_account_id TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  -- 'open', 'answered', 'faq_published'
  assigned_expert_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE question_topics (
  question_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  PRIMARY KEY (question_id, topic_id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE answers (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  body TEXT NOT NULL,
  author_account_id TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  is_accepted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE faq_pages (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  answer_id TEXT NOT NULL,
  confluence_page_id TEXT NOT NULL,
  confluence_page_url TEXT,
  space_key TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (answer_id) REFERENCES answers(id)
);

CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## Technical Requirements

- **Forge Custom UI** — not UI Kit. Use React for the frontend.
- **Forge SQL** — not Forge Storage. SQL is required for query flexibility.
- **Forge Resolvers** — all backend logic goes through resolvers. The frontend communicates with the backend exclusively via `invoke()` / `requestConfluence()`.
- **Error handling** — graceful error states in the UI (loading states, empty states, error messages). No unhandled promise rejections.
- **Code quality** — clean, readable code. Meaningful variable names. Comments where logic is non-obvious.

---

## What We Evaluate

| Criteria | Weight | What we look for |
|---|---|---|
| **Functionality** | 35% | Does the app work? Can we deploy it and use all features? |
| **Code quality** | 20% | Clean structure, separation of concerns, error handling |
| **Forge competence** | 20% | Correct use of manifest, resolvers, Custom UI bridge, SQL, permissions |
| **UI/UX** | 15% | Does it look reasonable? Functional layout, loading states, clear user flow |
| **Communication** | 10% | Did you ask clarifying questions? Did you flag blockers early? Were your updates clear? |

---

## Submission Requirements

1. **GitHub repository** — share access with us (private repo is fine)
2. **README** with:
   - Setup instructions (how to deploy to a Confluence dev site)
   - Any assumptions you made
   - Any features you did not complete and why
   - Approximate time spent on each deliverable
3. **Working deployment** — the app should be deployed to your Atlassian developer site so we can test it. Provide the site URL.
4. **Short screen recording** (3–5 min, Loom or similar) walking through the app: asking a question, expert answering, publishing FAQ page, admin config. This is required even if you provide a live deployment — it proves the app works on your end and lets us review without deployment issues.

---

## Important Notes

- **AI tools are allowed.** We expect you to use Claude, Copilot, or similar tools to accelerate development. What matters is the final result and your ability to understand and debug the code.
- **Ask questions.** You can reach us with questions at any time. We will respond within 24 hours on weekdays. If something is unclear, ask before assuming. We prefer smart, specific questions over wrong assumptions. However, all answers to common questions are already covered in this document — please read it thoroughly before asking.
- **Communicate proactively.** If you encounter a blocker or realize you won't complete something within the deadline, tell us immediately.
- **Focus on functionality over polish.** A working app with basic styling beats a beautiful app that doesn't fully work.
- **Submit early if you finish early.** There is no bonus for using all 10 days. If you're done on day 5, submit on day 5.
- **Time tracking.** Track your hours honestly. We trust you. If a specific part took longer than expected, tell us why — that's useful information.

---

## Out of Scope (Do NOT build these)

- AI duplicate detection
- AI auto-tagging
- AI answer quality suggestions
- SLA tracking and escalation
- Weekly digest emails
- Knowledge gap detection
- Rich text editor (basic text input is fine)
- FAQ Display macro (Confluence macro)
- Content byline item
- Mobile optimization

---

## Getting Started

1. Set up your own [Atlassian Developer Account](https://developer.atlassian.com/) — this is free and includes a full Confluence Cloud development site
2. Create a Confluence Cloud development site from your developer account (e.g., `yourname.atlassian.net`)
3. Install the [Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/)
4. Create a new Forge app with Custom UI
5. Read the [Forge SQL documentation](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-sql/)
6. Start building

Good luck. We look forward to reviewing your work.
