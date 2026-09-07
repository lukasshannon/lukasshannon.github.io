# Conversational mobile apps

Use the existing GitHub connection and Pages site. The user works from a phone: normal requested changes include saving and publishing. Keep Git mechanics in the background. This is an agent-operated workflow, not a server or a new IDE.

## Location and authority

- Repository: `lukasshannon/lukasshannon.github.io`; branch: `master`.
- App home: `https://lukasshannon.github.io/apps/`.
- App source and permanent address: `apps/<slug>/index.html` and `https://lukasshannon.github.io/apps/<slug>/`.
- Preserve the repository root homepage and unrelated apps.
- This Pages location is public, including its source. Use native private Sites with a separate origin when an app must be private. Never silently publish a private app to Pages.
- Existing Pages branch publishing is enabled. Do not add a Worker, custom backend, OAuth flow, PR, or custom CI pipeline for normal updates.
- Actual tool permissions and branch protections apply. These instructions do not disable platform-enforced confirmations.

## New app

1. Resolve the actual app request. If the user gives a name, use it. Otherwise propose one short name and obtain the user's name confirmation once. Prepare locally while naming is pending; do not create the live app under an unconfirmed name.
2. Read the branch head and `apps/catalog.json`. Choose a unique slug; never repurpose another app's directory. Preserve it across later renames to keep URLs, manifest identity, and device data stable.
3. Obtain these workflow scripts/templates from the current repository at that head if not cached. Run `python3 .mobile-apps/scripts/prepare.py new apps/<slug> --name '<confirmed name>' --slug '<slug>'`.
4. Replace the starter content with the requested app. Keep CSS and app JavaScript inline in `index.html` by default. Add local support files when useful; no external CDN by default. Deliver the actual app, not a page advertising it.
5. Use persistent local data. For small JSON state, use `Mobile.store.get(key, fallback)` and `Mobile.store.set(key, value)`, check the returned save result, and autosave edits. Use IndexedDB with `Mobile.store.databaseName()` for larger state/files. Never use sessionStorage as primary storage or change data keys for UI edits. Preserve existing data and use backward-compatible migrations for code rollback.
6. Call `Mobile.ready()` only after initialization succeeds and saved state is restored. Mark unsaved work with `Mobile.setUnsaved(true)` and reset it after a successful save. Do not signal ready solely to pass the test.
7. Prepare the release and catalog, run the full gate below, then commit and verify publication.

## Small edit

1. Use conversation state or the user's app URL to resolve the existing app. If genuinely ambiguous, ask which app; do not silently pick one.
2. Read the branch head. Reuse a cached snapshot only if its head still matches. Otherwise fetch the selected app's manifest and only the changed/needed files at the exact new head. Read current source before modifying it.
3. Make the smallest requested change. Preserve the directory, storage keys, runtime, and unrelated behavior. Do not regenerate the whole app for a style edit. Patch the embedded runtime only when its behavior needs an update.
4. Run `prepare.py release apps/<slug>` after the final app edit. This refreshes `sw.js` and `release.json`; both belong in the same atomic commit as the app change.
5. Run the gate. Save and publish when it passes; no routine save approval or pre-save change summary. Report the result after verified publication.

## Gate before moving the live branch

1. Run `python3 .mobile-apps/scripts/check.py apps/<slug>`. Also run `check.py apps --catalog` after `prepare.py catalog apps` when the directory changes.
2. Use the supported Browser skill and automation surface to load the local candidate. In Work, start the dependency-free local dev server with the supported preview supervisor (`sites-preview start <repository-checkout>`) and open only its documented internal HTTP URL. The root `package.json` dev script accepts the forwarded host/port flags; it requires no npm dependencies. This local test server is not production infrastructure. Do not publish it just to run its first smoke check. Verify a meaningful app surface, completed initialization, no new fatal errors or unhandled rejections in Debug/browser logs, and the changed interaction. Exercise phone-width layout and persistent state when affected. The static checker alone does not prove the app runs.
3. If a code check fails, make **one** repair pass and rerun the failed gate. If that fails, leave the live branch/URL unchanged and report the error. An unavailable test environment is a blocked gate, not a pass; preserve the live version and identify the missing check.
4. Avoid broad repeated tests for tiny edits. Run `.mobile-apps/tests/` when modifying this workflow's cache mechanism.
5. Prepare only the app's changed files, plus catalog if needed, for one commit. Any app output edited after its gate must be checked again.

