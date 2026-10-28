# Design portfolio

This is the static portfolio used by the GitHub Pages workflow. The Next.js app at the repository root is a separate implementation.

## Preview

From the repository root:

```sh
npm run dev:portfolio
```

Open `http://localhost:8080/index.html#projects` for the galaxy, or `http://localhost:8080/portfolio/social-media.html` for the category collection.

This command needs Python 3. It serves the static Haitham portfolio without installing dependencies. Stop it with Ctrl+C. In an IDE, open the repository folder, select the `dev` branch, and run the command in the integrated terminal. `npm run dev` launches the separate Next.js template, which still has its original content.

Haitham’s current contact details come from `vanilla-site/index.html`: Senior Graphic Designer, Cairo, Egypt; h.boghdady316@gmail.com; (+20) 1095091603; LinkedIn `hboghdady316`. The category page uses the same details.

## Add real artwork

1. Put web-ready image files in `vanilla-site/assets/social-media/` (create the directory when needed).
2. Edit `socialMediaProjects` in `vanilla-site/js/portfolio-data.js`. Each entry has `id`, `title`, `platform`, `format`, `description`, `image`, and `placeholder`.
3. Image paths are relative to the collection page, for example `../assets/social-media/campaign-01.webp`.
4. Set `placeholder: false` for real work. Use `Facebook`, `Instagram`, or `Campaigns` for `platform` to match the current filters.
5. Remove the collection preview notice from `social-media.html` when real artwork replaces all layout previews.

The category description, planet position, color, cover image, and destination are in `socialMediaCategory` in the same data module. Category image and URL paths are relative to `vanilla-site/index.html`.

No external gallery service or backend is required. Changes on `dev` stay in development; the existing GitHub Pages workflow deploys on pushes to `main`.
