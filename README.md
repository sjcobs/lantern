# Lantern

Lantern watches your light. Go dark too long, and it passes your chosen secrets to family members automatically, inside 1Password.

It works by using a 1Password service account token with **Create vaults** access only; it should not have access to your other vaults. Each `POST /run` creates a special vault for every family member if they do not already have one (default title `Lantern`). The clock is 1Password login time (`last_auth_at`), not a timer this app stores. For the last 3 days before a trip, the payload lists them under `warnings`. If they are overdue and that vault has items, Lantern grants access to every family member, renames it to `Lantern - Name`, and creates a new empty vault for the inactive person. That lands under `trips`. Empty vaults are left alone.

Call `POST /run` on a schedule with n8n, cron, or anything else. Hook any notification system to the JSON it returns.

## Settings

1. Create a 1Password service account and set `OP_SERVICE_ACCOUNT_TOKEN`.
2. Optional: `VAULT_TITLE` (vault name), `INACTIVE_AFTER_DAYS` (30), `PORT` (6346).
3. Schedule `POST /run`. Use the Unraid host IP in n8n, for example `http://<unraid-ip>:6346/run`.

## Run

```powershell
npm install
$Env:OP_SERVICE_ACCOUNT_TOKEN = "ops_your-token-here"
$Env:VAULT_TITLE = "Lantern"
$Env:INACTIVE_AFTER_DAYS = "30"
$Env:PORT = "6346"
npm start
```

```powershell
curl.exe -X POST http://localhost:6346/run
```

## Env

| Variable                   | Default   |
| -------------------------- | --------- |
| `OP_SERVICE_ACCOUNT_TOKEN` | required  |
| `VAULT_TITLE`              | `Lantern` |
| `INACTIVE_AFTER_DAYS`      | `30`      |
| `PORT`                     | `6346`    |

## Disclaimer

Use at your own risk. This is not a will, a backup, or an official 1Password product Test it yourself, keep your own copies of anything that matters, and do not rely on it as your only plan. You are responsible for the token, the schedule, and what happens when a vault trips.
