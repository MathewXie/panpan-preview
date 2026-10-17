/* 起步。依赖全部片段,必须最后执行。
   从 REFERENCE-v47.html 原样切出,第一步只搬家、逐字不改。
   2026-10-17(决议 ENG07):设置、当前站、走过的站从本机读回(core.js SET / navLoad),刷新不丢。 */
/* ═══ 起步 ═══ */
visited.add(0);
const RESUMED = (typeof navLoad === 'function') && navLoad();   /* 回到上次那一站;没有记录就从第一站开始 */
if(SET.read) mode = 'all';                                       /* 阅读方式:全课连读 */
renderStops();
setRole(/[?&]dev=1\b/.test(location.search) ? 'teacher' : 'student', true);
document.body.classList.toggle('night', !!SET.theme);            /* 主题:用户点过的,或首次跟随系统 */
document.body.classList.toggle('showtr', !!SET.tr);              /* 译文 */
applyLang();
applyFs(SET.fs);
document.body.classList.toggle('showpy', !!SET.py);   /* 按默认设置显示拼音 */
if(mode === 'all'){ renderAll(); const el = document.getElementById('sec'+cur); if(el) el.scrollIntoView({block:'start'}); }
else renderOne();
syncHead();
if(typeof navSave === 'function') navSave();
EV('lesson_open', null, {plan_len: SECTIONS.length, resumed: !!RESUMED});   /* 词表:打开一课 {plan_len} */
document.title = '盼盼中文 · ' + (L.lesson_no || L.no || '') + ' ' + L.title;   // 2026-09-08:标题随课,不再写死二级第一课
/* 装到桌面与离线(2026-10-17):sw.js 在站点根目录(dist/sw.js,由 tools/lesson_preview.py 生成),
   管整站;file:// 或没生成 sw.js 时注册失败只记日志,页面照常。 */
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  navigator.serviceWorker.register('../sw.js').catch(e => console.warn('service worker 未注册:', e && e.message));
}
