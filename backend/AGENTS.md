# AGENTS.md

Instructions and operational rules for AI agents working in `backend/`.

## ⛔ CRITICAL SECURITY RULE: Environment Variables & Secrets

- **NEVER access, read, open, cat, grep, or inspect `.env` files** (such as `.env`, `.env.local`, `.env.production`, or any `.env*` file containing real values).
- **NEVER print, expose, or log real environment variable values or secrets** (e.g., API keys, database credentials, auth tokens, secret keys) in tool outputs, terminal commands, chat responses, diffs, or artifacts.
- **ALWAYS reference `.env.example` or schema definitions** (e.g., `app/core/config.py`) when you need to understand expected configuration keys, types, defaults, or environment variable names.

## 🚨 CRITICAL RULE: Mandatory Frontend & Backend Lint Checks

- **NEVER perform or conclude any changes without running lint checks for BOTH Frontend (FE) and Backend (BE) to make sure ALL files have NO lint errors.**
- **Before completing any task, you MUST run:**
  1. **Backend Lint**:
     ```bash
     make lint
     # or: uv run ruff check .
     ```
  2. **Frontend Lint**:
     ```bash
     pnpm -C ../frontend lint
     ```
- **Zero Tolerance for Lint Errors**: All reported lint errors must be resolved before presenting changes or finishing execution.

## General Guidelines

- Refer to `CLAUDE.md` in the repository root for architectural overview, commands, and domain guidelines.
- Always preserve codebase integrity and follow existing coding standards.
