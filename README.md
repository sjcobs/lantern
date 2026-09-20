# Lantern

Lantern watches your light. Go dark too long, and it passes your chosen secrets to family members automatically, inside 1Password.

It works by using a 1Password service account token with **Create vaults** access only; it should not have access to your other vaults. Each `POST /run` creates a special vault for every family member if they do not already have one (default title `Lantern`). The clock is 1Password login time (`last_auth_at`), not a timer this app stores. If they are overdue and that vault has items, Lantern grants **view-only** access to every family member, renames it to `Lantern` plus their first name, and creates a new empty vault for the inactive person. Empty vaults are left alone. The opened vault is an archive. The new Lantern still allows editing.

`POST /run` returns a JSON array. Each item has `kind` of `warn` or `trip`, plus `email` and `name`. Warns also include `daysLeft` (`1`–`3`). Empty `[]` means nothing to notify.

```json
[
  { "kind": "warn", "email": "sam@example.com", "name": "Sam Chen", "daysLeft": 2 },
  { "kind": "trip", "email": "pat@example.com", "name": "Pat Nguyen" }
]
```

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

To test warn or trip without waiting, set `TEST_DAY`. It pretends every member has been idle that many days. Put a dummy item in **your** Lantern only. `27` warns (3 days left). `30` trips anyone who has items. Leave it empty when you are done. On Unraid, apply the new template (or add the variable), restart the container, then clear it.

```powershell
$Env:TEST_DAY = "27"
npm start
```

## Env

| Variable                   | Default      |
| -------------------------- | ------------ |
| `OP_SERVICE_ACCOUNT_TOKEN` | required     |
| `RUN_TOKEN`                | required     |
| `VAULT_TITLE`              | `Lantern`    |
| `INACTIVE_AFTER_DAYS`      | `30` (7-365) |
| `TEST_DAY`                 | empty (off)  |
| `PORT`                     | `6346`       |

## Limits

Lantern does not replace 1Password family admins. An admin can delete anyone's Lantern vault (live or already opened), add themselves or others to it, and change permissions from the 1Password dashboard. View-only grants after a trip do not stop that. Trust your admins, or do not put secrets only they can destroy.

## Disclaimer

Use at your own risk. This is not a will, a backup, or an official 1Password product. Test it yourself, keep your own copies of anything that matters, and do not rely on it as your only plan. You are responsible for the token, the schedule, and what happens when a vault trips.

## Support

[![Sponsor sjcobs](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/sjcobs)

[![Buy me a coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&slug=sjcobs&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://buymeacoffee.com/sjcobs)

Bitcoin: `bc1qzjrleryk7pmyyhw9xpg9dysvygztstk8u7qehn`

<img src="btc.png" alt="Bitcoin QR" width="160" />
