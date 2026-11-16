# Design portfolio

For the owner walkthrough, local preview, SQLite backups, and hosted setup, see the [admin guide](../../admin/README.md).

The Work grid, Project Galaxy, category collections, and project detail pages all read the published database view when served by `npm run admin`. Use the admin to replace the starter entries with approved artwork; leave them marked as placeholders until they are ready. Visible categories keep their planets and display “Projects coming soon” until work is published. Placeholder and archived projects stay private. Signed-in owners can use Preview draft to review them.

No database, private snapshot, or new upload should be exported to static hosting. The legacy static deployment does not receive updates from the SQLite app.

The default Galaxy map uses CSS planets and does not require WebGL. The optional 3D view is available at `/?galaxy=3d#projects` and falls back to the same planet map if graphics are unavailable.
