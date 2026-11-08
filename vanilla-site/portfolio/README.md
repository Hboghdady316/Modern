# Design portfolio

This is the static portfolio used by the GitHub Pages workflow. The Next.js app at the repository root is a separate implementation.

## Preview

From the repository root:

```sh
npm run dev:portfolio
```

Open `http://localhost:8080/index.html#projects` for the galaxy, or `http://localhost:8080/portfolio/social-media.html` for the category collection.

This command needs Node.js 20 or newer. It serves the Haitham portfolio and the admin panel at `http://127.0.0.1:8080/admin/` without installing dependencies. Stop it with Ctrl+C. In an IDE, open the repository folder, select the `dev` branch, and run the command in the integrated terminal. `npm run dev` launches the separate Next.js template, which still has its original content.

Haitham’s current contact details come from `vanilla-site/index.html`: Senior Graphic Designer, Cairo, Egypt; h.boghdady316@gmail.com; (+20) 1095091603; LinkedIn `hboghdady316`. The category page uses the same details.

## Add real artwork

1. Put web-ready image files in `vanilla-site/assets/social-media/` (create the directory when needed).
2. Prefer the local admin panel: run `npm run admin` and open `/admin/` to upload artwork, add projects, and save changes.
3. For manual edits, update `vanilla-site/data/content.json`. Each category has a `projects` array with `id`, `title`, `platform`, `format`, `description`, `image`, `videoUrl`, `placeholder`, and `visible`.
4. Image/video paths in projects are relative to the collection page, for example `../assets/social-media/campaign-01.webp`.
5. Set `placeholder: false` for real work. Filters come from project `platform` values, and the preview notice disappears when there are no visible placeholders.

The category description, planet position, color, cover image, and destination are in the `categories` array in `data/content.json`. Category image and URL paths are relative to `vanilla-site/index.html`.

No external gallery service or backend is required. Changes on `dev` stay in development; the existing GitHub Pages workflow deploys on pushes to `main`.

## Categories

Each category has a planet, a details dialog, and a dedicated page:

- Social Media: `social-media.html`
- Logos & Branding: `logos-branding.html`
- Outdoors: `outdoors.html`
- Printings: `printings.html`
- Magazines & Catalogues: `magazines-catalogues.html`
- Videos: `videos.html`

All pages share `css/portfolio.css` and `js/portfolio.js`. Set the page’s `data-category` to the matching category ID. The Videos entries are visual placeholders until actual video projects are supplied.

## Planet arrangement

Use **Ordered** above the galaxy for the regular rows, **Random** for scattered positions, and **Shuffle again** for another random layout. Category filters preserve the selected arrangement mode. When WebGL is unavailable, visitors get category cards and arrangement controls are disabled.

## Rendering recovery

Three.js is served from local `assets/vendor/three/`, so page refreshes do not require the graphics CDN. If WebGL fails, selectable lightweight planets take over and both arrangement modes remain available. For a lightweight view directly, open `/?galaxy=2d#projects`.
