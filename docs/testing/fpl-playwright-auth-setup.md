# Local Playwright FPL authentication setup

## Security boundary

The saved Playwright state contains reusable FPL authentication cookies. Treat it like a password.

- It is stored only at `playwright/.auth/fpl.json`.
- The entire `playwright/.auth/` directory is ignored by Git.
- Never commit, upload, email, paste into chat, or attach this file to an issue.
- Never put an FPL password, MFA code, cookie, or session token in an environment variable or repository file.
- Enter credentials only into the real `fantasy.premierleague.com` browser window opened by Playwright.
- Delete `playwright/.auth/fpl.json` when the local authenticated workflow is no longer needed or if the file may have been exposed.

Normal Playwright and CI runs do not discover or use the setup project.

## One-time setup

From the repository root, run:

```bash
RUN_FPL_AUTH_SETUP=true \
LIVE_FPL_ENTRY_ID=3376378 \
npx playwright test --project=fpl-auth-setup --headed --workers=1
```

Then:

1. A real Chromium window opens at FPL.
2. Sign in to FPL in that window using your normal method.
3. Complete any FPL login or verification prompts there.
4. Do not paste credentials or cookies into the terminal or Codex.
5. The test polls FPL's same-origin `/api/me/` endpoint until it sees entry `3376378`.
6. When verified, it saves `playwright/.auth/fpl.json` locally and exits.

The wait is limited to five minutes. If it expires, rerun the command; do not weaken the authentication check.

## Verify Git protection

Run:

```bash
git check-ignore -v playwright/.auth/fpl.json
git status --short
```

The first command must identify `.gitignore`, and the authentication file must not appear in Git status.

## Re-authenticate

If FPL expires the session, delete the local state and repeat setup:

```bash
rm playwright/.auth/fpl.json
```

Deleting this local authentication cache does not change your FPL account. If exposure is suspected, also sign out of FPL sessions or change the account password through FPL's official account controls.

## Next automation step

After local setup succeeds, run the bookmarklet transport check:

```bash
RUN_FPL_BOOKMARKLET_E2E=true \
PLAYWRIGHT_LIVE_BASE_URL=https://fpl-dashboard-seven-pi.vercel.app \
LIVE_FPL_ENTRY_ID=3376378 \
npx playwright test --project=fpl-bookmarklet --headed --workers=1
```

The project loads the ignored local state, authenticates the public entry on the dashboard, opens FPL, clicks the generated bookmarklet as a real user gesture, captures the dashboard import popup, and verifies the 15-player review contract. It does not click `Confirm and save squad`; the current FPL squad is transported for review but is not persisted by this test. The dashboard test session is revoked during cleanup.
