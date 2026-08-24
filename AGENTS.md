# AGENTS.md

Instructions and operational rules for AI agents working in this repository.

## ⛔ CRITICAL SECURITY RULE: Environment Variables & Secrets

- **NEVER access, read, open, cat, grep, or inspect `.env` files** (such as `.env`, `.env.local`, `.env.production`, or any `.env*` file containing real values).
- **NEVER print, expose, or log real environment variable values or secrets** (e.g., API keys, database passwords, auth tokens, secret keys) in tool outputs, terminal commands, chat responses, diffs, or artifacts.
- **ALWAYS reference `.env.example` or schema definitions** (e.g., `backend/app/core/config.py`) when you need to understand expected configuration keys, types, defaults, or environment variable names.

## General Guidelines

- Refer to [CLAUDE.md](file:///Users/safwat/Coding/Projects/side-projects/tijaratk-bot/CLAUDE.md) for architectural overview, commands, and domain guidelines.
- Always preserve codebase integrity and follow existing coding standards.
