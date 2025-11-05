# 🧠 Universal AI Workflow for Pain2Gain

This repository defines **structured, reusable AI commands** for the entire software development lifecycle in Cursor.

Each command lives in the `commands/` directory and follows a consistent naming format:
```
/{group}-{title}-{iteration?}
```
For example:  
`/poly-lg-2` — the second polishing step for large tasks (fix & consistency pass).

---

## 🗂️ Command Reference

| Group | Examples | Purpose |
|--------|-----------|----------|
| 🧩 **Development** | `/dev-plan`, `/dev-impl` | Task planning and implementation |
| 🪶 **Small Tasks** | `/poly-sm` | Fast polish for 1–2 files |
| ⚙️ **Medium Tasks** | `/poly-md-1`, `/poly-md-2`, `/poly-md-3` | Verify or polish isolated modules |
| 🧱 **Large Tasks** | `/poly-lg-1`, `/poly-lg-2`, `/poly-lg-3`, `/poly-lg-4`, `/poly-lg-5` | Multi-module or project-wide passes |
| 🧪 **QA** | `/qa-cover`, `/qa-fix` | Automated testing and coverage validation |
| ⚡ **Optimization** | `/optimize`, `/audit` | Performance and security improvements |
| 📘 **Docs** | `/doc-comments`, `/doc-readme` | Documentation generation and updates |
| 🚀 **Ops** | `/ops-predeploy` | Pre-deployment validation and cleanup |

---

## ⚙️ Standard Workflow

A typical end-to-end Cursor workflow for a development task:

1. **Plan** — `/dev-plan ./docs/T3.md`  
   → Generate an implementation plan from the task description.  

2. **Develop** — `/dev-impl ./docs/T3.md`  
   → Implement backend, frontend, and data logic.  

3. **Verify** — `/poly-md-1`  
   → Ensure the implementation fully matches the requirements.  

4. **Fix & Polish** — `/poly-md-2`  
   → Resolve issues and enforce consistency.  

5. **Review** — `/poly-md-3`  
   → Final cleanup and code standardization.  

6. **Test** — `/qa-cover`  
   → Ensure coverage and generate missing tests.  

7. **Optimize** — `/optimize`  
   → Improve performance and efficiency.  

8. **Document** — `/doc-readme`  
   → Generate or update README / TechSpec.  

9. **Deploy** — `/ops-predeploy`  
   → Validate build, configuration, and readiness for release.  

---

## 🔄 Recommended Chains

### 🪶 Small Task Flow
```
/dev-impl → /poly-sm → /qa-cover → /doc-comments
```

### ⚙️ Feature Development Flow
```
/dev-plan → /dev-impl → /poly-md-1 → /poly-md-2 → /poly-md-3 → /qa-cover → /doc-readme
```

### 🧱 Release Flow
```
/poly-lg-5 → /optimize → /audit → /ops-predeploy
```

These chains can be executed manually or automated through task scripts for rapid, consistent AI-assisted development.

---

## 🧭 Notes

- All commands are **self-contained Markdown prompts** located in `/commands`.  
- Each file follows the unified structure:  
  - `Purpose`  
  - `When to Use`  
  - `Instructions`  
  - `Output`  
  - `Notes`  
- Commands can be chained or used independently.  
- The `/poly-*` series forms the **core polishing pipeline**.  
- Keep this file updated as the central index for your AI-driven workflow.

---

> 🧱 **All commands are stored in `/commands`** — each file contains a standalone, production-ready prompt for Cursor.
