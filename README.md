# BA_bot

This project watches Brutal Assault accommodation pages and sends a Telegram message when meaningful changes appear.

## What it watches

- `https://brutalassault.cz/en/accommodation`
- `https://brutalassault.cz/en/ac-71/hotels`
- `https://brutalassault.cz/en/ac-72/camps`
- `https://brutalassault.cz/en/ac-76/car-by-tent`

The watcher compares the current normalized page content with the last saved snapshot in `state/latest.json`.

## What triggers an alert

- Any meaningful page content change after normalization.
- A likely availability event, for example when the current empty-state markers disappear.
- Keyword hints for `Pentavilla` and `container` when they appear in the changed content.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a Telegram bot:

- Open Telegram and message `@BotFather`.
- Run `/newbot` and follow the prompts.
- Copy the bot token.

3. Get your chat ID:

- Start a conversation with your bot and send it any message.
- Open this URL in a browser, replacing the token:

```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

- Find the `chat.id` value from the response.

4. Export these variables in your shell:

```bash
export TELEGRAM_BOT_TOKEN="123456789:your-real-token"
export TELEGRAM_CHAT_ID="123456789"
```

5. Send a test Telegram message:

```bash
npm run test-telegram
```

6. Create the initial baseline without sending an alert:

```bash
npm run bootstrap
```

7. Run a manual check:

```bash
npm run check
```

8. Inspect changes without sending Telegram or updating the saved baseline:

```bash
npm run dry-run
```

## GitHub Actions setup

This project assumes `BA_bot` itself becomes the GitHub repository root. If you keep it inside a larger repository, GitHub only sees workflows from that larger repository root, so you would need to move `.github/workflows/watch-accommodation.yml` there yourself.

1. Put the contents of `BA_bot` into a GitHub repository.
2. Add repository secrets:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
3. Commit the initial `state/latest.json` file.
4. Run the workflow manually once with `bootstrap=true`.
5. Optionally run it again with `test_telegram=true`.
6. Leave the scheduled workflow enabled.

The workflow runs every 5 minutes and updates `state/latest.json` only when the saved baseline needs to change.

## Notes

- The first run auto-creates the baseline if `state/latest.json` is still empty.
- `dry-run` does not modify `state/latest.json`.
- GitHub scheduled workflows can be delayed during busy periods, and the minimum schedule interval is 5 minutes.
- Nothing in this project pushes to GitHub from your local machine. Any future push or repository creation is for you to do manually.