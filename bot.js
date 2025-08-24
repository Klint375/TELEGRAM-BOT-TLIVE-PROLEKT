import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN;
const DOMAIN = process.env.DOMAIN;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN is missing');
if (!DOMAIN) throw new Error('DOMAIN is missing');

const bot = new Telegraf(BOT_TOKEN, { handlerTimeout: 9000 });

bot.start(async (ctx) => {
  const url = DOMAIN.endsWith('/') ? DOMAIN : `${DOMAIN}/`;
  await ctx.reply('Добро пожаловать в TelegramStreamT Live 🚀', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Открыть TLive 🚀', web_app: { url } }
      ], [
        { text: 'Открыть в браузере 🌐', url }
      ]]
    }
  });
});

bot.on('message', async (ctx) => {
  await ctx.reply('Нажмите кнопку ниже, чтобы открыть WebApp 👇', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Открыть TLive 🚀', web_app: { url: DOMAIN } }
      ]]
    }
  });
});

export default async function handler(req, res) {
  try {
    const h = await bot.createWebhook({ domain: DOMAIN });
    return h(req, res);
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).send('Bot error');
  }
}
