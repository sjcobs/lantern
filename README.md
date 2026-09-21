<p align="left">
  <img src="assets/logo.png" alt="Lantern" width="110" />
</p>

# Lantern

A guiding light for when you go dark. Automatically passes your chosen secrets to family members, inside 1Password.

Lantern talks to 1Password only through the [official CLI](https://developer.1password.com/docs/cli) (`op`) and the [official SDK](https://developer.1password.com/docs/sdks) (`@1password/sdk`).

It works by using a 1Password service account token with **Create vaults** access only; it should not have access to your other vaults. Each `POST /run` creates a special vault for every family member if they do not already have one (default title `Lantern`). The clock is 1Password login time (`last_auth_at`), not a timer this app stores, and not an email/SMS check-in. If they are overdue and that vault has items, Lantern grants **view-only** access to every family member, renames it to `Lantern` plus their first name (for example `Lantern - Ember`), and creates a new empty Lantern vault for the inactive person.

## Instructions

1. Host the Docker image on your local network. The image needs to always be running and **NEVER** be reverse proxied or exposed to the public. If you use Unraid, install [Lantern](https://ca.unraid.net/apps?q=Lantern) from Community Applications.
2. Log in to your 1Password dashboard on the web to create a service account. Navigate to Developer → Directory → Service Account.
3. Create a new service account named Lantern (or anything you choose). IMPORTANT: Only give your service account the `Allow creation of new vaults` permission. Do **NOT** give it access to any vaults.
4. Save your service account token and set `OP_SERVICE_ACCOUNT_TOKEN`.
5. Generate a long random string and set `RUN_TOKEN`. You must send this token when calling `POST /run`.
6. Set a scheduler to run `POST /run` once a day, or set `AUTO_RUN` to `true` to use the built-in scheduler.
7. Everyone in your family should now have their own personal Lantern vault. That vault is shared with all family members if the owner does not log in to 1Password within the `INACTIVE_AFTER_DAYS` you set.

Endpoint Example:

```bash
curl.exe -X POST http://localhost:6346/run -H "Authorization: Bearer <RUN_TOKEN>"
```

## Notifications

You can use n8n (or your preferred workflow scheduler) to notify family members of events by sending emails, SMS, push notifications, a webhook, or even the [official Grok Bot](https://x.ai/bot/IbFZmiL_mzu0Dq-K4u633). When you call `POST /run` you will receive a JSON array containing all notify events, or empty `[]` if none. Each event has `notify` (`warn` or `trip`), `email`, and `name`. Warn events also include `daysLeft` (`1`–`3`).

A family with several people can take time to process, so make sure to set your HTTP timeout to a few minutes. Any errors or warnings are printed in the Lantern log.

Return Example:

```json
[
  { "notify": "warn", "email": "ember@example.com", "name": "Ember Voss", "daysLeft": 2 },
  { "notify": "trip", "email": "nix@example.com", "name": "Nix Thorne" }
]
```

## Settings

| Variable                   | Default     | Description                                                                                                                                                                                                                  |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OP_SERVICE_ACCOUNT_TOKEN` | required    | 1Password service account token with allow creation of new vaults permission only.                                                                                                                                           |
| `RUN_TOKEN`                | required    | Shared secret. Any long random string. You must send this token when calling `POST /run`.                                                                                                                                    |
| `VAULT_TITLE`              | `Lantern`   | Name of vaults Lantern will create.                                                                                                                                                                                          |
| `INACTIVE_AFTER_DAYS`      | `90`        | Days without a 1Password login before a user's vault trips. Warns for the last 3 days. Valid values: 7–365.                                                                                                                  |
| `TEST_DAY`                 | empty (off) | Test the system without waiting. It pretends every member has been idle that many days. Put a dummy item in your Lantern vault. `87` warns (3 days left). `90` trips anyone who has items. Leave it empty when you are done. |
| `PING_URL`                 | empty (off) | Get notified if the container stops running by settings `PING_URL` to an external service like [healthchecks.io](https://healthchecks.io/), a successful run pings the URL. Leave empty to skip.                             |
| `AUTO_RUN`                 | `true`      | Automatically call run on start and every 24 hours. Set `false` if you only use a scheduler like n8n. No notifications unless something externally calls `POST /run`.                                                        |
| `PORT`                     | `6346`      | HTTP port to run on. `running`.                                                                                                                                                                                              |

## Dev Environment

```powershell
npm install
$Env:OP_SERVICE_ACCOUNT_TOKEN = "ops_your-token-here"
$Env:RUN_TOKEN = "a-long-random-string"
npm start
```

## Limitations

An admin can delete anyone's Lantern vault (live or already opened), add themselves or others to it, and change permissions from the 1Password dashboard. View-only grants after a trip do not stop that. Trust your admins, or do not put secrets they can view, edit, or destroy.

## Disclaimer

Use at your own risk. This is not a will, a backup, or an official 1Password product. Test it yourself, keep your own copies of anything that matters, and do not rely on it as your only plan. You are responsible for the token, the schedule, and what happens when a vault trips.

## License

[MIT](LICENSE).

## Support

[![Sponsor sjcobs](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/sjcobs)

[![Buy me a coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&slug=sjcobs&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://buymeacoffee.com/sjcobs)

Bitcoin: `bc1qzjrleryk7pmyyhw9xpg9dysvygztstk8u7qehn`

<img src="assets/btc.png" alt="Bitcoin QR" width="160" />
