# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Quest** is a Jira Clone for Project and Task Management. This workspace contains project documentation and will house the codebase as development progresses.

## Workspace Structure

This project follows the Obsidian vault conventions from the parent `ClaudeNotes` vault:

| File | Purpose |
|------|---------|
| `__init.md` | Project description and overview |
| `__todo.md` | Task tracking (create as needed) |
| `docs/` | Structured documentation |
| `CLAUDE.md` | This file - Claude Code guidance |

## Documentation Notes

- Use `[[wiki links]]` for cross-referencing between notes
- Use Obsidian callouts for important information: `> [!note]`, `> [!warning]`, `> [!tip]`
- Screenshots and diagrams can be embedded with `![[filename.png]]`

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js
- **Styling:** Tailwind CSS + shadcn/ui
- **Language:** TypeScript

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Database commands
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open database GUI

# Build & lint
npm run build
npm run lint
```

## Project Structure

```
quest/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities (db, auth, etc.)
│   └── server/           # Server-side code (actions, queries)
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Deployment

- **Hosting:** Vercel (connected via GitHub)
- **Auto-deploy:** Pushing to `main` triggers automatic production deployment
- **Preview deployments:** Pull requests get automatic preview URLs

No manual deployment steps required - just push to main.

## Key Patterns

- Use Server Components by default, Client Components only when needed
- Server Actions for mutations, direct DB queries for reads in Server Components
- Colocate components with their routes when page-specific
- Use `@/` path alias for imports from `src/`
