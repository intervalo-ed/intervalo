<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Named Arguments vs Positional Arguments

ALWAYS prefer named arguments. they scale better and handle optional args way better.

## Code Comments

Only comment complex code which logic can't be easily understood from the code itself.

## File Structure

If a React component file is only used in one place put it alongside the page where it is used (eg: app/onboarding has page.tsx and onboarding-wizard.tsx). If it is used in multiple places, put it in the components folder.

## File Naming

Use kebab-case for React component files and PascalCase for React hooks.

## Output Format

When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision.

