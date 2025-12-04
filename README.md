# Three Daily Challenge

A web application for generating and serving daily challenges, powered by AI.

## Table of Contents

- [Getting Started](#getting-started)
- [Development](#development)
- [Problem Management Workflow](#problem-management-workflow)
  - [Step 1: Add New Problems](#step-1-add-new-problems)
  - [Step 2: Review Problems with AI](#step-2-review-problems-with-ai)
- [Legacy Scripts (Deprecated)](#legacy-scripts-deprecated)

---

## Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

- Node.js
- npm

### Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the root of the project and add your Google AI API key:
    ```
    GOOGLE_API_KEY="your-api-key-here"
    ```

## Development

To run the Next.js application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

---

## Problem Management Workflow

This project uses Genkit flows, executed via `npm` scripts, to manage the lifecycle of problems in the `public/problems_database.json` file.

### Step 1: Add New Problems

This command executes the `generateProblemsFlow`, which generates new problems for each category defined in `src/ai/flows/manage-problems-flow.ts`. The new problems are appended to the database with a `review_status` of `"pending"`.

You must provide the number of problems to generate per category as a JSON string argument.

```bash
# Usage: npm run problems:generate -- '{"countPerTask": <number>}'

# Example: Generate 2 problems for each defined task
npm run problems:generate -- '{"countPerTask": 2}'
```

### Step 2: Review Problems with AI

This command finds all problems with a `"pending"` status and uses an AI agent to review them. The AI will verify the accuracy of each problem and can approve, correct, or reject it. The database is updated with the results.

```bash
# Usage: npm run problems:review
npm run problems:review
```

This streamlined two-step process is the recommended way to maintain and grow the problem database.

## Legacy Scripts (Deprecated)

The project contains legacy Python scripts (`generate_data.py`, `review_problems.py`) and a TypeScript script (`seed-challenges.ts`) that were previously used for data generation. While they are kept for reference, the unified `npm run problems` command is the current and supported workflow.

### generate_data.py

This script was used to generate new problems.

```bash
# Example: Generate 5 new problems
python generate_data.py 5
```

### review_problems.py

This script was used to review pending problems.

```bash
python review_problems.py
```