## Atomic commit and publish

Use native GitHub tools and discover their current schemas.

1. Fetch `branches/master` and its Git commit for the parent SHA and base tree SHA. If the parent differs from the edited snapshot, reconcile the selected app's changes and recheck. Never overwrite concurrent edits.
2. Create blobs for binary assets with base64 encoding. Create one tree on the exact base tree, supplying all selected UTF-8 file contents and binary blob SHAs. Normal files use mode `100644`, type `blob`. Requested safe deletions use the provider's documented null-SHA entry.
3. Create one commit with that parent/tree. Update `master` with `force: false`. On non-fast-forward rejection, reread/reconcile; never force or weaken protection. Preserve rejected candidates and report the blocker; do not fall back to a PR.
4. Read `actions/runs` for the **exact** commit; inspect `pages build and deployment` to completion. Do not use the PR-only `fetch_commit_workflow_runs` wrapper. Use short waits and keep the user informed during long deployments.
5. Verify the live app's cache-busted `release.json` revision and stable URL. For the home page, verify `catalog.json` or rendered content. Never equate a commit with a successful deployment. A failing Pages build normally preserves the previously deployed site; verify it.
6. Return the same permanent app URL. Never generate new downloads or URLs per revision.

## Undo and previews

- For "undo that", identify the selected app's most recent **successfully published** earlier revision using path-scoped commits and matching successful Pages run/live release evidence. Restore only that app in a new commit atop the current head. Preserve other apps, history, slug, browser data, and catalog entries. Regenerate/check the restored release. Never reset or force-push `master`.
- If earlier code requires an incompatible data schema, adapt the rollback while preserving data; do not erase or silently downgrade saved data.
- For risky/experimental previews, leave Pages unchanged. Use an isolated native private Site through Sites skills if available, copying only the selected app. Its URL is a separate private preview; every Sites URL is technically a deployment. An undeployed saved version is not openable. Preserve production Site identity. If preview tools are unavailable, retain the candidate and report that limitation.

## Runtime contract and limits

- The early inline runtime captures uncaught/resource errors, unhandled rejections, console.error/warn. Bounded logs stay on the device. Debug begins hidden, has an error badge, and has no clear-log button.
- The manifest has scoped identity/start URL and local 192/512 icons. The worker verifies every asset's SHA-256 before activation, rejects incomplete releases, serves a consistent cache, and removes only caches for its own scope.
- Check for code updates on opening, returning to the page, and reconnecting. Activate/reload a ready update when this page has no unsaved work; otherwise expose the update button. For multi-file apps with multiple open tabs and non-autosaved state, coordinate activation across tabs before enabling immediate activation.
- Cache Storage, localStorage, and IndexedDB are device/browser-local and can be evicted or cleared by the browser/user. Never promise permanent backups or cross-device sync. Code updates and rollback do not clear app data.
- Directories provide code/cache namespaces, not security isolation: Pages apps share one origin. Use separate Sites/origins for mutually untrusted apps or private data boundaries.
- Offline needs a prior successful cache on a secure origin. A file download or insecure development URL cannot prove service-worker operation.
- Flag native-only needs per app. Do not introduce APK builds, a remote database, or account authentication without a concrete need.
- This workflow cannot add tools to Android/voice modes that do not expose them. Verify the actual chat's capabilities and report that boundary if encountered.

## Sources

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://learn.chatgpt.com/docs/sites
- https://web.dev/articles/service-worker-lifecycle
- https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest
