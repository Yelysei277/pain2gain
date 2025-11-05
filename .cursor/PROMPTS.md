
# PROMPTS.md — Universal AI Workflow for Pain2Gain

This file defines structured, reusable prompts used in Cursor to build, verify, and refine the Pain2Gain SaaS project.  
Each prompt follows a consistent format and can be applied at any stage of the development flow.

---

## Core Prompts — Task Implementation

**Purpose:**  
Generate complete feature implementations from structured task descriptions in `docs/tasks/*.md`.

---

### **Implement Task from .md File**

Read the assigned task file (`.docs/T0.md`) and generate the full, type-safe implementation.  

- Summarize the objective and deliverables.  
- Implement backend, frontend, and data logic according to `.cursor/rules.md`.  
- Maintain consistent naming, imports, and folder structure.  
- Commit all changes in one coherent step.

---

### **Plan & Explain Before Implementation**

Read the target `.md` task and outline the implementation plan step-by-step.  

- Identify files to modify or create.  
- Describe expected data flow and dependencies.  
- Then proceed to implementation.

**Goal:** Create predictable, transparent AI reasoning before writing code.

---

## Development Prompts — Polishing & Refactoring

**Purpose:**  
Perform project-level refinement: verify, fix, polish, and standardize code and structure.

---

### **Verify and Complete Implementation**

Review all generated code and make sure it fully matches the task requirements and context of this conversation.  

- Add or fix any missing logic, handlers, or integrations.  
- Ensure consistency with the described architecture and data flow.  
- Adjust file or function structure if something is misplaced or incomplete.  

Update all relevant files directly with the corrected implementation.

---

### **Fix & Polish**

Perform a full project-level correction pass:  

- Resolve syntax, import, and TypeScript issues.  
- Remove unused variables, imports, and temporary code.  
- Ensure consistent naming, formatting, and error handling.  
- Verify that all async logic, API calls, and paths are valid.  

💡 Apply all fixes directly — no explanations, only corrected code.

---

### **Final Review & Standardization**

Conduct a final review to ensure production readiness:  

- Confirm everything runs correctly end-to-end.  
- Remove leftover logs and placeholders.  
- Enforce clear, consistent types and structure.  
- Simplify or refactor where possible without changing functionality.  

Deliver a clean, finalized codebase.

---

### **Improve Documentation or Readability**

Review existing comments, docs, and function names for clarity and consistency.  

- Rewrite unclear variable names.  
- Add short descriptive comments to complex logic.  
- Ensure each file is self-documenting and aligns with project tone.  

Focus on clarity, not verbosity.

---

## Analysis Prompts — Project Understanding

**Purpose:**  
Use these to analyze, audit, or explain the state of the codebase.

---

### **Architecture Overview**

Analyze the project structure and summarize:  
- Core modules and dependencies  
- Data flow (backend → frontend → UI)  
- Where logic lives (API, LLM, database)  
- Any weak spots or missing layers  

Deliver a concise, high-level summary.

---

### **Dependency Review**

List and classify dependencies from `package.json`:  
- Core / optional / dev dependencies  
- Potential security or redundancy issues  
- Suggest modern alternatives if any are outdated.  

Goal: keep the stack lean and maintainable.

---

### **LLM Integration Audit**

Review how OpenAI (or Gemini) is integrated.  

- Check prompt structure, temperature, and error handling.  
- Ensure proper token safety and retry logic.  
- Recommend improvements to reliability or output consistency.

---

### **System Performance & Structure Check**

Review for performance bottlenecks and scalability issues.  

- Identify redundant I/O or repeated DB queries.  
- Check API pagination, caching, and error handling.  
- Suggest optimizations without major architectural change.

---

## Data & Content Prompts — Mock Data & Inputs

**Purpose:**  
Generate realistic data and content for testing and demos.

---

### **Generate Mock Reddit Data**

Create a JSON dataset of Reddit-like posts discussing real-world problems.  

Each object should contain:  
```
id, subreddit, title, body, upvotes, num_comments, created_utc
```  

Focus on startup, education, and health communities.

---

### **Generate Mock Product Ideas**

Produce a list of product ideas with structured fields:  
```
title, elevatorPitch, painPoint, topic, score
```  

Vary domains: devtools, finance, wellness, AI, learning.

---

### **Generate Example User Insights**

Generate 5–10 short user quotes describing personal challenges or pain points.  

Use a realistic, conversational tone as seen on Reddit or IndieHackers.  

🎯 Purpose: for testing LLM extraction and scoring logic.

---

### **Create Synthetic Scenarios for Testing**

Generate edge-case examples to test LLM filtering logic:  

- Ambiguous posts (false positives)  
- Repetitive problems (duplicates)  
- Mixed emotional tone (sarcasm or humor)  

Use these to validate “pain detection” robustness.

---

## Workflow Example

A standard Cursor session for Pain2Gain might look like:

1. **Plan:**  
   “Read docs/tasks/T3.md and summarize what needs to be done.”

2. **Implement:**  
   Run the *Core Prompt* to build the feature.

3. **Verify:**  
   Use the “Verify and Complete Implementation” prompt.

4. **Fix:**  
   Run the “Fix & Polish” prompt to finalize all corrections.

5. **Analyze:**  
   Ask for “Architecture Overview” to ensure alignment.

6. **Generate Data:**  
   Use “Mock Reddit Data” for local testing.

7. **Finalize:**  
   Apply the “Final Review & Standardization” prompt before commit.

---

## Key Principle

These prompts are designed as **reusable AI workflows** — not one-off commands.  
The goal is to maintain a consistent, transparent development process  
that integrates AI assistance seamlessly into production-grade work.
