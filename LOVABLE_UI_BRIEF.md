# Market Research Analysis: UI brief

Build the frontend for **Market Research Analysis**, an internal B2B tool. A user describes a product idea; a team of AI agents on our backend researches it, builds a financial model, scores the risks and produces a scorecard; a human reviewer approves the result or sends parts back; the app then issues a **Go / No go / Validate further** recommendation with a downloadable report.

The backend already exists (FastAPI, REST, JSON). Build the frontend only and call the real API described in section 7. Do not mock data, add a database or add your own auth.

A plain working version of this UI exists. This brief describes what it does and where I want the UX to be better. Everything under "Improve" is a request; everything else is behaviour that must be kept.

## 1. Users and tone

- **Analysts and product strategists** start analyses and read the results.
- **Reviewers** (senior people) check the findings and approve or send back.
- **Admins** look at usage and the audit log.

They are reading long, evidence-heavy reports and making an investment decision. The product should feel like a calm, trustworthy research tool: closer to Linear, Stripe Dashboard or Notion than to a marketing site. Dense where it helps, generous whitespace around the verdict, no decorative gradients, no playful illustrations, no emoji.

The core promise of the product is **trust**: every claim is cited, every number is calculated rather than written by an AI, and a person signs off. The UI should make that visible everywhere (source links, verification badges, "calculated" vs "estimated" labels, who reviewed).

## 2. Visual direction

- Warm neutral background (off-white `#f6f5f1`), white cards, 12px radius, hairline borders, very soft shadows.
- One accent colour: teal (`#0f766e`). Use it for primary buttons, active states and progress.
- Semantic colours, each with a soft tint background, used consistently in every badge, chart and banner:
  - Go / verified / completed: green `#15803d`
  - No go / failed / critical: red `#b42318`
  - Validate further / awaiting review / warning: amber `#a15c07`
  - Unknown / neutral: slate `#5b6472`
- Full dark mode with a toggle (default to the system setting).
- Sans-serif UI font (Inter or similar), tabular numerals in every table and metric, monospace for IDs and commands.
- Colour is never the only signal: a status dot always sits next to its text label.
- Accessible: visible focus rings, keyboard navigation for tabs and menus, ARIA roles, WCAG AA contrast.
- Responsive: the sidebar collapses into a drawer below about 900px, two-column forms become one column, wide tables scroll horizontally inside their card.

## 3. App shell

**Top bar**
- Left: logo mark (teal rounded square with four white bars, like a small bar chart), the name "Market Research Analysis" and the tagline "Cited feasibility reports with a scored, human-reviewed recommendation".
- Right: an API status indicator (dot plus "Checking API…" / "API online" / "API offline"), an "API key" button, and a primary "New analysis" button.

**Left sidebar (about 260px, sticky)**
- "Analyses" heading and a scrollable list of runs. Each item shows the project title (clamped to two lines), a status dot with label, and "date · created by". The selected run is highlighted.
- Below a divider: "Internal documents (N)" and "Usage and audit".
- States: loading, empty ("Analyses started in your organisation are listed here."), and an inline error.

**Main area** shows one of four views: New analysis, a single analysis, Internal documents, Usage and audit. If the API is offline, show a warning banner at the top of the main area.

