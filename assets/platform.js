/* ============================================================
   盼盼中文 · 平台层
   书架、课本、设置三处共用。没有后端也能完整运行：
   未登录时一切存本地，登录后本地队列自动补传。
   ============================================================ */
const PP = (() => {
  const LS = {
    settings: "pp.settings",
    queue: "pp.queue",
    progress: "pp.progress",
    learner: "pp.learner",
    session: "pp.session",
  };

  /* 设置默认值(2026-10-17 决议 ENG07):以 engine/core.js 的 SET 为正本,这里逐键对齐——
     中文界面、拼音开、译文关、常速、单站、白天;字号普通。课内页读写的就是这一份(localStorage pp.settings),
     刷新、换课、装到桌面后都保留。theme 在用户没点过之前跟随系统深浅色(core.js 判),这里不写默认。 */
  const DEFAULTS = {
    lang: "zh",           // 界面语言:zh / en / id / km
    fs: 0,                // 正文字号:0 小 · 1 普通 · 2 大(core.js FS_OPT 的下标,SET 现值 0)
    py: 1,                // 拼音:1 开 · 0 关(2026-09-23 用户:一级初学者进来就该看到拼音)
    tr: 0,                // 译文:0 关 · 1 开
    sp: 0,                // 朗读速度:0 常速 · 1 慢速
    read: 0,              // 阅读方式:0 单站 · 1 全课
    theme: 0,             // 主题:0 白天 · 1 夜间(首次无设置时 core.js 按系统偏好覆盖)
    rate: 0.8,            // 旧书架的语音合成语速(课内页不用)
    voice: "",            // 旧书架的语音合成音色名,空为自动(课内页另存 pp.voice)
    motion: true,         // 旧书架的翻页动画开关
  };

  const read = (k, d) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch { throw new Error('Local storage failed; changes were not saved.'); }
  };

  /* ── 设置 ─────────────────────────────────────────── */
  let settings = { ...DEFAULTS, ...read(LS.settings, {}) };
  const getSettings = () => ({ ...settings });
  const setSettings = (patch) => {
    settings = { ...settings, ...patch };
    write(LS.settings, settings);
    document.dispatchEvent(new CustomEvent("pp:settings", { detail: settings }));
    return settings;
  };

  /* ── 学习者 ───────────────────────────────────────── */
  const getLearner = () => read(LS.learner, { id: "local", name: "" });
  const setLearner = (l) => { write(LS.learner, l); return l; };
  // 旧 pp.progress 无归属信息，保留原值作恢复资料，不自动分配给新学习者。
  let contentVersion = 'unversioned';
  const setContentVersion = (value) => { contentVersion = value || 'unversioned'; };
  const accountId = () => read(LS.session, null)?.user?.id || null;
  const progressPrefix = (id, account) => LS.progress + '.v3.' + encodeURIComponent(account || 'local') + '.' + encodeURIComponent(id || 'local') + '.';
  const progressKey = (id, version, account) => progressPrefix(id, account) + encodeURIComponent(version);
  function clearLocalProgress() {
    const learner = getLearner().id, account = accountId();
    const prefix = progressPrefix(learner, account);
    const keys = Array.from({length: localStorage.length}, (_, i) => localStorage.key(i));
    // 无账号或版本归属的旧记录保留；不推断归属，也不清空其他人的队列。
    const remaining = read(LS.queue, []).filter(ev => !(ev.learner_id === learner
      && ev.payload?.account_id === account));
    write(LS.queue, remaining);
    keys.filter(key => key?.startsWith(prefix)).forEach(key => localStorage.removeItem(key));
    document.dispatchEvent(new CustomEvent('pp:progress', { detail: {} }));
  }

  /* ── 事件流：先入本地队列，联网时补传 ───────────────── */
  const uid = () =>
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  function logEvent(kind, lessonId, contentId, payload) {
    const ev = {
      client_id: uid(),
      learner_id: getLearner().id,
      lesson_id: lessonId || null,
      content_id: contentId || null,
      kind,
      payload: { ...(payload || {}), content_version: contentVersion,
                 account_id: read(LS.session, null)?.user?.id || null },
      occurred_at: new Date().toISOString(),
    };
    const q = read(LS.queue, []);
    q.push(ev);
    if (q.length > 5000) throw new Error('Local event queue is full; connect and sync before continuing.');
    write(LS.queue, q);
    applyLocal(ev);
    flush();
    return ev;
  }

  /* 本地派生进度，让书架不联网也能显示完成度。
     词表正本:docs/决议/2026-09-07-学习事件词表.md —— 只认那 14 类,
     旧名 page_view / star 已于 2026-09-07 删除,不再兼容。
     正确率只算首答(attempt 缺省视为 1、mode 缺省视为 assess),重做另计。 */
  function applyLocal(ev) {
    if (!ev.lesson_id) return;
    const key = progressKey(ev.learner_id, ev.payload.content_version, ev.payload.account_id);
    const all = read(key, {});
    const p = all[ev.lesson_id] || { stops: [], exTotal: 0, exRight: 0, retries: 0, opened: null, last: null };
    if (!p.stops) p.stops = [];                       // 旧结构(pages)平滑过渡
    if (ev.kind === "lesson_open") p.opened = p.opened || ev.occurred_at;
    p.opened = p.opened || ev.occurred_at;            // 补传乱序时兜底
    p.last = ev.occurred_at;
    const first = (ev.payload.attempt || 1) === 1 && (ev.payload.mode || "assess") === "assess";
    if (ev.kind === "stop_view" && ev.payload.key && !p.stops.includes(ev.payload.key))
      p.stops.push(ev.payload.key);
    if ((ev.kind === "exam_answer" || ev.kind === "drill_answer") && first) {
      p.exTotal++; if (ev.payload.ok) p.exRight++;
    }
    if (ev.kind === "exam_retry" || ev.kind === "drill_retry") p.retries++;
    all[ev.lesson_id] = p;
    write(key, all);
    document.dispatchEvent(new CustomEvent("pp:progress", { detail: all }));
  }

  const getProgress = (version = contentVersion) => read(progressKey(getLearner().id, version, accountId()), {});
  /* 旧内容版本的进度保留可读(2026-10-17 用户拍板:改课文后旧进度不清除、不隐藏)。
     返回 {内容版本: 该版本的进度表};阶段一不做跨版本合并,细则见 docs/15 末段。 */
  function getAllProgress() {
    const prefix = progressPrefix(getLearner().id, accountId());
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) out[decodeURIComponent(key.slice(prefix.length))] = read(key, {});
    }
    return out;
  }
  /* 课内页的本机状态键(当前站、走过的站、翻牌最快成绩、作答次数),体例同 blocks/workbook/workbook.js:
     panpan.<名>.<账号>.<学习者>.<课号>.<内容版本>。改课文(内容版本变)就是一把新钥匙,旧钥匙的记录留着。 */
  const stateKey = (name, lessonId, version) => 'panpan.' + name + '.'
    + [accountId() || 'local', getLearner().id, lessonId, version || contentVersion].map(encodeURIComponent).join('.');
  const readState = (name, lessonId, version, fallback) => read(stateKey(name, lessonId, version), fallback);
  const writeState = (name, lessonId, version, value) => { try { write(stateKey(name, lessonId, version), value); } catch (_) { /* 存不下就只留内存 */ } };

  /* ── 后端（可选）───────────────────────────────────── */
  let cfg = null, token = null;
  function configure(c) {
    cfg = c;                                    // {url, anonKey}
    token = read(LS.session, null);
    flush();
  }
  const online = () => !!(cfg && token);

  async function api(path, opts = {}) {
    if (!cfg) throw new Error("no backend");
    const r = await fetch(cfg.url + path, {
      ...opts,
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + (token?.access_token || cfg.anonKey),
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
    });
    if (!r.ok) throw new Error(await r.text());
    return r.status === 204 ? null : r.json();
  }

  async function signIn(email) {
    await api("/auth/v1/otp", {
      method: "POST",
      body: JSON.stringify({ email, create_user: true }),
    });
    return true;                                 // 魔术链接已寄出
  }
  function signOut() {
    token = null; write(LS.session, null);
    document.dispatchEvent(new CustomEvent("pp:auth", { detail: null }));
  }

  let flushing = false;
  async function flush() {
    if (flushing || !online()) return;
    const account = token?.user?.id;
    if (!account || read(LS.session, null)?.user?.id !== account) return;
    const q = read(LS.queue, []).filter(ev => ev.payload?.account_id === account
      && ev.learner_id === getLearner().id);
    if (!q.length) return;
    flushing = true;
    try {
      const batch = q.slice(0, 200);
      await api("/rest/v1/event", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates" },
        body: JSON.stringify(batch),
      });
      const accepted = new Set(batch.map(ev => ev.client_id));
      const remaining = read(LS.queue, []).filter(ev => !accepted.has(ev.client_id));
      write(LS.queue, remaining);
      if (remaining.length) setTimeout(flush, 200);
    } catch {
      /* 联不上就留在队列里，下次再说 */
    } finally {
      flushing = false;
    }
  }
  addEventListener("online", flush);

  /* ── 语音 ─────────────────────────────────────────── */
  let voices = [];
  function listVoices() {
    if (!window.speechSynthesis) return [];
    voices = speechSynthesis.getVoices().filter((v) => /^zh/i.test(v.lang));
    return voices;
  }
  if (window.speechSynthesis) {
    listVoices();
    speechSynthesis.onvoiceschanged = listVoices;
  }
  function pickVoice() {
    const vs = listVoices();
    if (!vs.length) return null;
    return vs.find((v) => v.name === settings.voice)
        || vs.find((v) => /zh[-_]CN/i.test(v.lang))
        || vs[0];
  }
  /* 2026-10-17 决议 ENG07:原先这里还有一套 speak(),与 engine/core.js 的 speak 并存;课内页实际只走 core.js
     那套(带坏声音黑名单与看门狗),这里的已删除。旧书架的试听按钮改为就地起一句,见 platform/shelf.html。 */

  return { LS, DEFAULTS, getSettings, setSettings, getLearner, setLearner, setContentVersion, clearLocalProgress,
           logEvent, getProgress, getAllProgress, stateKey, readState, writeState,
           configure, online, signIn, signOut, flush,
           listVoices, pickVoice };
})();
if (typeof window !== "undefined") window.PP = PP;
