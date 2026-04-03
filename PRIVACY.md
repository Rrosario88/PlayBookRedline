# Privacy and Data Retention Policy

Last updated: 2026-04-03

## Overview
PlayBookRedline is designed for sensitive legal-document workflows. The current deployment is configured with a privacy-first default: uploaded contract and playbook files are processed in memory for analysis and are not intentionally persisted by the application after the request completes.

## What data is processed
When a user uses PlayBookRedline, the system may process:
- uploaded contract files
- uploaded playbook files
- extracted text from those files
- clause-by-clause analysis results
- edited redline text entered by the user
- exported DOCX content generated from the analysis
- basic infrastructure logs necessary for security and operations

## Current retention model
### Uploaded source files
Current behavior:
- uploaded PDF and DOCX files are received in application memory
- files are parsed in memory
- files are not intentionally stored in the application database
- files are not intentionally written to a permanent uploads directory by the app
- once request processing finishes, upload buffers are discarded

### Extracted text
Current behavior:
- extracted text is used transiently during the active request/analysis flow
- extracted text is not intentionally persisted in an application database by default

### Analysis results
Current behavior:
- analysis results are returned to the client
- they are not intentionally persisted server-side by default
- if the user downloads exported output, the retained copy is on the user side unless explicit server-side storage is added later

### Exported DOCX
Current behavior:
- exported DOCX files are generated in memory and streamed back to the client
- they are not intentionally archived server-side by default

### Logs
Operational components may generate logs such as:
- reverse proxy / container logs
- service startup and health logs
- security logs such as SSH and fail2ban events

These logs are for operational and security purposes, not matter management. Users should assume that standard server and container logs may contain timestamps, IP addresses, and error details.

## LLM processing
If an Anthropic API key is configured, clause text and playbook text may be sent to Anthropic for analysis. That means:
- uploaded legal text may leave this VPS for model inference
- handling of that data is also subject to Anthropic's policies and the operator's account configuration

If no Anthropic API key is configured, the application uses a local heuristic fallback analysis path instead of external LLM calls.

## Security posture supporting privacy
Current deployment protections include:
- HTTPS via Caddy and Let's Encrypt
- restricted public ports: 22, 80, 443 only
- backend not directly exposed publicly
- SSH hardened for key-only administration
- UFW enabled
- fail2ban enabled for SSH

## Recommended legal/privacy operating model
For sensitive legal workflows, recommended default policy is:
- do not retain original uploaded documents unless explicitly required
- do not persist extracted text by default
- retain only minimal operational logs
- store only user-approved work product if a saved-matters feature is introduced later
- clearly disclose external LLM processing when enabled

## If persistence is added later
If the product is extended with user accounts, saved matters, or collaboration, retention policy should distinguish between:
- original uploaded files
- extracted text
- AI analysis results
- user-edited redlines
- audit logs
- deleted matter retention windows

Recommended future controls:
- explicit matter save/delete actions
- configurable retention windows
- at-rest encryption for persisted content
- role-based access controls
- audit trail for document access and exports
- optional storage of analysis only, without raw originals

## Operator guidance
If you operate this deployment for real users, you should also add:
- a user-facing privacy notice in the app UI
- terms of use
- a documented retention schedule
- breach/contact process
- policy review for privilege/confidentiality obligations applicable to legal practice

## Summary
Current default retention posture:
- uploads: transient, memory-only processing
- extracted text: transient by default
- analysis results: not persisted by default
- exports: generated and returned, not intentionally archived by default
- logs: minimal operational/security logs may still exist
