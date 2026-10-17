/* 盼盼中文 · service worker。由 tools/lesson_preview.py build_v6_index() 生成,勿手改(决议 2026-10-17 ENG07)。
   公共引擎(assets)与入口页预缓存成一份;每课按课缓存,缓存名带该课内容指纹,改了课文就是新缓存,旧的在激活时清掉。
   网页与脚本「先网后缓存」(联网时永远拿最新,断网退回缓存);图片与音频「先缓存后网」(大而不常变)。 */
const CORE_VERSION = 'bd4a0ef9ee00';
const CORE_CACHE = 'pp-core-' + CORE_VERSION;
const PRECACHE = ["assets/assemble.js", "assets/blocks/classroom/classroom.css", "assets/blocks/classroom/classroom.js", "assets/blocks/discovery/discovery.css", "assets/blocks/discovery/discovery.js", "assets/blocks/flashcard/flashcard.css", "assets/blocks/flashcard/flashcard.js", "assets/blocks/goals/goals.css", "assets/blocks/goals/goals.js", "assets/blocks/hanzi/hanzi.css", "assets/blocks/hanzi/hanzi.js", "assets/blocks/memory/memory.css", "assets/blocks/memory/memory.js", "assets/blocks/passage/passage.css", "assets/blocks/passage/passage.js", "assets/blocks/quiz/quiz.css", "assets/blocks/quiz/quiz.js", "assets/blocks/story/story.css", "assets/blocks/story/story.js", "assets/blocks/workbook/workbook.css", "assets/blocks/workbook/workbook.js", "assets/boot.js", "assets/core.css", "assets/core.js", "assets/dev/assets-panel.css", "assets/dev/assets-panel.js", "assets/platform.js", "assets/py.js", "assets/responsive.css", "assets/vendor/ARPHIC-NOTICE.txt", "assets/vendor/ARPHICPL.TXT", "assets/vendor/hanzi-data.js", "assets/vendor/hanzi-writer.js", "hsk1-v6/index.html", "hsk1-v6/install.html", "manifest.webmanifest", "icons/panpan-192.png", "icons/panpan-512.png", "icons/panpan-512-maskable.png"];
const LESSONS = {"L01": {"key": "a5dd2c2cf158-34f528f1", "files": ["L01-preview/images/avatar_ahu.png", "L01-preview/images/avatar_baba.png", "L01-preview/images/avatar_cls.png", "L01-preview/images/avatar_duoduo.png", "L01-preview/images/avatar_feifei.png", "L01-preview/images/avatar_lele.png", "L01-preview/images/avatar_mama.png", "L01-preview/images/avatar_panpan.png", "L01-preview/images/avatar_ruth.png", "L01-preview/images/avatar_xie.png", "L01-preview/images/goodbye-selected.png", "L01-preview/images/goodbye-v2.png", "L01-preview/images/goodbye-v3.png", "L01-preview/images/goodbye-v4.png", "L01-preview/images/goodbye.png", "L01-preview/images/hello.png", "L01-preview/images/students.png", "L01-preview/images/teacher-v2.png", "L01-preview/images/teacher.png", "L01-preview/images/text1.png", "L01-preview/images/text2.png", "L01-preview/images/text3.png", "L01-preview/images/告别.png", "L01-preview/images/学生.png", "L01-preview/images/老师.png", "L01-preview/images/问候.png", "L01-preview/index.html", "L01-preview/pinyin-suggestions.json", "L01-preview/source-manifest.json"], "bytes": 28708005}, "L02": {"key": "40dc93267c0c-99f1facc", "files": ["L02-preview/images/avatar_ahu.png", "L02-preview/images/avatar_baba.png", "L02-preview/images/avatar_cls.png", "L02-preview/images/avatar_duoduo.png", "L02-preview/images/avatar_feifei.png", "L02-preview/images/avatar_lele.png", "L02-preview/images/avatar_mama.png", "L02-preview/images/avatar_panpan.png", "L02-preview/images/avatar_ruth.png", "L02-preview/images/avatar_xie.png", "L02-preview/images/family.png", "L02-preview/images/friend.png", "L02-preview/images/mama.png", "L02-preview/images/sister.png", "L02-preview/images/students10.png", "L02-preview/images/text1.png", "L02-preview/images/text2.png", "L02-preview/images/text3.png", "L02-preview/index.html", "L02-preview/pinyin-suggestions.json", "L02-preview/source-manifest.json"], "bytes": 20810696}, "L03": {"key": "eabb46c29aa9-bfbdbbfe", "files": ["L03-preview/images/avatar_ahu.png", "L03-preview/images/avatar_baba.png", "L03-preview/images/avatar_cls.png", "L03-preview/images/avatar_duoduo.png", "L03-preview/images/avatar_feifei.png", "L03-preview/images/avatar_lele.png", "L03-preview/images/avatar_mama.png", "L03-preview/images/avatar_panpan.png", "L03-preview/images/avatar_ruth.png", "L03-preview/images/avatar_xie.png", "L03-preview/images/birthday.png", "L03-preview/images/calendar-page.png", "L03-preview/images/calendar.png", "L03-preview/images/phone.png", "L03-preview/images/photo.png", "L03-preview/images/text1.png", "L03-preview/images/text2.png", "L03-preview/images/text3.png", "L03-preview/index.html", "L03-preview/pinyin-suggestions.json", "L03-preview/source-manifest.json"], "bytes": 20096856}, "L04": {"key": "a9fa4c1af8ec-310b2e2f", "files": ["L04-preview/images/avatar_ahu.png", "L04-preview/images/avatar_baba.png", "L04-preview/images/avatar_cls.png", "L04-preview/images/avatar_duoduo.png", "L04-preview/images/avatar_feifei.png", "L04-preview/images/avatar_lele.png", "L04-preview/images/avatar_mama.png", "L04-preview/images/avatar_panpan.png", "L04-preview/images/avatar_ruth.png", "L04-preview/images/avatar_xie.png", "L04-preview/images/read.png", "L04-preview/images/sleep.png", "L04-preview/images/text1.png", "L04-preview/images/text2.png", "L04-preview/images/text3.png", "L04-preview/images/wake.png", "L04-preview/images/write.png", "L04-preview/index.html", "L04-preview/pinyin-suggestions.json", "L04-preview/source-manifest.json"], "bytes": 18666082}, "L05": {"key": "28a8d82dd31e-1c91c7f4", "files": ["L05-preview/images/avatar_ahu.png", "L05-preview/images/avatar_baba.png", "L05-preview/images/avatar_cls.png", "L05-preview/images/avatar_duoduo.png", "L05-preview/images/avatar_feifei.png", "L05-preview/images/avatar_lele.png", "L05-preview/images/avatar_mama.png", "L05-preview/images/avatar_panpan.png", "L05-preview/images/avatar_ruth.png", "L05-preview/images/avatar_xie.png", "L05-preview/images/read.png", "L05-preview/images/school.png", "L05-preview/images/teacher.png", "L05-preview/images/text1.png", "L05-preview/images/text2.png", "L05-preview/images/text3.png", "L05-preview/index.html", "L05-preview/pinyin-suggestions.json", "L05-preview/source-manifest.json"], "bytes": 16494304}, "L06": {"key": "fc279398312d-8439504e", "files": ["L06-preview/images/avatar_ahu.png", "L06-preview/images/avatar_baba.png", "L06-preview/images/avatar_cls.png", "L06-preview/images/avatar_duoduo.png", "L06-preview/images/avatar_feifei.png", "L06-preview/images/avatar_lele.png", "L06-preview/images/avatar_mama.png", "L06-preview/images/avatar_panpan.png", "L06-preview/images/avatar_ruth.png", "L06-preview/images/avatar_xie.png", "L06-preview/images/book.png", "L06-preview/images/cup.png", "L06-preview/images/phone.png", "L06-preview/images/text1.png", "L06-preview/images/text2.png", "L06-preview/images/text3.png", "L06-preview/index.html", "L06-preview/pinyin-suggestions.json", "L06-preview/source-manifest.json"], "bytes": 16685512}, "L07": {"key": "07fa3170da7a-9490fc9c", "files": ["L07-preview/images/avatar_ahu.png", "L07-preview/images/avatar_baba.png", "L07-preview/images/avatar_cls.png", "L07-preview/images/avatar_duoduo.png", "L07-preview/images/avatar_feifei.png", "L07-preview/images/avatar_lele.png", "L07-preview/images/avatar_mama.png", "L07-preview/images/avatar_panpan.png", "L07-preview/images/avatar_ruth.png", "L07-preview/images/avatar_xie.png", "L07-preview/images/cat.png", "L07-preview/images/dog.png", "L07-preview/images/sing.png", "L07-preview/images/text1.png", "L07-preview/images/text2.png", "L07-preview/images/text3.png", "L07-preview/index.html", "L07-preview/pinyin-suggestions.json", "L07-preview/source-manifest.json"], "bytes": 16036431}, "L08": {"key": "ebb913c6186c-8d9de5be", "files": ["L08-preview/images/avatar_ahu.png", "L08-preview/images/avatar_baba.png", "L08-preview/images/avatar_cls.png", "L08-preview/images/avatar_duoduo.png", "L08-preview/images/avatar_feifei.png", "L08-preview/images/avatar_lele.png", "L08-preview/images/avatar_mama.png", "L08-preview/images/avatar_panpan.png", "L08-preview/images/avatar_ruth.png", "L08-preview/images/avatar_xie.png", "L08-preview/images/call.png", "L08-preview/images/read.png", "L08-preview/images/sit.png", "L08-preview/images/text1.png", "L08-preview/images/text2.png", "L08-preview/images/text3.png", "L08-preview/index.html", "L08-preview/pinyin-suggestions.json", "L08-preview/source-manifest.json"], "bytes": 15667998}, "L09": {"key": "850cce0645d8-4b674a1b", "files": ["L09-preview/images/apple.png", "L09-preview/images/avatar_ahu.png", "L09-preview/images/avatar_baba.png", "L09-preview/images/avatar_cls.png", "L09-preview/images/avatar_duoduo.png", "L09-preview/images/avatar_feifei.png", "L09-preview/images/avatar_lele.png", "L09-preview/images/avatar_mama.png", "L09-preview/images/avatar_panpan.png", "L09-preview/images/avatar_ruth.png", "L09-preview/images/avatar_xie.png", "L09-preview/images/bread.png", "L09-preview/images/milk.png", "L09-preview/images/text1.png", "L09-preview/images/text2.png", "L09-preview/images/text3.png", "L09-preview/index.html", "L09-preview/pinyin-suggestions.json", "L09-preview/source-manifest.json"], "bytes": 16244476}, "L10": {"key": "e2a730549100-697642c6", "files": ["L10-preview/images/avatar_ahu.png", "L10-preview/images/avatar_baba.png", "L10-preview/images/avatar_cls.png", "L10-preview/images/avatar_duoduo.png", "L10-preview/images/avatar_feifei.png", "L10-preview/images/avatar_lele.png", "L10-preview/images/avatar_mama.png", "L10-preview/images/avatar_panpan.png", "L10-preview/images/avatar_ruth.png", "L10-preview/images/avatar_xie.png", "L10-preview/images/book.png", "L10-preview/images/clothes.png", "L10-preview/images/phone.png", "L10-preview/images/text1.png", "L10-preview/images/text2.png", "L10-preview/images/text3.png", "L10-preview/index.html", "L10-preview/pinyin-suggestions.json", "L10-preview/source-manifest.json"], "bytes": 16861197}, "L11": {"key": "94306beda919-4e16f000", "files": ["L11-preview/images/avatar_ahu.png", "L11-preview/images/avatar_baba.png", "L11-preview/images/avatar_cls.png", "L11-preview/images/avatar_duoduo.png", "L11-preview/images/avatar_feifei.png", "L11-preview/images/avatar_lele.png", "L11-preview/images/avatar_mama.png", "L11-preview/images/avatar_panpan.png", "L11-preview/images/avatar_ruth.png", "L11-preview/images/avatar_xie.png", "L11-preview/images/plane.png", "L11-preview/images/taxi.png", "L11-preview/images/text1.png", "L11-preview/images/text2.png", "L11-preview/images/text3.png", "L11-preview/images/train.png", "L11-preview/index.html", "L11-preview/pinyin-suggestions.json", "L11-preview/source-manifest.json"], "bytes": 16715778}, "L12": {"key": "2bcb85d1e239-386999a8", "files": ["L12-preview/images/avatar_ahu.png", "L12-preview/images/avatar_baba.png", "L12-preview/images/avatar_cls.png", "L12-preview/images/avatar_duoduo.png", "L12-preview/images/avatar_feifei.png", "L12-preview/images/avatar_lele.png", "L12-preview/images/avatar_mama.png", "L12-preview/images/avatar_panpan.png", "L12-preview/images/avatar_ruth.png", "L12-preview/images/avatar_xie.png", "L12-preview/images/hotwater.png", "L12-preview/images/rain.png", "L12-preview/images/snow.png", "L12-preview/images/text1.png", "L12-preview/images/text2.png", "L12-preview/images/text3.png", "L12-preview/index.html", "L12-preview/pinyin-suggestions.json", "L12-preview/source-manifest.json"], "bytes": 17979337}, "L13": {"key": "0f481d81604b-c14f75a2", "files": ["L13-preview/images/avatar_ahu.png", "L13-preview/images/avatar_baba.png", "L13-preview/images/avatar_cls.png", "L13-preview/images/avatar_duoduo.png", "L13-preview/images/avatar_feifei.png", "L13-preview/images/avatar_lele.png", "L13-preview/images/avatar_mama.png", "L13-preview/images/avatar_panpan.png", "L13-preview/images/avatar_ruth.png", "L13-preview/images/avatar_xie.png", "L13-preview/images/bun.png", "L13-preview/images/dumplings.png", "L13-preview/images/noodles.png", "L13-preview/images/text1.png", "L13-preview/images/text2.png", "L13-preview/images/text3.png", "L13-preview/index.html", "L13-preview/pinyin-suggestions.json", "L13-preview/source-manifest.json"], "bytes": 16990251}, "L14": {"key": "c0dc1f1e40a3-8b782a48", "files": ["L14-preview/images/avatar_ahu.png", "L14-preview/images/avatar_baba.png", "L14-preview/images/avatar_cls.png", "L14-preview/images/avatar_duoduo.png", "L14-preview/images/avatar_feifei.png", "L14-preview/images/avatar_lele.png", "L14-preview/images/avatar_mama.png", "L14-preview/images/avatar_panpan.png", "L14-preview/images/avatar_ruth.png", "L14-preview/images/avatar_xie.png", "L14-preview/images/doctor.png", "L14-preview/images/hospital.png", "L14-preview/images/rest.png", "L14-preview/images/text1.png", "L14-preview/images/text2.png", "L14-preview/images/text3.png", "L14-preview/index.html", "L14-preview/pinyin-suggestions.json", "L14-preview/source-manifest.json"], "bytes": 16291779}, "L15": {"key": "7394b3dc01ce-163be10d", "files": ["L15-preview/images/avatar_ahu.png", "L15-preview/images/avatar_baba.png", "L15-preview/images/avatar_cls.png", "L15-preview/images/avatar_duoduo.png", "L15-preview/images/avatar_feifei.png", "L15-preview/images/avatar_lele.png", "L15-preview/images/avatar_mama.png", "L15-preview/images/avatar_panpan.png", "L15-preview/images/avatar_ruth.png", "L15-preview/images/avatar_xie.png", "L15-preview/images/doctor.png", "L15-preview/images/office.png", "L15-preview/images/student.png", "L15-preview/images/text1.png", "L15-preview/images/text2.png", "L15-preview/images/text3.png", "L15-preview/index.html", "L15-preview/pinyin-suggestions.json", "L15-preview/source-manifest.json"], "bytes": 17346537}};
const BASE = new URL('./', self.location).pathname;          /* 本机 '/',公开站 '/panpan-preview/' */
const abs = rel => BASE + rel;
const lessonCache = id => 'pp-lesson-' + id + '-' + LESSONS[id].key;
const MARK = id => abs(id + '-preview/__downloaded__');       /* 整课下载完的记号 */
const BIG = /\.(png|jpe?g|webp|gif|mp3|ogg|wav|m4a)$/i;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE_CACHE).then(c => c.addAll(PRECACHE.map(abs))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => {
    if(k.startsWith('pp-core-') && k !== CORE_CACHE) return caches.delete(k);
    const m = /^pp-lesson-(L\d\d)-(.+)$/.exec(k);
    if(m && (!LESSONS[m[1]] || LESSONS[m[1]].key !== m[2])) return caches.delete(k);
    return null;
  }))).then(() => self.clients.claim()));
});
function relOf(url){
  const u = new URL(url);
  if(u.origin !== self.location.origin || !u.pathname.startsWith(BASE)) return null;
  let rel = decodeURIComponent(u.pathname.slice(BASE.length));
  if(rel === '' || rel.endsWith('/')) rel += 'index.html';
  return rel;
}
function lessonOf(rel){ const m = /^(L\d\d)-preview\//.exec(rel); return (m && LESSONS[m[1]]) ? m[1] : null; }
function offlinePage(rel){
  const html = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>盼盼中文 · 还没下载</title><body style="font-family:system-ui,sans-serif;padding:40px 20px;text-align:center;color:#253e37;background:#f8f6f0">'
    + '<h1 style="font-size:24px">这一课还没下载到这台设备</h1><p>现在没有网络。请连上网后打开课程目录,点这一课的「下载」。</p>'
    + '<p style="color:#52665d">This lesson is not downloaded yet. Connect to the internet, open the lesson list and tap Download.</p>'
    + '<p><a href="' + abs('hsk1-v6/index.html') + '" style="color:#28755d">回到课程目录 · Back to lessons</a></p></body></html>';
  return new Response(html, {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8'}});
}
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const rel = relOf(e.request.url);
  if(rel === null) return;
  const id = lessonOf(rel);
  const cacheName = id ? lessonCache(id) : (PRECACHE.indexOf(rel) >= 0 ? CORE_CACHE : null);
  if(!cacheName) return;
  const key = abs(rel);
  const fromCache = () => caches.open(cacheName).then(c => c.match(key));
  const fromNet = () => fetch(e.request).then(r => {
    if(r && r.ok){ const copy = r.clone(); caches.open(cacheName).then(c => c.put(key, copy)).catch(() => {}); }
    return r;
  });
  if(BIG.test(rel)) e.respondWith(fromCache().then(r => r || fromNet()).catch(() => fromCache().then(r => r || Response.error())));
  else e.respondWith(fromNet().catch(() => fromCache().then(r => r || (e.request.mode === 'navigate' ? offlinePage(rel) : Response.error()))));
});

/* 入口页通过 postMessage 查状态、下载整课、删除整课 */
async function status(){
  const lessons = {};
  for(const id of Object.keys(LESSONS)){
    const c = await caches.open(lessonCache(id));
    const keys = await c.keys();
    lessons[id] = {total: LESSONS[id].files.length, cached: keys.filter(r => !r.url.endsWith('__downloaded__')).length,
                   done: !!(await c.match(MARK(id))), bytes: LESSONS[id].bytes};
  }
  return {type: 'status', core: await caches.has(CORE_CACHE), version: CORE_VERSION, lessons};
}
async function download(id, reply){
  const c = await caches.open(lessonCache(id));
  const files = LESSONS[id].files;
  let done = 0;
  try{
    for(let i = 0; i < files.length; i += 4){
      await Promise.all(files.slice(i, i + 4).map(async rel => {
        const key = abs(rel);
        if(!(await c.match(key))){
          const r = await fetch(key, {cache: 'no-cache'});
          if(!r.ok) throw new Error(rel + ' ' + r.status);
          await c.put(key, r);
        }
        done++;
        reply({type: 'progress', lesson: id, done: done, total: files.length});
      }));
    }
    await c.put(MARK(id), new Response('1'));
    reply({type: 'done', lesson: id});
  }catch(err){
    reply({type: 'error', lesson: id, message: String((err && err.message) || err)});
  }
}
self.addEventListener('message', e => {
  const d = e.data || {}, client = e.source;
  const reply = msg => { if(client) client.postMessage(msg); };
  if(d.type === 'status') e.waitUntil(status().then(reply));
  else if(d.type === 'download' && LESSONS[d.lesson]) e.waitUntil(download(d.lesson, reply));
  else if(d.type === 'remove' && LESSONS[d.lesson]) e.waitUntil(caches.delete(lessonCache(d.lesson)).then(() => status()).then(reply));
});
