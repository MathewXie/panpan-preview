/* 起步。依赖全部片段,必须最后执行。
   从 REFERENCE-v47.html 原样切出,第一步只搬家、逐字不改。 */
/* ═══ 起步 ═══ */
visited.add(0);
renderStops();
setRole(/[?&]dev=1\b/.test(location.search) ? 'teacher' : 'student', true);
applyLang();
applyFs(SET.fs);
document.body.classList.toggle('showpy', !!SET.py);   /* 按默认设置显示拼音 */
renderOne();
syncHead();
document.title = '盼盼中文 · ' + (L.lesson_no || L.no || '') + ' ' + L.title;   // 2026-09-08:标题随课,不再写死二级第一课
