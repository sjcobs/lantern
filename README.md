# Lantern

Lantern watches your light. Go dark too long, and it passes your chosen secrets to family members automatically, inside 1Password.

It works by using a 1Password service account token with **Create vaults** access only; it should not have access to your other vaults. Each `POST /run` creates a special vault for every family member if they do not already have one (default title `Lantern`). The clock is 1Password login time (`last_auth_at`), not a timer this app stores. For the last 3 days before a trip, the payload lists them under `warnings`. If they are overdue and that vault has items, Lantern grants **view-only** access to every family member, renames it to `Lantern` plus their first name, and creates a new empty vault for the inactive person. That lands under `trips`. Empty vaults are left alone. The opened vault is an archive. The new Lantern still allows editing.

Call `POST /run` on a schedule with n8n, cron, or anything else. Send `Authorization: Bearer <RUN_TOKEN>`. Hook any notification system to the JSON it returns. Set the HTTP timeout to a few minutes; a family with several people is many 1Password CLI calls. Treat `409` as "already running" and wait for the next schedule.

`GET /` returns `running` so you can see the process is up. It does not start a pass.

Local runs also need the 1Password CLI (`op`) on your PATH.

## Settings

1. Create a 1Password service account and set `OP_SERVICE_ACCOUNT_TOKEN`.
2. Set `RUN_TOKEN` to a long random string. n8n must send it as a bearer token.
3. Optional: `VAULT_TITLE` (vault name), `INACTIVE_AFTER_DAYS` (30, min 7, max 365), `PORT` (6346).
4. Schedule `POST /run`. Use the Unraid host IP, for example `http://<unraid-ip>:6346/run`.

## Run

```powershell
npm install
$Env:OP_SERVICE_ACCOUNT_TOKEN = "ops_your-token-here"
$Env:RUN_TOKEN = "a-long-random-string"
$Env:VAULT_TITLE = "Lantern"
$Env:INACTIVE_AFTER_DAYS = "30"
$Env:PORT = "6346"
npm start
```

```powershell
curl.exe http://localhost:6346/
curl.exe -X POST http://localhost:6346/run -H "Authorization: Bearer a-long-random-string"
```

To test warn or trip without waiting, set `TEST_DAYS`. It pretends every member has been idle that many days. Put a dummy item in **your** Lantern only. `27` warns (3 days left). `30` trips anyone who has items. Leave it empty when you are done. On Unraid, apply the new template (or add the variable), restart the container, then clear it.

```powershell
$Env:TEST_DAYS = "27"
npm start
```

## Env

| Variable                   | Default      |
| -------------------------- | ------------ |
| `OP_SERVICE_ACCOUNT_TOKEN` | required     |
| `RUN_TOKEN`                | required     |
| `VAULT_TITLE`              | `Lantern`    |
| `INACTIVE_AFTER_DAYS`      | `30` (7-365) |
| `TEST_DAYS`                | empty (off)  |
| `PORT`                     | `6346`       |

## Limits

Lantern does not replace 1Password family admins. An admin can delete anyone's Lantern vault (live or already opened), add themselves or others to it, and change permissions from the 1Password dashboard. View-only grants after a trip do not stop that. Trust your admins, or do not put secrets only they can destroy.

## Disclaimer

Use at your own risk. This is not a will, a backup, or an official 1Password product. Test it yourself, keep your own copies of anything that matters, and do not rely on it as your only plan. You are responsible for the token, the schedule, and what happens when a vault trips.
