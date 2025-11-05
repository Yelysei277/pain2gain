
### **File Refactor & Modularization**

Refactor Large Files into Smaller Modules

Inspect all files for size and structure:

- If any file exceeds ~200–300 lines or contains multiple concerns, split it into smaller modules or helpers.
- Group new files logically inside the same folder structure.
- Update all imports and exports accordingly.
- Make sure the CLI entry point still works end-to-end after the split.
    
Implement the refactoring directly — no explanation text, only updated code.