# Haitham Boghdady — Design Galaxy

Work on the `dev` branch. From the repository root, run `npm run admin` (or `npm run dev:portfolio`) with Node.js 24.

- [Portfolio preview](http://127.0.0.1:8080/)
- [Owner admin](http://127.0.0.1:8080/admin/)

Repository layout:

| Folder | Purpose |
| --- | --- |
| [`portfolio/site/`](portfolio/site/) | Public website pages, styles, scripts, and assets |
| [`portfolio/admin/`](portfolio/admin/) | Owner editor, SQLite server, and regression tests |
| [`legacy/next-template/`](legacy/next-template/) | Original Next.js template, kept separately |
| `.portfolio-data/` | Private local SQLite database and uploaded content; ignored by Git |
| `.github/` and `.openai/` | Publishing configuration |

Use the [admin guide](portfolio/admin/README.md) for content editing, backups, and hosting. Run `npm run test:admin` to check the active site and editor. The root `dev` and `build` scripts still target the original Next.js template.
