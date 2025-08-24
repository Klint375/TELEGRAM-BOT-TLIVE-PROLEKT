import fetch from 'cross-fetch';

export default async function handler(req, res) {
  const token = process.env.BOT_TOKEN;
  const domain = process.env.DOMAIN;
  if (!token || !domain) return res.status(500).json({ ok:false, error: 'Missing env' });
  const url = `${domain.replace(/\/+$/,'')}/api/bot`;

  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await resp.json();
    res.json({ ok:true, webhook:url, telegram:data });
  } catch (e) {
    res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
}
