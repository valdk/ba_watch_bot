function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function sendTelegramMessage(message) {
  const token = getRequiredEnv('TELEGRAM_BOT_TOKEN');
  const chatId = getRequiredEnv('TELEGRAM_CHAT_ID');
  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: true,
      text: message
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram request failed: HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (!payload.ok) {
    throw new Error(`Telegram API error: ${payload.description ?? 'unknown error'}`);
  }

  return payload;
}