**Improve**
- Add search and a status filter to the run list, and group runs by Today / This week / Earlier.
- Make "Awaiting review" runs stand out, with a count badge, because they are blocked on a person.
- Use skeleton loaders instead of "Loading…" text.
- Use toasts for success and failure of actions, and proper modal dialogs for confirmations (never the browser's `confirm`).

## 4. View: New analysis

A single form card titled "New analysis" with the helper text "Only the project description is required. Anything you leave out is reported as a research gap, not guessed." and a "Fill an example" chip in the corner.

Fields:
- **Project** (required, at least 10 characters): large textarea, placeholder "What it is, who it is for and what problem it solves…".
- **Company** group: Name, Industry, Size (e.g. "2,000 employees"), Existing capabilities (one per line).
- **Project scope** group: Target geography (comma separated), Target customers, Budget (amount with currency), Timeline, Constraints (one per line), Strategic goals (one per line).

Footer: "N internal documents available to the agents. Manage documents" on the left; "Check brief" (secondary) and "Start analysis" (primary) on the right. Both are disabled until the project is long enough.

**Check brief** calls the backend, which returns the fields that are missing and a list of clarifying questions, each with a "why it matters" line. Show them in a "Brief check" section with one optional answer input per question. Answers are sent with the brief. If there are no questions, show "No clarifying questions. The brief is clear enough to analyse." The button then reads "Check again".

**Start analysis** creates the run and navigates straight to it.

**Improve**
- Make the project description the hero of the page, with a character counter and the optional groups collapsed below it, so starting feels like a one-field task.
- Use tag inputs for the list fields (geography, capabilities, constraints, goals).
- Present the clarifying questions as a friendly step between writing and starting, not as extra rows at the bottom of a long form.
- Add a short "What happens next" strip: Research → Risk review → Scorecard → Your review → Report.

## 5. View: a single analysis

This is the most important screen.

**Header**
- Status line: dot, status label (Running, Awaiting review, Completed, Failed, Interrupted), "started {date} by {user}".
- Title: "Feasibility: {company name}" or "Feasibility analysis".
- The project description beneath it.
- Actions: an "Export report" dropdown (PDF, Word, Slides, HTML, Markdown; shows "Preparing…" while downloading, and a note "Marked DRAFT until the analysis is approved." when no decision exists yet) and a "Delete" button (disabled while running, confirms first).

**State banners, below the header**
- **Running:** a progress card titled "Working…" with "This usually takes several minutes. You can leave this page; the analysis keeps running on the server.", a live count of tokens and searches, and the stages:
  1. *Research, in parallel*: eleven agents shown as a grid with "x of 11 done": Market, Customers, Competitors, Trends, Financial analysis, Technical feasibility, Operational feasibility, Legal and compliance, Schedule and resources, Strategic fit, Go-to-market.
  2. *Risk review*: "Challenge the findings and score each risk".
  3. *Scorecard*: "Score twelve dimensions".
  Each step is Done, In progress or Waiting. After approval the stages are *Decision* and *Report*. After a send-back they are *Rework* ("Redo: {sections}"), *Risk review*, *Scorecard*.
- **Failed or interrupted:** a red alert with the error message and a "Resume from the last saved step" button, plus the progress so far.
- **Awaiting review:** the review panel (section 5.6).

**Tabs:** Overview, Financials, Risks, Sections, Details. Results fill in while the run is still going, so every tab needs a "not finished yet" empty state.

### 5.1 Overview
- **Verdict banner**, the visual centrepiece. Eyebrow "Recommendation", a large label (Go / No go / Validate further), a one-line explanation, then "Weighted score 72 of 100 · reviewed by {name}". Tint it with the matching semantic colour.
  - Before approval, show a neutral **Draft** banner instead: "Draft · no recommendation issued. The scorecard currently points to **Go**. A recommendation is only issued once a reviewer approves the analysis." A draft must never look like an issued verdict.
- **Executive summary:** headline, paragraphs, "Next steps" list.
- **Why this recommendation:** rationale (Markdown), then Key evidence, Conflicting evidence, Open questions.
- **Scorecard:** weighted score out of 100 on a bar with markers at 40 ("No go ≤ 40") and 65 ("Go ≥ 65"), the reasons, and a table of dimensions with Score (1 to 5, as five pips), Weight (%) and Rationale. Note: "An agent scores each dimension from 1 to 5. The weighted score and the recommendation are calculated from those scores, not written by an agent."

### 5.2 Financials
- Intro: "All figures are in {currency}, over {n} years. An agent proposes the inputs; every figure here is calculated from them."
- Headline metric tiles: Net present value, Internal rate of return, Payback (all base case), Lifetime value ÷ acquisition cost, Acquisition cost payback (months), Customer lifetime value.
- A warnings box when the model returns warnings.
- Market size tiles: TAM, SAM (top-down), SAM (bottom-up: customers × price), SOM.
- Scenarios table: scenario, NPV, IRR, Payback, Break-even year.
- Projection table by year: Customers, Revenue, Gross profit, Acquisition cost, Fixed costs, Net cash, Cumulative cash.
- Sensitivity table: input, NPV at −20%, NPV at +20%, Swing, largest first.
- "Inputs to the model" table: Input, Value, Basis badge (Company data / Sourced / Estimate / Reviewer edit), Note with source link.
- If the model could not be calculated, show the error and the inputs table only.

**Improve:** add charts next to the tables, keeping the tables available. A cumulative cash line chart with the break-even point marked; a revenue vs costs bar chart by year; a tornado chart for sensitivity; a TAM → SAM → SOM funnel; a grouped comparison of scenarios. Make estimates visually distinct from sourced figures so a reader sees at a glance how much of the model rests on guesses.

### 5.3 Risks
- Intro: "Each risk is scored as probability × impact, both from 1 to 5. 15 or more is critical, 10 or more high, 5 or more medium."
- Counts per level (Critical, High, Medium, Low) as badges.
- Table: risk title, category and description; level badge; "P × I = score"; mitigation.

**Improve:** add a 5×5 probability × impact heat map with the risks plotted on it; clicking a cell filters the list. Allow sorting and filtering by level and category.

### 5.4 Sections
Two panes: a vertical list of sections on the left (the eleven research sections plus Risk analysis), the selected section on the right.

Each section shows:
- The analysis (Markdown, can include wide tables).
- **Evidence:** "x of y claims verified", then one card per claim with a verification badge (Verified / Quote found, figure not found / Quote not found in source / Source could not be read), the claim, the quoted excerpt as a blockquote, and a footer with the source link, source tier (Internal document / Primary / Secondary / Unvetted source), published date and agent confidence %. Internal sources are not clickable.
- Assumptions and Research gaps lists.
- Helper text: "Each quote is checked against the text of its source by matching, not by a model; 'figure not found' can be a false alarm when a number is written in a different format."

**Improve:** show a verified-count indicator beside each section name in the left list; add filters for verification status and source tier; make the reading column a comfortable width with good typography, because this is where people spend the most time.

### 5.5 Details
- **Brief:** everything the user submitted, including answered clarifications.
- **Evidence quality:** evidence items, % verified against source, counts by check and by source type, sections with no verified evidence, how many financial inputs are estimates, and sources flagged for embedded instructions (a security signal; make it noticeable when not empty).
- **About this run:** analysis ID, started, last updated, prompt version, models used with call counts, tokens in and out, model calls, searches and page fetches.

### 5.6 Review panel (status: Awaiting review)
A prominent card titled "Your review is needed": "The scorecard points to **Go**. Check the findings below. Approve to issue the recommendation and write the report, or send parts back to be redone."

- **Approve** (primary): confirm first, because it is final ("The recommendation is issued and cannot be reviewed again.").
- **Send back…** opens a form with two parts:
  1. *Sections to redo:* a checkbox per section; ticking one reveals a required comment box ("What should be fixed or covered?"). Only those sections are researched again; risk and scoring are then redone and the run returns for review.
  2. *Financial inputs to change:* a table of each input with its current value and an optional "New value" number field, plus "Horizon in years". Shares and rates are fractions (0.15 means 15%).
  A footer shows "N changes to send back" with Cancel and Send back. Send back is disabled until there is at least one change, every ticked section has a comment and every number is valid.

**Improve:** keep the review actions reachable while the reviewer reads the tabs (a sticky bar or side panel), since they need to read findings and write feedback at the same time. Let them add a section to the send-back list directly from the Sections tab. Show rates as percentages in the form and convert to fractions when sending.

## 6. Other views

**Internal documents**
- Heading and explanation: "Agents search these alongside the web and cite them as internal sources. PDF, Excel, Word, CSV, text or Markdown, up to 20 MB each. Scanned PDFs without a text layer cannot be read."
- "Upload documents" (multiple files; accepts .pdf .xlsx .docx .csv .txt .md; reject files over 20 MB in the browser).
- Table: Name, Passages, Uploaded, Delete (with confirmation: agents will no longer be able to search it).
- Empty state: "No documents uploaded yet."

**Improve:** a drag-and-drop zone, per-file upload progress and per-file error messages, and file type icons.

**Usage and audit** (admin keys only)
- "Usage by month" table: Month, Analyses, Completed, Tokens.
- "Audit log" table, latest 200 actions: When, User, Action, Target, Detail.
- On a 403, show "Usage and the audit log are only available to admin keys." instead of the tables.

**Improve:** a small trend chart for usage, and search and filters by user and action for the audit log.

**API key dialog**
- Modal with a password field (placeholder `mra_…`), Save and Cancel.
- Text: "Every request to the analysis API needs a key." and "Stored in this browser only and sent with each request."
- Opens automatically, once, with a warning when the API answers 401: "The API rejected this request: the key is missing, wrong or revoked."

**Improve:** make this a friendly first-run screen rather than a dialog that appears over an empty app.

## 7. API and behaviour

Base URL comes from an environment variable (default `/api`). Send `Authorization: Bearer {key}` on every request except `/health`. The key lives in `localStorage`. Errors come back as `{ "detail": "message" }` or `{ "detail": [{ "msg": "..." }] }`; show that message to the user.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | `{ status: "ok" }`; poll every 15 s |
| GET | `/analyses` | List of runs; poll every 10 s |
| POST | `/analyses` | Start a run from a brief; returns `{ id, status }` |
| GET | `/analyses/{id}` | Full run; poll every 3 s while `status` is `running` |
| POST | `/analyses/{id}/review` | `{ approved, comments?, financial_overrides? }` |
| POST | `/analyses/{id}/resume` | Resume a failed or interrupted run |
| DELETE | `/analyses/{id}` | Delete a run |
| GET | `/analyses/{id}/report?format=pdf\|docx\|pptx\|html\|md` | Report file; fetch as a blob with the auth header, then save |
| POST | `/intake` | Brief check; returns `{ missing_fields, questions: [{ question, why_it_matters }] }` |
| GET / POST / DELETE | `/documents`, `/documents/{name}` | List, upload (multipart field `file`), delete |
| GET | `/usage`, `/audit` | Admin tables |

Things to preserve:
- The current view is in the URL (`?run={id}`, `?view=documents`, `?view=admin`) so reload, back and shared links work.
- The run list endpoint does not return the project text. Remember each run's title in `localStorage` when the run is started or opened, and fall back to "Analysis {first 8 characters of the id}".
- Run statuses: `running`, `awaiting_review`, `completed`, `failed`, `interrupted`.
- Every part of a run's `results` can be missing while it is running. Never show a blank panel or crash; show the empty state.
- Missing numbers display as "n/a"; a payback that never happens displays as "Not within horizon".
- Never display a number or a recommendation that the API did not return.

The exact TypeScript types for every request and response are in the attached `api.ts`. Use them as they are.
