# GitHub Pages hosting

Target: https://zaplexes.github.io/Marsway/. The repository is currently public, as verified through GitHub's public API on November 11, 2026. The user selected GitHub Pages and showed the Pages source changed to **GitHub Actions**, with the custom-domain field empty. No paid upgrade, custom domain or credentials are required by the application.

## Why the initial site was blank

Publishing `master` / repository root served the source `index.html`, which requested `/src/main.tsx`. GitHub Pages does not compile a React/TypeScript application. A repository project site also needs its `/Marsway/` prefix for bundled code and local assets.

The new workflow compiles and uploads **only `dist/`**. Vite's base and `CESIUM_BASE_URL` share the configured prefix. A local-asset helper applies that same prefix to stop photographs, elevation and geology while scientific manifests retain their stable asset identities. NASA imagery and source links remain external HTTPS URLs.

## One-time GitHub setup

1. Open the repository's **Settings → Pages**.
2. Set **Build and deployment → Source → GitHub Actions**. Do not configure the suggested Jekyll or Static HTML templates; this repository includes its own Vite workflow.
3. Leave **Custom domain** empty for the default GitHub URL. A bare project name such as `martianmapdynamix` is not a custom domain. A custom domain would need a separately owned domain and DNS setup, which is outside this milestone.
4. Open **Actions → Deploy Marsway to GitHub Pages** and wait for both build and deploy to succeed. If needed, choose **Run workflow** on `master`.
5. Open the target URL and refresh. The screen must show the app, not raw source or a blank page.

The workflow runs on source pushes to `master` and can be dispatched manually. Documentation-only changes under `docs/` or `README.md` do not redeploy. It pins the official GitHub actions to reviewed commits, uses the Node version from `.nvmrc`, installs with `npm ci`, refreshes the official Mars named-feature export, verifies its import constraints and retained scientific data, runs lint/format checks, builds for the URL returned by `configure-pages`, runs a browser hosting smoke check, uploads `dist/` with one-day artifact retention, and deploys after the build succeeds. Only the deploy job receives Pages write and OIDC permissions; build has contents/Pages read. It uses standard Ubuntu runners and no application secrets or personal token.

GitHub account settings, environment approvals and repository permissions can still block a run. A successful local check is not proof of a successful remote deployment; verify the Actions result and actual public site before marking deployment complete in the tracker.

## Local configuration and checks

`MARTIAN_MAP_BASE_PATH` is a public URL prefix, never a credential. Local development defaults to `/`. `.env.example` documents this setting and may be copied to ignored `.env` for a persistent local override. Actions supplies the Pages prefix explicitly; no frontend token is needed.

```sh
# Root preview and existing interaction checks
npm run build
npm test

# Build and test the repository-prefixed site on port 4175
npm run test:pages

# Restore a root build for the ordinary local preview afterward
npm run build
npm run preview
```

The hosting smoke check runs a real software-WebGL browser, loads the globe, all three local photographs, elevation, geology, estimated slope and the selected candidate highlight, requests Cesium worker/metadata files, browses/adds a global catalogue candidate and downloads the retained USGS export with a matching SHA-256. It rejects local requests escaping the configured prefix, HTTP failures and uncaught page errors. Orbital tile responses are intercepted for deterministic checks; this does not verify NASA availability. The same smoke check also runs at `/` in the ordinary suite. Production verification must separately exercise live imagery.

Python processing environments, raw GIS/raster downloads, source documents and repository metadata are not needed by the website and are not uploaded as the Pages artifact. Existing image credits, provenance links, alignment warnings and scientific limitations remain in the app. Exact stop positions, goals and route eligibility are unaffected by hosting.

References: [Vite static deployment](https://vite.dev/guide/static-deploy.html), [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [publishing source configuration](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Catalogue discovery uses prefixed static index/region files and a retained source KMZ in `dist/catalog/`. No backend deployment is required. The Pages build refreshes the official source before validation; upstream failure stops publication and leaves the previously deployed snapshot intact. See [catalogue refresh](crater-catalogue.md).

The hosting smoke check also enables the Mars-wide context layers at Gale and verifies global CTX, geology and relief while keeping local assets within the Pages prefix. These external tile endpoints require no backend deployment or credentials; the source metadata and global geology legend are bundled locally.

## Repository rename — November 13, 2026

GitHub’s public API resolves the old `zaplexes/spaceappsproject` repository to
`zaplexes/Marsway`. The current Pages URL is `https://zaplexes.github.io/Marsway/`
and returned HTTP 200 during review. The old `/spaceappsproject/` site returned
404. The latest observed deployment for commit `ba7b9ea` succeeded. The workflow
already derives its deployment prefix from GitHub Pages; local hosting checks
now default to `/Marsway/` as well. Do not use the old URL for demonstrations.

The HTTP 200 response alone did not establish a working release: its HTML still
requested `/spaceappsproject/` bundles, which returned 404. The workflow now
builds and tests with the current repository name as its Pages prefix, preventing
stale Pages metadata from retaining the previous name. Publish the reviewed
changes, then verify HTML, script, stylesheet, logo and a catalogue file at the
new URL before calling deployment complete.
