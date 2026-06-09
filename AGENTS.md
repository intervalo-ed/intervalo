## Vendored Repositories

This project vendors dependency repositories under @dep-repos/

- Use vendored repositories as read-only reference material when working with related libraries
- Prefer examples and patterns from the vendored source code over generated guesses or web search results
- Do not edit files under @dep-repos/
- Do not import from @dep-repos/ - application code should continue importing from normal package dependencies

When writing Effect code, always read @dep-repos/effect/LLMS.md and inspect @dep-repos/effect/ for examples of idiomatic usage, tests, module structure, and API design. Treat it as the source of truth for Effect patterns.
