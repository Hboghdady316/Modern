# Galaxy admin and portfolio server

## Run on dev

Use Node.js 24 LTS and start one server from the repository root:

```sh
npm run admin
```

Open [Admin](http://127.0.0.1:8080/admin/) and [Website](http://127.0.0.1:8080/). If an older server is running, stop it in its terminal and restart. `npm run dev:portfolio` starts the same server. `npm run dev` is the separate Next.js template. Set `ADMIN_PORT=8081` to use another local port.

## Owner walkthrough

1. Sign in. The local preview only listens on this computer; if an owner password is configured it is required.
2. In **Projects**, choose a category and project. Add a title and description, use **Choose a cover image**, and set **Show on website** to **Ready to show when I publish**. Use **More photos** to add gallery or process images from your computer. Video, case study fields, and credits are under **More project options**.
3. **Preview** saves your edits privately and opens a preview. **More tools → Save draft** keeps edits private without opening a preview. **Publish changes** makes the current content visible on this server when the public website is refreshed. Visible categories show a planet even before any work is published. Archived projects, hidden projects, and placeholders stay off the public website.
4. Under **Website details → More website settings**, use **Add service** and **Remove** to edit the service cards. Qualifications and testimonials have their own cards, along with the sharing image picker, Galaxy options, and homepage switches. Upload only a public CV that does not contain the owner's phone number. To unpublish a project, turn off visibility or mark it archived, then publish. To restore an earlier editable state, use **Backups & transfer** and review before publishing.

## Storage and recovery

- SQLite owns drafts, published documents, recovery snapshots, uploaded media and aggregate counts. On first run it imports the checked-in seed; subsequent starts do not overwrite the database. Existing legacy image references can be read from the checkout; new uploads are SQLite BLOBs.
- Default storage is `.portfolio-data/portfolio.sqlite`. It is outside the web root and ignored by Git. Set `PORTFOLIO_DATA_DIR` to a private persistent directory in production. Use one server instance per database.
- To make a full backup, stop the service and copy the persistent data directory, plus any legacy uploads used by the deployment. Store encrypted backups outside the host and test recovery on a separate instance. To restore, stop the service, keep a copy of the current database, replace the data directory with the backed-up directory, restore file ownership, then restart and verify private and public views.
- The editor offers content JSON export and snapshot restore. JSON export alone does not include media bytes. Unpublishing makes uploads unavailable to visitors when no other published content references them; it does not erase them from recovery history.

## Production handover

The existing static preview and GitHub Pages cannot run this Node/SQLite app. SQLite is the default for this single-server portfolio. Reconsider PostgreSQL if deployment requires multiple app servers sharing one database or sustained concurrent writes. Deploy to a Node 24 host with a persistent disk and an HTTPS reverse proxy on the same machine. Proxy the canonical Host over to the loopback listener. Set secrets through the host configuration; never commit them.

| Setting | Purpose |
| --- | --- |
| `PUBLIC_ORIGIN` | Canonical HTTPS origin, without a trailing slash. Enables secure cookies, canonical URLs and the sitemap. |
| `ADMIN_PASSWORD` | Unique owner password, at least 16 characters in hosted mode. No registration. For recovery, rotate it in the host secret settings and restart; restart revokes all sessions. |
| `PORTFOLIO_DATA_DIR` | Persistent private storage path, separate from public assets. |
| `INQUIRY_WEBHOOK` | HTTPS mail integration that sends the provided `to`, `replyTo`, `subject`, `message`, and inquiry fields. Return success only after accepting delivery. Without this setting the form reports unavailable and offers email. |
| `INQUIRY_WEBHOOK_TOKEN` | Optional bearer secret for the mail integration. |

Before public release: agree hosting/domain, approved content and CV, inbox and booking URL, privacy text, recurring costs and support ownership. Verify actual inbox delivery and retry behavior, book a test appointment, test downloads and media, confirm owner sign-in/recovery, and rehearse restoration. Do not point the live domain at the new service before acceptance. Direct MP4/WebM video and WebVTT captions are supported; use compressed artwork and a video host for larger clips. Each admin upload is limited to 30 MB.

Run `npm run test:admin` to verify database persistence, access controls, draft isolation, public refresh, recovery, uploads and inquiry handling using a temporary database.

Use **Website details → Homepage layout** to move sections up or down and choose which appear. **Currently Learning topics** lets you edit, reorder, or hide individual topics. Use **Preview** to check your draft layout or **Publish changes** to show it to visitors.
