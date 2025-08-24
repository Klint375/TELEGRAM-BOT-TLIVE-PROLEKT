import { useEffect, useRef, useState } from "react";
import Head from "next/head";

export default function Home() {
  const [role, setRole] = useState("viewer");
  const [isLive, setLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [uptime, setUptime] = useState("00:00:00");
  const videoRef = useRef(null);
  const recRef = useRef(null);
  const recChunks = useRef([]);
  const fpsRef = useRef({ id: 0, last: 0, frames: 0 });
  const [stats, setStats] = useState({ fps: "—", br: "—" });

  const HLS_URL = ""; // <- добавь HLS .m3u8 если используешь сервер трансляции
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;

  useEffect(() => { if (tg) { tg.expand(); tg.ready(); } }, [tg]);
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("role") || "viewer";
    setRole(r);
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.floor((Date.now()-start)/1000);
      const h = String(Math.floor(t/3600)).padStart(2,'0');
      const m = String(Math.floor((t%3600)/60)).padStart(2,'0');
      const s = String(t%60).padStart(2,'0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(id);
  }, [isLive]);

  async function startStreamer(){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:{ideal:1280}, height:{ideal:720}, frameRate:{ideal:30} }, audio:true });
      const v = videoRef.current; v.muted = true; v.srcObject = stream; setLive(true);
      recChunks.current = [];
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime }); recRef.current = rec;
      let bytes = 0; const t0 = Date.now(); rec.ondataavailable = (e)=>{ if(e.data&&e.data.size){ recChunks.current.push(e.data); bytes+=e.data.size; const dt=(Date.now()-t0)/1000; if(dt>0){ setStats(s=>({...s, br: (8*bytes/dt/1000).toFixed(0)+' кбит/с'})); } } }; rec.start(1000);
      const tick = ()=>{ fpsRef.current.frames++; const now=performance.now(); if(now - fpsRef.current.last >= 1000){ setStats(s=>({...s, fps: String(fpsRef.current.frames)})); fpsRef.current.frames=0; fpsRef.current.last=now; } fpsRef.current.id = requestAnimationFrame(tick); }; fpsRef.current.last=performance.now(); fpsRef.current.id=requestAnimationFrame(tick);
    } catch(e){ alert("Нет доступа к камере/микрофону"); }
  }

  function stopStreamer(){ if(recRef.current && recRef.current.state!=='inactive') recRef.current.stop(); const v=videoRef.current; const s=v?.srcObject; if(s){ s.getTracks().forEach(t=>t.stop()); v.srcObject=null; } setLive(false); setStats({fps:'—', br:'—'}); if(fpsRef.current.id) cancelAnimationFrame(fpsRef.current.id); }

  function archiveStream(){ if(!recChunks.current.length) return alert('Нет записанных данных'); const blob=new Blob(recChunks.current,{type:'video/webm'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`tlive_${new Date().toISOString().replace(/[:.]/g,'-')}.webm`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),5000); }

  useEffect(()=>{
    if(!HLS_URL || role!=='viewer') return;
    const v=videoRef.current; if(!v) return;
    if(v.canPlayType('application/vnd.apple.mpegurl')){ v.src=HLS_URL; setLive(true); }
    else { import('hls.js').then(({default: Hls})=>{ if(Hls.isSupported()){ const hls=new Hls(); hls.loadSource(HLS_URL); hls.attachMedia(v); setLive(true);} }); }
  },[role]);

  return (
    <>
      <Head>
        <title>TelegramStreamT Live</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script src="https://telegram.org/js/telegram-web-app.js" defer />
        <script src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js" defer />
      </Head>

      <main className="min-h-screen bg-[#0f1720] text-white">
        <header className="sticky top-0 bg-[#17212b]/90 backdrop-blur px-4 py-3 flex items-center gap-3 shadow">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2a82da] to-blue-300 grid place-items-center font-extrabold">TL</div>
          <div className="flex flex-col"><span className="text-xs text-gray-300">TelegramStreamT</span><span className="font-semibold">Live</span></div>
          <a href="/?role=viewer" className="ml-auto text-xs px-3 py-1 rounded-full bg-white/10">Зрителей: {viewers}</a>
        </header>

        <section className="p-4">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video relative">
            <video ref={videoRef} playsInline autoPlay className="w-full h-full bg-black" muted />
            <div className="absolute left-3 top-3 text-xs px-2 py-1 rounded-full bg-red-500/70">{isLive ? 'В эфире' : 'Оффлайн'}</div>
            <div className="absolute right-3 top-3 text-xs px-2 py-1 rounded-full bg-white/10">Время: {uptime}</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {role==='streamer' ? (<>
              <button onClick={startStreamer} className="px-3 py-3 rounded-2xl bg-[#2a82da]">🎥 Начать</button>
              <button onClick={stopStreamer} disabled={!isLive} className="px-3 py-3 rounded-2xl bg-[#e5484d] disabled:opacity-50">⏹ Завершить</button>
              <button onClick={archiveStream} disabled={!isLive} className="col-span-2 px-3 py-3 rounded-2xl bg-white/10 disabled:opacity-50">📂 Архивировать</button>
            </>) : (<>
              <a href="/?role=streamer" className="px-3 py-3 rounded-2xl bg-white/10 text-center">Я стример</a>
              <a href="/?role=viewer" className="px-3 py-3 rounded-2xl bg-white/10 text-center">Я зритель</a>
            </>)}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-300">
            <div className="bg-white/5 rounded-xl p-2">FPS: {stats.fps}</div>
            <div className="bg-white/5 rounded-xl p-2">Битрейт: {stats.br}</div>
            <div className="bg-white/5 rounded-xl p-2">Роль: {role}</div>
          </div>
        </section>

        <section className="px-4 pb-8">
          <div className="rounded-2xl bg-[#17212b] p-4 space-y-3">
            <h2 className="font-semibold">Подключить кошелёк</h2>
            <div id="tonconnect"></div>
            <p className="text-xs text-gray-400">Нажмите кнопку TonConnect, чтобы подключить Telegram Wallet и поддержать стримера.</p>
          </div>
        </section>

        <footer className="text-center text-xs text-gray-400 pb-8">© TelegramStreamT • Открой через бота или ссылку</footer>
      </main>
    </>
  );
}
