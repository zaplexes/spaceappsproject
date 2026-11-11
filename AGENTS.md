# Repository Guidelines

## Agent Instructions & Project Reference

Ask the user whenever a requirement, intended behavior, scope, or implementation approach is unclear, or whenever you are unsure how to perform a task. Explain the uncertainty and ask specific questions before proceeding with work that depends on the answer. Do not silently guess or treat an unanswered question as approval. You may continue independent, clearly understood work while waiting.

Read `Space Apps.docx` in the repository root before planning or implementing project features. Its absolute path is `/home/fles/Documents/spaceappsproject/Space Apps.docx`. Use it as project context alongside the user's instructions. If its contents are ambiguous, conflict with the request, or cannot be read, ask the user before proceeding with affected work. Do not modify the document unless requested.

To read its text without additional dependencies, use Python's `zipfile` and `xml.etree.ElementTree` to extract paragraphs from `word/document.xml` inside the DOCX archive. Inspect embedded images or tables separately when needed to understand the requirements.

## Project Structure & Module Organization

This workspace currently has no application source, tests, assets, or dependency manifests. No readable Git history is available. Treat it as an initial scaffold; do not assume a language, framework, or deployment target.

When adding the first implementation, group application code in `src/`, automated checks in `tests/`, and static resources in `assets/` where appropriate. Document the actual layout in `README.md`. Keep modules focused and organize related code by feature as the project grows.

## Build, Test, and Development Commands

No build, test, or development commands are configured yet. Do not assume commands such as `npm test` or `make build` work.

When introducing tooling, add reproducible dependency installation, local startup, build, and test instructions to `README.md`. Commit the applicable dependency manifest and lockfile, and specify the required runtime version.

## Coding Style & Naming Conventions

Follow the formatter and language conventions selected with the first implementation. Until tooling is established, use consistent indentation within each file, descriptive identifiers, and short, focused functions. Use lowercase, hyphen-separated names for documentation files where appropriate.

Include formatter and lint configuration with the code that introduces them, and document their commands.

## Testing Guidelines

No test framework or coverage threshold is configured. Add tests alongside new behavior using the chosen framework's discovery conventions. Cover expected behavior, boundary conditions, and failure paths. Document how contributors run the suite before requesting review.

## Commit & Pull Request Guidelines

There is no accessible commit history from which to infer conventions. Use concise, imperative commit subjects, such as `Add initial project structure`, and keep each commit focused.

Pull requests should describe the change, its purpose, and verification performed. Link relevant issues and include screenshots for visible interface changes. Explicitly identify any checks that could not be run.

## Security & Configuration

Never commit credentials or local secrets. Provide placeholder values in an example configuration file and document required environment variables when configuration is introduced.
