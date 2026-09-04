# KnowledgeFlow

KnowledgeFlow is a Confluence Cloud Forge Custom UI app for capturing questions within a Confluence space, routing them to topic experts, accepting answers, and publishing accepted answers as FAQ pages.

## Demo videos

- [KnowledgeFlow demo: Part 1](https://www.loom.com/share/7321da08bd8a4cedbf318d47e727c4ad)
- [KnowledgeFlow demo: Part 2](https://www.loom.com/share/52d8bd7751404aab97cd0955cdcb61cb)

## Features delivered

- Space Q&A board with newest-first questions, status/topic filters, and question submission.
- Topic-aware expert assignment, including support for multiple experts on one topic.
- Question detail view, answers, and author acceptance of an answer.
- Expert assignment notifications while the expert has KnowledgeFlow open.
- Confluence administration page for topic, expert, and FAQ-space configuration.
- Dashboard with question totals, the ten newest questions, and leading experts.
- FAQ-page generation in the configured Confluence space, with the generated page URL stored against the question.

## Prerequisites

- Node.js 22 or later.
- npm.
- Forge CLI installed globally and authenticated with the Atlassian account that owns the Forge app:

  ```powershell
  npm install -g @forge/cli
  forge login
  ```

- A Confluence Cloud development site and permission to install Forge apps on it.

## Deploy to a Confluence development site

Run every Forge command from this repository root.

**Working development site:** https://farhanisrakyen29.atlassian.net

1. Install the backend and Custom UI dependencies:

   ```powershell
   npm install
   npm --prefix static/knowledgeflow install
   ```

2. Validate formatting, linting, and the production frontend build:

   ```powershell
   npm run check
   forge lint
   ```

3. Deploy to the Forge development environment:

   ```powershell
   forge deploy --non-interactive -e development
   ```

   If Forge asks for approval after a manifest permission change, re-run with the approval name shown in the prompt, for example:

   ```powershell
   forge deploy --non-interactive -e development --approve MAJOR_VERSION_RULE
   ```

4. Install the development deployment into Confluence:

   ```powershell
   forge install --non-interactive --site <your-site>.atlassian.net --product confluence --environment development
   ```

   Use the same command with `--upgrade` only after changing scopes or external/egress permissions:

   ```powershell
   forge install --non-interactive --upgrade --site <your-site>.atlassian.net --product confluence --environment development
   ```

5. In Confluence, configure the app:

   - Open a space, then choose **Apps → KnowledgeFlow Q&A**.
   - Open **Confluence administration → Apps → KnowledgeFlow administration**.
   - Create topics, assign experts, and enter the FAQ destination **space key** (for example, `FAQ`).

Forge SQL tables are created automatically on the app's first backend request.

### Production deployment

After testing in development, deploy to production with:

```powershell
forge deploy --non-interactive -e production
```

Install/upgrade the production environment on the target site in the same way, replacing `development` with `production`.

## Testing the core workflow

1. As an administrator, create a topic and assign an expert.
2. In a Confluence space, create a question using that topic.
3. Open the question and submit an answer from any user account.
4. As the question author, accept that answer.
5. Configure a destination FAQ space, then publish the accepted answer as an FAQ.

Questions on a Space Q&A Board are intentionally limited to the Confluence space currently being viewed. The dashboard is the cross-space view.

## Assumptions

- The administrator enters a Confluence **space key**, not a numeric space ID, for the FAQ destination. This matches the Confluence page-create API and makes configuration easier to verify.
- Any signed-in Confluence user may answer a question; only the question author can accept an answer.
- FAQ publishing is available to the question author and Confluence administrators.
- A question can be tagged with multiple topics. If multiple experts match, all matching experts are notified; the first matching expert is stored as the displayed assignee.
- Notifications are live in-app flags. The assigned expert must have a current KnowledgeFlow page open to receive one. They are not a persistent inbox, email, or mobile notification.
- The app is installed for a single Confluence customer site. To test with a second Atlassian account, the Forge app must be shared/installed for that account and site through the Forge developer console.

## Approximate time spent

These are implementation estimates and can be adjusted to match final tracked hours.

| Deliverable | Approximate time |
| --- | ---: |
| Forge foundation, manifest, Forge SQL schema, and deployment setup | 1 hour |
| Space Q&A board and question submission | 2 hours |
| Answers, acceptance flow, and status handling | 1 hour |
| Administration: topics, experts, FAQ-space configuration | 1.5 hours |
| Dashboard and cross-space navigation | 1 hour |
| FAQ page generation and storage | 1 hour |
| Notifications, error handling, formatting, testing, and deployment troubleshooting | 1.5 hours |
| **Total** | **9 hours** |

## Project structure

```text
src/resolvers/                 Forge resolver modules and SQL access
static/knowledgeflow/src/      Custom UI React application
manifest.yml                   Forge modules, resources, and scopes
```

## Useful commands

```powershell
npm run format         # Format JavaScript and JSX
npm run check          # Check formatting, lint, and build
forge lint             # Validate Forge configuration
forge logs -e development -n 100  # Review recent development logs
```
