# Galaxy admin

The local admin panel edits the portfolio’s real content files. It is separate from the public website and does not use browser-only storage for saved changes.

## Run from your IDE

Open the project on `dev`, then run in the integrated terminal:

```sh
npm run admin
```

Open **http://127.0.0.1:8080/admin/**. The website preview is at **http://127.0.0.1:8080/**. Stop the server with Ctrl+C. Node.js 20 or newer is required; no additional packages are needed.

`npm run dev:portfolio` is an alias for the same server, so either command opens both pages. Run only one at a time. Stop an older preview first if it is already using port 8080. To use a different port on macOS/Linux:

```sh
ADMIN_PORT=8081 npm run admin
```

`npm run dev` still launches the separate Next.js template; the admin manages `vanilla-site`.

## What you can edit

- Website details: name, role, location, hero tagline, biography, contact details, resume PDF, social links.
- Galaxy: title, introduction, default Ordered/Random arrangement, section visibility.
- Categories: names, colors, icons, descriptions, covers, tags, visibility for the existing six planets.
- Projects: add/remove/reorder, title, description, filter label, format, image, video, placeholder status, visibility.
- Skills & learning: skill names, groups, levels, colors, descriptions, learning topics/progress, and widget visibility.
- Experience: add/remove/reorder timeline entries, dates, company, location, tools, achievements.
- Backups: export/import the full content JSON; load an earlier snapshot as a draft.

Click **Save changes** to write `vanilla-site/data/content.json`. Open local previews refresh automatically after a save. Reload the admin page once after updating its code to activate this behavior. Uploads are saved under `vanilla-site/assets/uploads/`; upload image/video/PDF files up to 30 MB. Uploaded files are not automatically removed when a project is deleted, so other references and recovery snapshots keep working.

Direct MP4/WebM links play in the project dialog. Other HTTP(S) video URLs open their original page. Images and projects can remain marked as placeholders until real artwork is ready.

## Recovery and simultaneous edits

Every save keeps the previous JSON in `admin/.backups/`. This directory is ignored by Git and is never part of the public website. The Backups tab displays the most recent 30 snapshots. Loading/importing creates a draft; Save changes applies it. Export a draft before reloading if another panel changed the file: stale saves are rejected instead of overwriting newer content.

## Publishing

Saving updates the local project. Deploy the updated `vanilla-site` files to update the shared website. GitHub Pages continues to deploy from `main`; development stays on `dev`. The existing Sites preview can also be republished from this same static directory. The public site reads the same `data/content.json` and uses the uploaded assets.

The `admin/` directory is outside `vanilla-site` and is **not served by GitHub Pages or the Sites static deployment**. This panel runs on your computer, bound to loopback only, with Host/Origin checks and per-run write tokens. It is not an internet-facing CMS and must not be exposed through a public tunnel. A remotely accessible admin requires server hosting, authentication, and persistent storage.

## Validation

```sh
npm run test:admin
```

Tests use a temporary project, not your website files, and verify content validation, real saves, recovery backups, stale-write conflicts, upload serving, and request access checks.
