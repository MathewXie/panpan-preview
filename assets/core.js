/* core.js — 数据入口·学习记录·角色与字词元数据·例词英文·插画位·注音·朗读·roving·行程单导航·换节·语言·设置·字号·身份·下拉·记录面板
   从 REFERENCE-v47.html 原样切出,第一步只搬家、逐字不改。 */
const L  = JSON.parse(document.getElementById('lesson-data').textContent);
/* 注音表全书合一(决议 2026-09-05)。bundle 模式内联成 <script id="py-data">,
   分离式则由 assets/py.js 定义全局 PY_DATA 共享一份,这里两种来源都认。 */
const PY = (typeof PY_DATA !== 'undefined') ? PY_DATA
         : JSON.parse(document.getElementById('py-data').textContent);
/* 角色色。这张表原本只有二级第一课的四个人,一级的飞飞、阿虎、谢老师
   落不到色就顶着白圈。按拍板二这批数据要外置成角色配置文件;在那之前
   先做成「课程数据里有就用,没有的按名字派一个稳定色」,不再写死一课。 */
const WHO_BASE = {"盼盼":"#6EB9E5","朵朵":"#F4A9C0","爸爸":"#3E5F4A","妈妈":"#C0AE8A",
                  "飞飞":"#E08D4B","阿虎":"#7C6BB0","谢老师":"#4E8C8A","乐乐":"#C2698D",
                  "张老师":"#4E8C8A","爷爷":"#8A7B5C","奶奶":"#B08A9B","学生们":"#8FA0B3"};
const WHO = new Proxy(Object.assign({}, WHO_BASE, (L.cast || {})), {
  get(t, k){
    if (typeof k !== 'string') return t[k];
    if (t[k]) return t[k];
    let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 360;
    return 'hsl(' + h + ',34%,52%)';          /* 没登记的角色也有个稳定颜色 */
  }
});

/* ═══ 片段注册表(第二步)═══
   每个 blocks/<kind>/<kind>.js 在末尾调 PP.block({...}) 报到,
   engine/assemble.js 再按课程 JSON 的 plan 数组把它们拼成 SECTIONS。
   用全局注册而不是 ES module:v47 有 43 处内联 onclick 引用 30 个全局函数,
   模块作用域会让它们全部失效(决议 2026-09-05)。 */
/* The platform owns PP; extend it instead of redeclaring its global const. */
Object.assign(PP, {
  blocks: {},
  block(def){ PP.blocks[def.kind] = def; },
  /* 片段可以挂两类回调,core 因此不必认识任何具体片段:
     onAfterRender —— 切站重建 DOM 之后要回填的状态(答题标记、循环练进度…)
     onResize      —— 窗口尺寸变化时要重排的东西(翻牌牌阵…)
     不用钩子的话 core 就得直接调 examPaint / drillPaint / memRelayoutAll,
     哪一课的 plan 少了对应片段就 ReferenceError。 */
  afterRender: [], resize: [],
  onAfterRender(fn){ PP.afterRender.push(fn); },
  onResize(fn){ PP.resize.push(fn); },
  fire(list){ list.forEach(fn => { try { fn(); } catch(e){ console.error(e); } }); }
});

/* 埋点用的稳定课号。文件名是构建标识(L2-01),这里是内容 ID 前缀(L16),
   跨版本不变——docs/03 十二节「稳定内容 ID」。缺省退回文件名。 */
const LID = L.id || 'L';

/* ═══ 一二级数据形状适配 ═══
   一级(L01–L15)与二级(L2-01…)的课程 JSON 字段名不同:台词是 zh 还是 text、
   课文标题是 zh 还是 name、生词是字符串还是 [词,英,循环]、有没有 scene……
   这里在入口处削平,片段只认归一后的形状。**不是让模板吃两种数据**,
   是加一层薄适配;片段里不写 if 判断数据来自哪一级。 */
const IS_L1 = !!L.vocab;                 /* 一级有独立词表页,二级没有 */

function nzText(t, i){
  return {
    name:  t.name || t.zh || ('课文' + (i + 1)),
    scene: t.scene || '',
    words: (t.words || []).map(w => typeof w === 'string' ? w : w[0]),
    lines: (t.lines || []).map(l => ({
      who:    l.who,
      text:   l.text !== undefined ? l.text : (l.zh || ''),
      en:     l.en || '',
      tr:     l.tr || null,   /* 一级 v5 台词译文 {en,id?,km?}(2026-09-19),story 片段按界面语言显示 */
      avatar: l.avatar || VMAP[l.who] || '',
      track:  l.track
    })),
    say: t.say || null, ex: t.ex || [], mem: t.mem || null,
    art: t.art, track: t.track, game: t.game || null
  };
}

/* 翻牌牌面的英文:二级来自 WORD_EN 词表,一级来自 vocab.words 的 [词,英,循环]。
   **必须惰性求值**:WORD_EN 是本文件后面才声明的 const,在它之前连
   `typeof WORD_EN` 都会抛 ReferenceError(TDZ 里的 const 不同于未声明变量),
   写成顶层常量会让整个 core.js 中断。 */
let _wordEnL1 = null;
function wordEn(w){
  if (L.vocab && L.vocab.words){
    if (!_wordEnL1){
      _wordEnL1 = {};
      L.vocab.words.forEach(x => { _wordEnL1[x[0]] = x[1]; });
    }
    return _wordEnL1[w];
  }
  return typeof WORD_EN !== 'undefined' ? WORD_EN[w] : undefined;
}

/* ═══ 学习记录:事件结构对齐正式版 platform.js 的 PP.logEvent ═══
   本样张无后端,事件留在内存并可在「学习记录」面板查看/导出;
   接平台时把 push 换成 PP.logEvent(kind, lessonId, contentId, payload) 即可。 */
const EVENTS = [];
function EV(kind, contentId, payload){
  const ev = {
    lesson_id: LID,
    content_id: contentId || null,
    kind: kind,
    payload: payload || {},
    occurred_at: new Date().toISOString()
  };
  EVENTS.push(ev);
  if(window.PP && PP.logEvent) PP.logEvent(kind, ev.lesson_id, ev.content_id, ev.payload);
  const b = document.getElementById('logCount');
  if(b) b.textContent = EVENTS.length;
  return ev;
}
/* 事件词表正本:docs/决议/2026-09-07-学习事件词表.md。改这里要同步 platform.js、
   db/schema.sql、docs/15-平台与权限规范.md §五、docs/10 §八 —— 由 tools/synccheck.py S14 守着。 */
const EV_LABEL = {
  "lesson_open": "打开本课",
  "stop_view": "进入站点",
  "line_play": "点读台词",
  "story_play": "播放课文动画",
  "char_view": "查看汉字",
  "hz_quiz": "笔顺测验",
  "drill_answer": "循环练作答",
  "drill_retry": "循环练重做",
  "exam_answer": "小考场作答",
  "exam_retry": "小考场重做",
  "exam_done": "小考场交卷",
  "memory_open": "打开翻牌",
  "memory_done": "翻牌通关",
  "setting": "改设置"
};
const CHARWORD = {"准":"准备","备":"准备","旅":"旅游","游":"旅游","场":"机场","票":"机票",
                  "快":"快要","门":"出门","酒":"酒店","晴":"晴天","次":"第一次"};
/* 说话人 → 共用头像文件名(assets-src/shared/avatars/avatar_<key>.png)。
   表里没有的角色,探测不到图就退回名字首字的色圆。 */
const VMAP = {'盼盼':'panpan','朵朵':'duoduo','爸爸':'baba','妈妈':'mama',
              '飞飞':'feifei','阿虎':'ahu','乐乐':'lele','谢老师':'xie','路得':'ruth'};

/* ── 例词英文释义 ──────────────────────────────────────────────
   正式版一级的英文写在课程 JSON 的 vocab 里(格式 ["你好","hello",1]),
   是作者原创内容;二级数据包未提供,官方 HSK 词表也只给词性不给释义。
   下表为 Claude 拟稿,体例照一级(小写、分号分项、括号注语法功能),
   **待 YaNan 核改后回填正本**。改这一处即可,牌面与制作清单同步更新。 */
const WORD_EN = {
  '准备':  'to prepare; to get ready',
  '旅游':  'to travel',
  '机场':  'airport',
  '机票':  'plane ticket',
  '快要':  'about to; soon',
  '出门':  'to go out',
  '酒店':  'hotel',
  '晴天':  'sunny day',
  '第一次': 'the first time'
};
const EN_DRAFT = true;   /* 英文为拟稿:牌面与清单会标注,核定后改 false */


/* ═══ 插画位总表 ═══
   造型取自《人物规范》SY02 身份锚点与故事学年卡;风格串见制作清单顶部。
   本课为旅行场景,书包属于场景道具层,按剧情改为行李。 */
const CHAR = {
  "panpan": "SY02,8 岁大熊猫男孩,圆脸黑眼圈,天蓝色长袖 T 恤配低饱和苔藓绿短裤,通透水彩稀疏短绒,笑容灿烂;脸、耳朵、毛色和头身比例跨学年不变",
  "duoduo": "SY02,6 岁大熊猫女孩,宽颊略窄下颌,一撮上翘呆毛,根部左侧固定五瓣小红花,桃粉色连衣裙配白衬衫,眼睛灵动且没有固定白色高光;脸、耳朵、毛色和头身比例跨学年不变",
  "mama": "大熊猫妈妈,米色开衫,豆沙玫瑰色窄领巾与古铜叶片胸针,温柔微笑,拎小手提包;外形跨学年不变",
  "baba": "大熊猫爸爸,体格敦实,墨绿色毛衣,细框眼镜,笑起来很温和;外形跨学年不变"
};
const ANIM = '当前只交静态图;构图须可拆成固定背景、人物与前景三层,为 v1.0 后故事短片保留连续动作空间。';
const NOTXT = '画面无文字。';
const IMAGES_BUILTIN = {
  cover:{size:'1600×950 横图', desc:'课首页封面:机场出发大厅,清晨明亮。熊猫一家四口并排站着——爸爸('+CHAR.baba+')推行李车,妈妈('+CHAR.mama+')拎手提包,盼盼('+CHAR.panpan+')和朵朵('+CHAR.duoduo+')一人拉一个小行李箱,四人都朝画面外笑。背景是航站楼落地窗与停机坪上的飞机,光线通透。'+NOTXT},
  text1:{size:'母版 1920×1080 → 站内 1600×900 横图', desc:'课文一插图:晚饭后的客厅,暖黄灯光。餐桌旁四人围坐,爸爸('+CHAR.baba+')与妈妈('+CHAR.mama+')在说话,盼盼('+CHAR.panpan+')睁大眼睛,朵朵('+CHAR.duoduo+')兴奋得站起来举手。桌上有碗筷,沙发与窗帘做背景。'+ANIM+NOTXT},
  text2:{size:'母版 1920×1080 → 站内 1600×900 横图', desc:'课文二插图:清晨六点的卧室到门口。妈妈('+CHAR.mama+')在叫醒孩子,朵朵('+CHAR.duoduo+')还赖在小床上揉眼睛,盼盼('+CHAR.panpan+')已经站起来,爸爸('+CHAR.baba+')在门口举着手机看机票,脚边放着行李箱。窗外天刚亮。'+ANIM+NOTXT},
  text3:{size:'母版 1920×1080 → 站内 1600×900 横图', desc:'课文三插图:飞机客舱内,四人并排坐在座位上系着安全带。朵朵('+CHAR.duoduo+')趴在舷窗上往外看,盼盼('+CHAR.panpan+')扭头也看窗外,窗外是蓝天白云和阳光。爸爸妈妈在旁边微笑。'+ANIM+NOTXT},
  text4:{size:'母版 1920×1080 → 站内 1600×900 横图', desc:'课文四插图:一张图讲完旅行的一天。可用四格连环或一景多点排布——清晨起床、手机上的机票、飞机舷窗外的晴天、傍晚酒店门口。人物为熊猫一家四口。'+NOTXT},
  avatar_panpan:{size:'400×400 方图·头像', desc:'头像:'+CHAR.panpan+'。半身正面,纯浅色底,可裁圆。'+NOTXT},
  avatar_duoduo:{size:'400×400 方图·头像', desc:'头像:'+CHAR.duoduo+'。半身正面,纯浅色底,可裁圆。'+NOTXT},
  avatar_baba:{size:'400×400 方图·头像', desc:'头像:'+CHAR.baba+'。半身正面,纯浅色底,可裁圆。'+NOTXT},
  avatar_mama:{size:'400×400 方图·头像', desc:'头像:'+CHAR.mama+'。半身正面,纯浅色底,可裁圆。'+NOTXT},
  r1_A:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'读1 选项A「准备好的衣服和水」:摊开的行李箱里叠好的衣服和一瓶水,俯视特写,浅色地板做底。'+NOTXT},
  r1_B:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'读1 选项B「手机上的机票」:一只手举着手机,屏幕上是电子机票的示意图形(只用图形与色块,不写任何字),背景虚化。'+NOTXT},
  r1_C:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'读1 选项C「窗外的晴天」:从飞机舷窗往外看,蓝天白云与阳光,窗框占画面一角。'+NOTXT},
  r1_D:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'读1 选项D「睡觉的朵朵」:'+CHAR.duoduo+',靠在座椅上闭眼睡着,头微微歪向一侧。'+NOTXT},
  l2_A:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'听2 选项A「飞机」:一架客机在蓝天中飞行,侧面全景。'+NOTXT},
  l2_B:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'听2 选项B「机场」:机场值机大厅全景,有行李车与指示牌(牌面留空不写字)。'+NOTXT},
  l2_C:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'听2 选项C「酒店」:酒店门口外观,夜晚,暖色灯光。'+NOTXT},
  l2_D:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'听2 选项D「爷爷奶奶家」:熊猫爷爷奶奶站在自家院门口挥手。造型见《人物规范》扩展角色条目。'+NOTXT},
  l1_1:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'听1 第1题图「一家人上飞机」:熊猫一家四口正走上登机廊桥。音频判断为√。'+NOTXT},
  l1_2:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'听1 第2题图「朵朵开心地起床」:'+CHAR.duoduo+',笑着从床上坐起来,精神很好。音频说她不想起床,判断为×。'+NOTXT},
  l1_3:{size:'母版 1600×1200 → 站内 800×600 横图', desc:'听1 第3题图「一家人在酒店门口」:熊猫一家四口拉着行李站在酒店门口,夜晚,门口有暖色灯。判断为√。'+NOTXT},
  culture:{size:'600×600 方图', desc:'文化插图:黄金周的旅行气氛——一家人拖着行李箱汇入人流,背景是车站或景点入口的远景剪影,热闹但不拥挤。突出「一起出门」。'+NOTXT}
};
/* 插图总表:一级把它放在课程数据的 assets.images 里,二级目前还内置在本文件。
   按拍板二这张表要进 lesson JSON;先让课程数据优先,内置的作后备。 */
const IMAGES = (L.assets && L.assets.images) || IMAGES_BUILTIN;
const IMG_EXT = ['png','jpg','jpeg','webp'];
const foundImg = {};
function probeImage(base){ return new Promise(res=>{
  let i=0; const tryNext=()=>{ if(i>=IMG_EXT.length) return res(null);
    const url='images/'+base+'.'+IMG_EXT[i++]; const im=new Image();
    im.onload=()=>res(url); im.onerror=tryNext; im.src=url; }; tryNext(); }); }
function artHTML(key, o){
  o = o || {};
  return '<figure class="art' + (o.story?' story':'') + '" data-art="' + key + '"'
   + (o.story ? ' data-story="'+o.story+'" onclick="storyClick(this,'+o.ti+')" role="button" tabindex="0"'
                + ' title="点图片:随朗读逐行播放"' : '')
   + ' style="aspect-ratio:' + (o.ratio||'16/9') + ';' + (o.style||'') + '"></figure>'
   + (o.cap ? '<div class="art-cap">' + o.cap + '</div>' : '');
}
async function initArts(root){
  const scope = root || document;
  for(const fig of scope.querySelectorAll('.art[data-art]')){
    if(fig.querySelector('.ph')) continue;
    const key = fig.dataset.art, meta = IMAGES[key] || {size:'', desc:key};
    const img = document.createElement('img'); img.alt = '';
    const ph = document.createElement('div'); ph.className = 'ph';
    ph.innerHTML = '<b>🖼 images/' + key + '.png　建议 ' + meta.size + '</b><p>' + meta.desc + '</p>';
    fig.append(img, ph);
    if(fig.dataset.story) fig.insertAdjacentHTML('beforeend','<span class="pbadge">▶</span>');
    const url = (foundImg[key] !== undefined) ? foundImg[key] : await probeImage(key);
    foundImg[key] = url;
    if(url){ img.src = url; fig.classList.add('ok'); }
    else fig.classList.add('missing');
  }
  for(const av of scope.querySelectorAll('.avatar[data-avatar]')){
    const key = 'avatar_' + av.dataset.avatar;
    // 头像素材已批准(assets-src/shared/avatars),预览也照常加载;没有的角色自然探测不到,退回名字色圆。
    const url = (foundImg[key] !== undefined) ? foundImg[key] : await probeImage(key);
    foundImg[key] = url;
    if(url){ av.querySelector('img').src = url; av.classList.add('ok'); }
  }
}
document.getElementById('lessonLbl').textContent =
  L.level.replace('盼盼中文 · ','') + ' · ' + (L.lesson_no || L.no || '') + ' ' + L.title;


/* ═══ 注音:与原版 engine.js kkBuild 同构 ═══ */
function kkBuild(el){
  if(el.dataset.kk) return;
  const txt = el.textContent.trim(), py = PY[txt] || [];
  let out = '';
  /* 不能在行首出现的标点(GB/T 15834 与 CLReq 的避头尾规则)。
     逐字包裹会让浏览器按块断行、绕过内建规则,所以把标点和它前一个字绑成一组。 */
  const NO_HEAD = '，。、；：？！）」』】,.;:?!)>”’';
  [...txt].forEach((ch,i)=>{
    const isHz = /[\u4e00-\u9fff]/.test(ch);
    const glue = NO_HEAD.indexOf(ch) >= 0;
    /* 拼音层对辅助技术与复制隐藏,整句由容器的 aria-label 提供,
       否则读屏与复制会得到「zhè这ge个」这种字音交错的坏文本 */
    out += "<span class='ch" + (glue ? ' punc' : '') + "'><span class='py' aria-hidden='true'>"
         + (isHz ? (py[i]||'') : '&nbsp;') + "</span><span class='hz'>" + ch + "</span></span>";
  });
  el.setAttribute('aria-label', txt);
  el.innerHTML = out; el.dataset.kk = '1';
}
function kkAll(root){
  (root||document).querySelectorAll('.kk').forEach(kkBuild);
  /* 把「标点 + 它前面那个字」焊成一个不可断的单元,避免标点被挤到行首 */
  (root||document).querySelectorAll('.kk').forEach(el=>{
    if(el.dataset.glue) return;
    el.dataset.glue = '1';
    [...el.querySelectorAll('.ch.punc')].forEach(p=>{
      const prev = p.previousElementSibling;
      if(!prev || prev.classList.contains('punc')) return;
      const wrap = document.createElement('span');
      wrap.className = 'nb';
      prev.parentNode.insertBefore(wrap, prev);
      wrap.append(prev, p);
    });
  });
}
const kk = t => '<span class="kk">' + t + '</span>';


/* ═══ 朗读 ═══ */
let ttsWarned=false, playingSeq=false, SLOW=false;
/* 设备语音(2026-09-19,照用户给的能在 iPad 出声的样例页改):
   - 只用浏览器自带的 speechSynthesis,不接在线服务、不预生成音频(用户拍板);
   - 声音按分数挑:本机声音优先(联网声音常常"宣布念完却没声"),自然/增强版优先,紧凑型垫底;用户在设置里挑的优先;
   - 点了就立刻 speak,中间不能延迟(iOS 只在用户点击那一刻放行);
   - 1.5 秒没开口、或不到 0.4 秒就"念完",算这个声音坏了:记进黑名单,换下一个重试;
   - 出错不当成读完(否则整段一句接一句空转),面板里说清原因;Chrome 念超过 15 秒会自行暂停,定时 resume 顶住。 */
const TTS = { cur:null, voice:null, pick:'', bad:new Set(), list:[], plain:false, warmed:false };
try{ TTS.pick = localStorage.getItem('pp.voice') || ''; }catch(e){}
function ttsScore(v){
  const n = v.name || '';
  let s = 0;
  if(/natural|neural/i.test(n)) s += 100;
  if(/online/i.test(n)) s += 60;
  if(/premium|enhanced/i.test(n)) s += 50;
  if(/晓晓|Xiaoxiao|云希|Yunxi|云扬|Yunyang|晓伊|Xiaoyi/i.test(n)) s += 40;
  if(/Meijia|美佳|Tingting|婷婷|Sinji/i.test(n)) s += 30;
  if(/Google/i.test(n)) s += 10;
  if(/^zh[-_]?CN/i.test(v.lang) || /CN|Hans/i.test(v.lang)) s += 25;
  if(/compact|eloquence|espeak|novelty/i.test(n)) s -= 90;
  if(v.localService === true) s += 45;
  if(TTS.bad.has(n)) s -= 500;
  return s;
}
function ttsVoices(){
  const vs = ('speechSynthesis' in window) ? (speechSynthesis.getVoices() || []) : [];
  return vs.filter(v => /^zh/i.test(v.lang) || /(chinese|中文|普通话|mandarin|粤)/i.test(v.name))
           .sort((a, b) => ttsScore(b) - ttsScore(a));
}
function ttsPickVoice(){
  if(!('speechSynthesis' in window)) return;
  const zh = ttsVoices(); TTS.list = zh;
  const picked = TTS.pick && zh.find(v => v.name === TTS.pick && !TTS.bad.has(v.name));
  TTS.voice = picked || zh.find(v => !TTS.bad.has(v.name)) || zh[0] || null;
  ttsFillSelect(zh);
}
/* 设置面板的「朗读声音」下拉框:列出设备上全部中文声音,让用户自己挑;坏了的标 ✗ */
function ttsFillSelect(zh){
  const sel = document.getElementById('selVoice'); if(!sel) return;
  const opts = ['<option value="">' + T('voiceAuto') + (zh.length ? ' (' + zh.length + ')' : '') + '</option>']
    .concat(zh.map(v => '<option value="' + v.name.replace(/"/g, '&quot;') + '">'
      + (TTS.bad.has(v.name) ? '✗ ' : '') + v.name + ' · ' + v.lang + '</option>'));
  if(!zh.length) opts.push('<option value="" disabled>' + T('voiceNone') + '</option>');
  sel.innerHTML = opts.join('');
  sel.value = (TTS.pick && zh.some(v => v.name === TTS.pick)) ? TTS.pick : '';
  sel.onchange = () => {
    TTS.pick = sel.value; try{ localStorage.setItem('pp.voice', TTS.pick); }catch(e){}
    if(TTS.pick) TTS.bad.delete(TTS.pick);      // 用户主动选的,给它再试一次的机会
    ttsPickVoice(); EV('setting', LID + '.set.voice', {value: TTS.pick || 'auto'});
  };
}
const TTS_FAIL = { 'not-allowed':'ttsNotAllowed', 'no-start':'ttsNoStart', 'synthesis-failed':'ttsSynthFail',
                   'audio-busy':'ttsBusy', 'language-unavailable':'ttsNoVoice', 'voice-unavailable':'ttsVoiceBad' };
function ttsFail(reason){
  const msg = T(TTS_FAIL[reason] || 'ttsNoStart') + (TTS.list.length ? '' : ' ' + T('voiceNone'));
  toast(msg);
  const box = document.getElementById('vtRes'); if(box) box.textContent = '✗ ' + msg;
}
/* 这个声音没出声:拉黑,换下一个再读一次;全都试完了,最后退回「只给 lang、不指定声音」——
   这正是 Web Speech API 最朴素的用法,由浏览器自己挑中文声音。有些平台(安卓 Chrome、部分 Linux)
   指定 voice 反而哑,不指定就能出声,所以这一步必须留着,不能直接认输。 */
function ttsDied(t, onend){
  if(TTS.voice) TTS.bad.add(TTS.voice.name);
  const next = TTS.list.filter(v => !TTS.bad.has(v.name)).sort((a, b) => ttsScore(b) - ttsScore(a))[0];
  if(next){
    TTS.voice = next; TTS.plain = false; ttsFillSelect(TTS.list);
    setTimeout(() => speak(t, onend), 120);
    return;
  }
  if(!TTS.plain){                                  // 还没试过「不指定声音」,试这一次
    TTS.voice = null; TTS.plain = true;
    setTimeout(() => speak(t, onend), 120);
    return;
  }
  TTS.plain = false; ttsFail('no-start');
}
if('speechSynthesis' in window){
  /* 这段在 core.js 开头就跑,而词表 T() 在后面才定义:初始化推到当前脚本跑完之后;iOS 上 voiceschanged 有时不触发,再补两次 */
  setTimeout(ttsPickVoice, 0); setTimeout(ttsPickVoice, 800); setTimeout(ttsPickVoice, 3000);
  if(typeof speechSynthesis.onvoiceschanged !== 'undefined') speechSynthesis.onvoiceschanged = ttsPickVoice;
  setInterval(() => { if(speechSynthesis.speaking && !speechSynthesis.paused) speechSynthesis.resume(); }, 8000);
}
/* 设置面板的「试听」:出声了打 ✓,1.6 秒没出声打 ✗ 并说明 */
function ttsTest(){
  const box = document.getElementById('vtRes'); if(box) box.textContent = '…';
  speak('你好！我叫盼盼。');
  setTimeout(() => {
    if(box && box.textContent === '…')
      box.textContent = '✗ ' + (TTS.list.length ? TF('ttsNoSoundN', {n: TTS.list.length}) : T('voiceNone'));
  }, 1600);
}
function speak(t,onend){
  if(!('speechSynthesis' in window)){ if(!ttsWarned){toast(T('ttsUnsupported'));ttsWarned=true;} if(onend)onend(); return; }
  /* 桌面版 Chrome 的老毛病:页面加载后第一次 speak 偶尔不响,先 cancel 一次把队列叫醒(只做一次) */
  if(!TTS.warmed){ TTS.warmed = true; try{ speechSynthesis.cancel(); }catch(e){} }
  if(!TTS.voice && !TTS.plain) ttsPickVoice();     // TTS.plain 表示这次故意不指定声音,别再挑回来
  if(speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t); u.lang='zh-CN'; u.rate = SLOW ? 0.55 : 0.85; u.pitch = 1.05;
  if(TTS.voice) u.voice = TTS.voice;
  let started = false, finished = false, watchdog = null;
  const t0 = Date.now();
  u.onstart = () => {
    started = true; clearTimeout(watchdog); TTS.plain = false;   // 出声了就认这套设置

    const box = document.getElementById('vtRes'); if(box && box.textContent === '…') box.textContent = '✓ ' + T('ttsOk');
  };
  u.onend = () => {
    if(finished || TTS.cur !== u) return;          // 被后来的一句取代、或被 stopSpeak 掐掉的,不算
    finished = true; clearTimeout(watchdog); TTS.cur = null;
    if(!started && Date.now() - t0 < 400) return ttsDied(t, onend);   // 秒"念完"却没开口 = 这个声音是哑的
    if(onend) onend();
  };
  u.onerror = e => {
    if(finished || TTS.cur !== u) return;
    finished = true; clearTimeout(watchdog); TTS.cur = null;
    const r = (e && e.error) || 'error';
    if(r === 'interrupted' || r === 'canceled') return;
    ttsFail(r);                                    // 出错不当成读完,整段朗读停在这句
  };
  TTS.cur = u;
  speechSynthesis.speak(u);                        // 必须紧跟在点击之后,不能 setTimeout
  watchdog = setTimeout(() => {
    if(started || finished || TTS.cur !== u) return;
    /* 火狐和部分安卓机 onstart 来得晚,但 speaking 已经是 true —— 这是真在念,别把好声音拉黑 */
    if(speechSynthesis.speaking){ started = true; return; }
    finished = true; TTS.cur = null; ttsDied(t, onend);
  }, 1500);
}
function stopSpeak(){
  TTS.cur = null;                                  /* 先撤掉当前句,免得 cancel 触发的 onend 被当成「声音是哑的」 */
  if('speechSynthesis' in window) speechSynthesis.cancel();
  document.querySelectorAll('.drow.playing,.art.playing').forEach(e=>e.classList.remove('playing'));
  playingSeq = false;
  if(typeof SEQ !== 'undefined'){ SEQ.paused = false; SEQ.ti = null; SEQ.i = 0; }
  if(typeof seqBtns === 'function') setTimeout(seqBtns, 0);
}
function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }


/* ═══ roving tabindex:一组同类元素在 Tab 序列里只占一格,组内用方向键移动 ═══
   依据 W3C ARIA Authoring Practices 的 grid/radiogroup 模式。 */
function roveInit(group, sel){
  const items = [...group.querySelectorAll(sel)];
  items.forEach((el,i)=>{ el.tabIndex = i === 0 ? 0 : -1; });
}
function roveFocus(group, sel, el){
  group.querySelectorAll(sel).forEach(x=>{ x.tabIndex = -1; });
  el.tabIndex = 0; el.focus();
}
function rove(e, group, sel){
  const KEYS = ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'];
  if(KEYS.indexOf(e.key) < 0) return;
  const items = [...group.querySelectorAll(sel)];
  const i = items.indexOf(e.target);
  if(i < 0) return;
  e.preventDefault();
  /* 每行几个:按元素的 offsetTop 分行,不写死列数 */
  const top = items[i].offsetTop;
  let cols = items.filter(x=>x.offsetTop === top).length || 1;
  let k = i;
  if(e.key === 'ArrowRight') k = Math.min(items.length-1, i+1);
  else if(e.key === 'ArrowLeft') k = Math.max(0, i-1);
  else if(e.key === 'ArrowDown') k = Math.min(items.length-1, i+cols);
  else if(e.key === 'ArrowUp') k = Math.max(0, i-cols);
  else if(e.key === 'Home') k = 0;
  else if(e.key === 'End') k = items.length-1;
  roveFocus(group, sel, items[k]);
}


/* ═══ 行程单(顶栏入口 + 垂直单列) ═══ */
let cur = 0;
const visited = new Set();
/* 行程单条目:序号并进标题,只留第一层名称,下面接一行母语 */
function stopName(i){
  const s = SECTIONS[i];
  return s.key ? secLabel(s.key) : s.name;
}
function stopLabel(i){
  return '<b><em class="idx">' + (i+1) + '</em> ' + stopName(i) + '</b>';
}
/* 量一遍所有站名,取最宽的那条把按钮宽度定死,换站时 ◀ ▶ 不会左右跳 */
function fitStopName(){
  const el = document.getElementById('shName');
  if(!el) return;
  const cs = getComputedStyle(el);
  /* 照着真实结构量:序号是定宽块(min-width + margin),不是一个空格,
     直接拼纯文本会少算二十来像素,站名就被省略号切掉了 */
  const probe = document.createElement('span');
  probe.className = 'nm';
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:nowrap;'
    + 'width:auto;max-width:none;visibility:hidden;'
    + 'font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize
    + ';font-weight:' + cs.fontWeight + ';letter-spacing:' + cs.letterSpacing;
  document.body.append(probe);
  let w = 0;
  SECTIONS.forEach((s,i)=>{
    probe.innerHTML = '<em class="idx">' + (i+1) + '</em> ' + stopName(i);
    w = Math.max(w, probe.getBoundingClientRect().width);
  });
  probe.remove();
  el.style.width = Math.ceil(w + 4) + 'px';
  /* 计数按「11 / 11」这种最长形态定宽,否则一位数换两位数时按钮仍会跳 */
  const c = document.getElementById('shCnt');
  if(c){
    const p2 = document.createElement('span');
    const cs2 = getComputedStyle(c);
    p2.style.cssText = 'position:absolute;left:-9999px;white-space:nowrap;font-family:'
      + cs2.fontFamily + ';font-size:' + cs2.fontSize + ';font-variant-numeric:tabular-nums';
    p2.textContent = SECTIONS.length + ' / ' + SECTIONS.length;
    document.body.append(p2);
    c.style.width = Math.ceil(p2.getBoundingClientRect().width + 2) + 'px';
    p2.remove();
  }
}
function renderStops(){
  document.getElementById('stopGrid').innerHTML = SECTIONS.map((s,i)=>
    '<button class="stop-item" id="si'+i+'" onclick="pickStop('+i+')">'
    + '<span class="txt">' + stopLabel(i) + '</span>'
    + '<span class="tick">✓</span></button>').join('');
  syncStops(); fitStopName();
}
function syncStops(){
  document.querySelectorAll('.stop-item').forEach((n,j)=>{
    n.classList.toggle('on', j === cur);
    n.classList.toggle('done', visited.has(j) && j !== cur);
  });
}

function positionUnder(btnId, listId, want){
  const r = document.getElementById(btnId).getBoundingClientRect();
  const el = document.getElementById(listId);
  const w = Math.min(want, innerWidth - 16);
  let left = r.left + r.width/2 - w/2;
  left = Math.max(8, Math.min(left, innerWidth - w - 8));
  el.style.width = w + 'px';
  el.style.left = left + 'px';
}
function positionList(){ positionUnder('stopBtn','stopList',370); }
function closeMenus(){
  closeStops();
  ['setList','logPanel'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.classList.remove('open');
  });
  document.getElementById('bar').classList.remove('menu-open');
  ['menuBtn','logBtn'].forEach(id=>{
    const b = document.getElementById(id);
    if(b && b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded','false');
  });
  if(!document.getElementById('stopList').classList.contains('open'))
    document.getElementById('scrim').classList.remove('show');
}
function openStops(){
  ['setList','logPanel'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.classList.remove('open');
  });
  positionList();
  document.getElementById('bar').classList.add('open');
  document.getElementById('stopList').classList.add('open');
  document.getElementById('scrim').classList.add('show');
  document.getElementById('stopBtn').setAttribute('aria-expanded','true');
  const on = document.getElementById('si'+cur);
  if(on) on.scrollIntoView({block:'nearest'});
}
function closeStops(){
  document.getElementById('bar').classList.remove('open');
  document.getElementById('stopList').classList.remove('open');
  const other = ['setList','logPanel'].some(id=>{
    const el = document.getElementById(id); return el && el.classList.contains('open');
  });
  if(!other) document.getElementById('scrim').classList.remove('show');
  document.getElementById('stopBtn').setAttribute('aria-expanded','false');
}
function toggleStops(){ document.getElementById('stopList').classList.contains('open') ? closeStops() : openStops(); }
document.getElementById('stopBtn').onclick = toggleStops;
/* closePanel 定义在 dev/assets-panel.js,学生页(无 ?dev=1)不加载它,
   直接调会 ReferenceError —— 第一步登记的隐患,这里补上存在性判断。
   顺带让 Esc 也能退出全屏(练一练/听写/翻牌),与 fBack 一致。 */
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){
  closeMenus();
  if(typeof closePanel === 'function') closePanel();
  const f = document.getElementById('full');
  if(f && f.classList.contains('on') && typeof fullClose === 'function') fullClose();
} });
addEventListener('resize', ()=>{
  PP.fire(PP.resize);
  if(document.getElementById('stopList').classList.contains('open')) positionList();
  [['menuBtn','setList',330],['logBtn','logPanel',430]].forEach(([b,l,w])=>{
    if(document.getElementById(l).classList.contains('open')) positionUnder(b,l,w);
  });
});

function pickStop(i){ closeStops(); goStop(i); }
function goStop(i){
  cur = i; visited.add(i);
  EV('stop_view', LID + '.stop' + (i+1), {name:SECTIONS[i].name});
  if(mode === 'one'){ renderOne(); window.scrollTo({top:0}); }
  else { const el = document.getElementById('sec'+i); if(el) el.scrollIntoView({block:'start'}); }
  syncHead();
}
function renderNext(){
  const bar = document.getElementById('nextBar');
  if(!bar) return;
  if(mode === 'all'){ bar.innerHTML = ''; return; }
  if(cur >= SECTIONS.length - 1){
    bar.innerHTML = '<span class="nextbtn done">🎉 ' + T('lessonDone') + '</span>';
    return;
  }
  bar.innerHTML = '<button class="nextbtn" onclick="go(1)">'
    + T('nextStop') + '<span class="arw">→</span></button>';
}
function syncHead(){
  const s = SECTIONS[cur];
  document.getElementById('shName').innerHTML =
    '<em class="idx">' + (cur+1) + '</em> ' + stopName(cur);
  document.getElementById('shCnt').textContent = (cur+1) + ' / ' + SECTIONS.length;
  document.getElementById('hairline').style.width = ((cur+1)/SECTIONS.length*100) + '%';
  syncStops();
  document.getElementById('pfill').style.width = (visited.size/SECTIONS.length*100) + '%';
  document.getElementById('ptext').textContent = visited.size + ' / ' + SECTIONS.length;
  document.getElementById('prev').disabled = (mode==='one' && cur===0);
  document.getElementById('next').disabled = (mode==='one' && cur===SECTIONS.length-1);
  renderNext(); syncEdge();
}
function secHead(i){
  const s = SECTIONS[i];
  return '<div class="sec-head"><span class="big">'+s.icon+'</span>'
   + '<div><h2' + (s.key ? ' data-t="'+s.key+'"' : '') + '>' + (s.key ? secLabel(s.key) : s.name) + '</h2>'
   + '<div class="sub t-only">'+s.sub+'</div></div></div>';
}
function renderOne(){
  stopSpeak();
  const c = document.getElementById('content');
  c.innerHTML = '<div class="stopsec" id="sec'+cur+'">' + secHead(cur)
    + '<div class="cards">' + SECTIONS[cur].render() + '</div></div>';
  if(SECTIONS[cur].after) SECTIONS[cur].after();
  kkAll(c); initArts(c); PP.fire(PP.afterRender); applyLang(c);
}
function renderAll(){
  stopSpeak();
  const c = document.getElementById('content');
  c.innerHTML = SECTIONS.map((s,i)=>'<div class="stopsec" id="sec'+i+'">' + secHead(i)
    + '<div class="cards">' + s.render() + '</div></div>').join('');
  SECTIONS.forEach(s=>{ if(s.after) s.after(); });
  SECTIONS.forEach((s,i)=>visited.add(i));
  kkAll(c); initArts(c); PP.fire(PP.afterRender); applyLang(c);
}
/* 换节动画。三条路径共用:顶栏箭头、底部按钮、边缘箭头、滑动。
   全课模式与 reduced-motion 下直接跳,不播动画。 */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let animating = false;
function go(d){
  const n = cur + d;
  if(n < 0 || n >= SECTIONS.length || animating) return;
  const c = document.getElementById('content');
  if(mode !== 'one' || REDUCED){ goStop(n); return; }
  animating = true;
  c.style.transition = 'transform .16s ease-in, opacity .16s ease-in';
  c.style.transform = 'translateX(' + (d > 0 ? -40 : 40) + 'px)';
  c.style.opacity = '0';
  setTimeout(()=>{
    goStop(n);
    c.style.transition = 'none';
    c.style.transform = 'translateX(' + (d > 0 ? 40 : -40) + 'px)';
    requestAnimationFrame(()=>{
      c.style.transition = 'transform .24s cubic-bezier(.2,.8,.3,1), opacity .24s';
      c.style.transform = 'translateX(0)';
      c.style.opacity = '1';
      setTimeout(()=>{ c.style.transition = ''; animating = false; }, 250);
    });
  }, 165);
}
function slideReset(){
  const c = document.getElementById('content');
  c.style.transition = 'transform .2s cubic-bezier(.2,.8,.3,1)';
  c.style.transform = 'translateX(0)';
  setTimeout(()=>{ if(!animating) c.style.transition = ''; }, 210);
}
document.getElementById('prev').onclick = ()=>go(-1);
document.getElementById('next').onclick = ()=>go(1);


/* ═══ 换节的两条快捷路径 ═══
   触屏:左右滑。桌面:鼠标靠近边缘浮现箭头。 */
const EDGE = { prev:document.getElementById('edgePrev'), next:document.getElementById('edgeNext') };
EDGE.prev.onclick = ()=>go(-1);
EDGE.next.onclick = ()=>go(1);
function syncEdge(){
  EDGE.prev.disabled = (mode === 'one' && cur === 0);
  EDGE.next.disabled = (mode === 'one' && cur === SECTIONS.length - 1);
}
addEventListener('mousemove', e=>{
  if(mode !== 'one') { EDGE.prev.classList.remove('show'); EDGE.next.classList.remove('show'); return; }
  const z = 76;
  EDGE.prev.classList.toggle('show', e.clientX < z && e.clientY > 120);
  EDGE.next.classList.toggle('show', e.clientX > innerWidth - z && e.clientY > 120);
}, {passive:true});

/* 滑动换节:内容跟着手指走,松手超过阈值就翻页,不够就弹回。
   方向在第一次移动时锁定——横滑才接管,纵滑一律让给页面滚动。
   田字格、听写面板、翻牌区、菜单内不响应,那几处本身要用手势。 */
let swX = 0, swY = 0, swOK = false, swDir = 0;   /* swDir: 0 未定 · 1 横滑 · -1 纵滚 */
const SWIPE_SKIP = '#full, canvas, .memory, .menu, #panel';
const SW_MIN = 70;      /* 触发翻页的最小位移 */
const SW_MAX = 72;      /* 跟手位移上限,不把内容整块拖走 */
addEventListener('touchstart', e=>{
  swOK = false; swDir = 0;
  if(animating || mode !== 'one') return;
  if(e.touches.length !== 1 || (e.target.closest && e.target.closest(SWIPE_SKIP))) return;
  swOK = true; swX = e.touches[0].clientX; swY = e.touches[0].clientY;
}, {passive:true});
addEventListener('touchmove', e=>{
  if(!swOK) return;
  const dx = e.touches[0].clientX - swX, dy = e.touches[0].clientY - swY;
  if(swDir === 0){
    if(Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    swDir = Math.abs(dx) > Math.abs(dy) * 1.4 ? 1 : -1;
    if(swDir === -1) swOK = false;
    return;
  }
  if(swDir !== 1) return;
  e.preventDefault();
  /* 到头的方向加重阻尼,手感上告诉用户没有下一节了 */
  const edge = (dx < 0 && cur === SECTIONS.length - 1) || (dx > 0 && cur === 0);
  const k = edge ? 0.16 : 0.42;
  const off = Math.sign(dx) * Math.min(SW_MAX, Math.abs(dx) * k);
  const c = document.getElementById('content');
  c.style.transition = 'none';
  c.style.transform = 'translateX(' + off.toFixed(1) + 'px)';
}, {passive:false});
addEventListener('touchend', e=>{
  if(!swOK) return;
  const wasH = swDir === 1;
  swOK = false; swDir = 0;
  if(!wasH) return;
  const dx = e.changedTouches[0].clientX - swX, dy = e.changedTouches[0].clientY - swY;
  const d = dx < 0 ? 1 : -1;
  if(Math.abs(dx) >= SW_MIN && Math.abs(dx) > Math.abs(dy) * 1.4
     && cur + d >= 0 && cur + d < SECTIONS.length){
    EV('setting', LID + '.swipe', {dir:d});
    go(d);
  } else slideReset();
}, {passive:true});
addEventListener('touchcancel', ()=>{ if(swOK && swDir === 1) slideReset(); swOK = false; swDir = 0; }, {passive:true});

/* 全课模式:站名随滚动跟随 */
let ticking = false;
addEventListener('scroll', ()=>{
  if(mode!=='all' || ticking) return;
  ticking = true;
  requestAnimationFrame(()=>{
    let k = 0;
    SECTIONS.forEach((s,i)=>{ const el = document.getElementById('sec'+i);
      if(el && el.getBoundingClientRect().top <= 120) k = i; });
    if(k !== cur){ cur = k; syncHead(); }
    ticking = false;
  });
}, {passive:true});


/* ═══ 顶栏按钮 ═══ */
function label(btn,txt){ const l = btn.querySelector('.lb'); if(l) l.textContent = txt; }

/* ═══ 界面语言:结构对齐正式版 engine 的 I18N / LANGCODE(en·zh·id) ═══
   只译界面,不碰课程内容(课文、生词、例句一律保持中文原文)。 */
const I18N = {
 zh:{tfYes:'对', tfNo:'不对', nextStop:'下一节', lessonDone:'这一课学完了', howToUse:'怎么用', set:'设置', tlayer:'教师层', log:'学习记录', assets:'制作清单', capSet:'设 置', capLog:'学 习 记 录',
     uiLang:'界面语言', fsLabel:'正文字号', fsS:'小', fsM:'普通', fsL:'大',
     pyLabel:'拼音', trLabel:'译文', spLabel:'朗读速度', spNormal:'常速', spSlow:'慢速',
     voiceLabel:'朗读声音', voiceAuto:'自动', voiceTest:'试听', voiceNone:'此设备没有中文声音,请在系统设置里下载中文语音', ttsOk:'出声了', ttsUnsupported:'此浏览器不支持朗读', ttsNotAllowed:'浏览器拦住了朗读,先点一下页面任意位置再按播放', ttsNoStart:'朗读没有发出声音,多半是设备没装中文语音或浏览器被静音', ttsSynthFail:'语音合成失败,换一个声音或换个浏览器试试', ttsBusy:'另一个程序正在占用声音,关掉再试', ttsNoVoice:'这台设备没有中文语音,要在系统设置里加一个', ttsVoiceBad:'选中的声音用不了,换一个试试', ttsNoSoundN:'没出声(声音有 {n} 个),换一个试试',
     readLabel:'阅读方式', readOne:'单站', readAll:'全课', themeLabel:'主题', themeDay:'白天', themeNight:'夜间',
     on:'开', off:'关', logCopy:'复制记录', logClear:'清空', logEmpty:'还没有记录。做几道题、点几个字就会出现。',
     prevT:'上一站', nextT:'下一站', stopT:'点开行程单', home:'书架',
     tsOn:'教师层已打开:场景说明、注音提示、听力文本', tsOff:'教师层已关闭',
 /* 2026-09-15 一级 v5 预览:说明文字全部进词表,四语。zh 一列与原硬编码逐字相同。 */
 playAll:'▶ 整段朗读', pause:'⏸ 暂停', resume:'▶ 继续', stop:'■ 停止', artCap:'点图片:画面随朗读逐行播放',
 memPick:'选一关开始', memLv1:'第一关 · 看牌配对', memLv2:'第二关 · 进阶挑战 · 扣牌记忆',
 memWin1:'✅ 第一关过了,用了 {t} 秒', memBest1:'最快一次:{t} 秒　·　下一关把牌扣过来,凭记忆再配一遍', memBest2:'最快一次:{t} 秒',
 memGo2:'进阶挑战 · 扣牌记忆', memAgain1:'再玩一次第一关', memBack:'回去看牌', memWin2:'🎉 进阶挑战通过,用了 {t} 秒',
 memAgain2:'再挑战一次', memTo1:'回第一关', memTodo:'(译文待补)',
 fcIntro:'这一局是{name}的 {n} 个生词。先点牌听一遍,记住每个词怎么读、什么意思。',
 fcL1:'<b>第一关</b>牌都摊着,把中文词和它的拼音译文点成对;', fcL2:'<b>第二关</b>牌全扣成白板,凭记忆翻牌配对。两关都可以直接选。',
 fcBtn1:'第一关 · 连连看', fcBtn2:'第二关 · 白板翻牌', ttsNoSound:'没有声音?请把音量调大、关掉静音;在微信或 WhatsApp 里打开的话,请改用 Safari 或 Chrome 打开这个网址。', fcDeck:'第{n}拨', fcDeckNumbers:'数字一到十', fcDeckWords:'生词', fcPairs:'{n} 对',
 hzTip:'点下面任意一个字:大格里演示笔顺,这里给出读音和例词。', hzPractice:'✍ 练一练', hzDict:'🎧 听写',
 hzNote:'点字看笔顺;「练一练」照着轮廓写、错两次给下一笔提示;「听写」只报读音与例词,凭记忆写。', hzListen:'🔊 听词', hzPickFirst:'先点一个字',
 fullPractice:'练一练', fullDict:'听写', fullTipP:'照着淡色轮廓写。写错两次会亮出下一笔的起点。', fullTipD:'只给读音和例词,不给字形。凭记忆在田字格里写出来。',
 fExample:'例词', fExamplePy:'例词读音', fPlay:'🔊 再听一遍', fHint:'提示下一笔', fSkip:'跳过', fAgain:'再来一遍',
 fAllRight:'全部一次写对! ⭐⭐⭐', fScore:'写完 {n} 个字,错了 {m} 笔。再来一遍试试全对。', back:'← 返回',
 wbIntroP:'听一听、读一读，完成后检查答案。', wbIntroE:'听力与阅读各10题。作答时不判对错，20题答齐后一起交卷。', wbTts:'试听使用设备语音，正式录音待制作。',
 wbListen:'▶ 听一听', wbStop:'■ 停止朗读', wbFill:'填写答案', wbCheck:'检查', wbRead:'我读好了', wbReadDone:'✓ 已读过', wbRetryOne:'再试一次',
 wbSubmit:'交卷', wbRedo:'重做错题', wbOk:'正确。', wbNo:'再试试看。', wbReadLogged:'已记录跟读。', wbProgress:'已答 {n} / {t} 题',
 wbScore:'本次 {s} / 20　听力 {l} / 10　阅读 {r} / 10', wbNoTts:'当前浏览器不能朗读，请教师按朗读稿读题。', wbTtsErr:'设备语音暂不可用，请教师按稿朗读。',
 caution:'注意：', wbConfirm:'确认', wbPickTone:'选声调:', wbNeedAll:'20 题都答完才能交卷',
 wbExamIntro:'模拟测练按 HSK 一级题型:听力 {l} 题、阅读 {r} 题,共 {n} 题,限时 {m} 分钟。', wbExamRules:'点「开始答题」后开始计时,中途不要离开;{n} 题都答完按「交卷」,到时自动交卷,交卷后才看分数。', wbExamStart:'开始答题', wbTimeLeft:'剩余 {t}', wbNoLeave:'计时中,中途不要离开', wbTimeUp:'时间到,已自动交卷。'},
 en:{tfYes:'True', tfNo:'False', nextStop:'Next', lessonDone:'Lesson complete', howToUse:'How to use it', set:'Settings', tlayer:'Teacher', log:'Activity', assets:'Assets', capSet:'S E T T I N G S', capLog:'A C T I V I T Y',
     uiLang:'Interface language', fsLabel:'Text size', fsS:'Small', fsM:'Normal', fsL:'Large',
     pyLabel:'Pinyin', trLabel:'Translation', spLabel:'Reading speed', spNormal:'Normal', spSlow:'Slow',
     voiceLabel:'Voice', voiceAuto:'Auto', voiceTest:'Test', voiceNone:'No Chinese voice on this device; download one in system settings', ttsOk:'Sound OK', ttsUnsupported:'This browser cannot read aloud', ttsNotAllowed:'The browser blocked speech. Tap anywhere on the page, then press play again.', ttsNoStart:'No sound came out. The device probably has no Chinese voice installed, or the browser is muted.', ttsSynthFail:'Speech failed. Try another voice or another browser.', ttsBusy:'Another app is using the audio. Close it and try again.', ttsNoVoice:'This device has no Chinese voice. Add one in system settings.', ttsVoiceBad:'That voice does not work. Try another one.', ttsNoSoundN:'No sound ({n} voices found). Try another voice.',
     readLabel:'Reading mode', readOne:'One stop', readAll:'Whole lesson', themeLabel:'Theme', themeDay:'Day', themeNight:'Night',
     on:'On', off:'Off', logCopy:'Copy log', logClear:'Clear', logEmpty:'Nothing yet. Answer a question or tap a character.',
     prevT:'Previous stop', nextT:'Next stop', stopT:'Open the route', home:'Shelf',
     tsOn:'Teacher layer on: scene notes, pinyin tips, listening scripts', tsOff:'Teacher layer off',
 playAll:'▶ Play the whole dialogue', pause:'⏸ Pause', resume:'▶ Resume', stop:'■ Stop', artCap:'Tap the picture: it plays line by line',
 memPick:'Pick a level to start', memLv1:'Level 1 · Match face-up', memLv2:'Level 2 · Challenge · Face-down memory',
 memWin1:'✅ Level 1 done in {t} s', memBest1:'Best time: {t} s　·　Next level: cards go face down, match from memory', memBest2:'Best time: {t} s',
 memGo2:'Challenge · Face-down memory', memAgain1:'Play level 1 again', memBack:'Back to the cards', memWin2:'🎉 Challenge passed in {t} s',
 memAgain2:'Try again', memTo1:'Back to level 1', memTodo:'(translation pending)',
 fcIntro:'This round has the {n} new words of {name}. Tap the cards first to hear them and remember how each word sounds and what it means.',
 fcL1:' <b>Level 1</b>: all cards face up. Match each Chinese word with its pinyin and meaning.', fcL2:' <b>Level 2</b>: all cards face down. Flip and match from memory. You can start either level.',
 fcBtn1:'Level 1 · Matching', fcBtn2:'Level 2 · Face-down', ttsNoSound:'No sound? Turn the volume up and switch off silent mode. If you opened this inside WeChat or WhatsApp, open the link in Safari or Chrome instead.', fcDeck:'Set {n}', fcDeckNumbers:'Numbers 1 to 10', fcDeckWords:'New words', fcPairs:'{n} pairs',
 hzTip:'Tap any character below: the big box shows the stroke order, and this panel shows the reading and an example word.', hzPractice:'✍ Practice', hzDict:'🎧 Dictation',
 hzNote:'Tap a character to see its strokes. Practice: trace the outline; after two mistakes the next stroke is shown. Dictation: only the reading and example word are given; write from memory.', hzListen:'🔊 Hear the word', hzPickFirst:'Tap a character first',
 fullPractice:'Practice', fullDict:'Dictation', fullTipP:'Trace the light outline. After two mistakes the start of the next stroke lights up.', fullTipD:'Only the reading and example word are given, not the shape. Write it from memory in the grid.',
 fExample:'Example word', fExamplePy:'Example word (pinyin)', fPlay:'🔊 Hear it again', fHint:'Show next stroke', fSkip:'Skip', fAgain:'Once more',
 fAllRight:'All correct on the first try! ⭐⭐⭐', fScore:'{n} characters written, {m} wrong strokes. Try again for a perfect round.', back:'← Back',
 wbIntroP:'Listen and read, then check your answers.', wbIntroE:'10 listening and 10 reading items. Answers are not marked while you work; submit once all 20 are answered.', wbTts:'Preview uses the device voice; studio recordings are coming.',
 wbListen:'▶ Listen', wbStop:'■ Stop', wbFill:'Your answer', wbCheck:'Check', wbRead:'I have read it', wbReadDone:'✓ Read', wbRetryOne:'Try again',
 wbSubmit:'Submit', wbRedo:'Redo wrong ones', wbOk:'Correct.', wbNo:'Try again.', wbReadLogged:'Reading recorded.', wbProgress:'{n} of {t} answered',
 wbScore:'Score {s} / 20　Listening {l} / 10　Reading {r} / 10', wbNoTts:'This browser cannot read aloud. Teacher, please read the script.', wbTtsErr:'Device voice unavailable. Teacher, please read the script.',
 caution:'Note: ', wbConfirm:'Confirm', wbPickTone:'Pick the tone:', wbNeedAll:'Answer all 20 to submit',
 wbExamIntro:'Mock test in HSK Level 1 format: {l} listening and {r} reading items, {n} in total, {m} minutes.', wbExamRules:'The timer starts when you press Start; do not leave during the test. Submit after answering all {n}; it submits automatically when time is up. Scores show after submitting.', wbExamStart:'Start', wbTimeLeft:'{t} left', wbNoLeave:'Timer running — do not leave', wbTimeUp:'Time is up; submitted automatically.'},
 km:{tfYes:'ត្រូវ', tfNo:'ខុស', nextStop:'បន្ទាប់', lessonDone:'ចប់មេរៀន', howToUse:'របៀបប្រើ', set:'ការកំណត់', tlayer:'គ្រូ', log:'សកម្មភាព', assets:'ធនធាន',
     capSet:'ក ា រ ក ំ ណ ត ់', capLog:'ស ក ម្ម ភ ា ព',
     uiLang:'ភាសាចំណុចប្រទាក់', fsLabel:'ទំហំអក្សរ', fsS:'តូច', fsM:'ធម្មតា', fsL:'ធំ',
     pyLabel:'ពិនអ៊ិន', trLabel:'ការបកប្រែ', spLabel:'ល្បឿនអាន', spNormal:'ធម្មតា', spSlow:'យឺត',
     voiceLabel:'សំឡេងអាន', voiceAuto:'ស្វ័យប្រវត្តិ', voiceTest:'សាកល្បង', voiceNone:'គ្មានសំឡេងភាសាចិននៅលើឧបករណ៍នេះទេ សូមទាញយកក្នុងការកំណត់ប្រព័ន្ធ', ttsOk:'មានសំឡេង', ttsUnsupported:'កម្មវិធីរុករកនេះអានមិនបាន', ttsNotAllowed:'កម្មវិធីរុករកបានរារាំងការអាន។ ចុចកន្លែងណាមួយលើទំព័រ រួចចុចចាក់ម្តងទៀត។', ttsNoStart:'គ្មានសំឡេងចេញមកទេ។ ឧបករណ៍ប្រហែលគ្មានសំឡេងភាសាចិន ឬកម្មវិធីរុករកបិទសំឡេង។', ttsSynthFail:'ការអានបរាជ័យ។ សាកសំឡេងផ្សេង ឬកម្មវិធីរុករកផ្សេង។', ttsBusy:'កម្មវិធីផ្សេងកំពុងប្រើសំឡេង។ បិទវា រួចសាកម្តងទៀត។', ttsNoVoice:'ឧបករណ៍នេះគ្មានសំឡេងភាសាចិន។ សូមបន្ថែមក្នុងការកំណត់ប្រព័ន្ធ។', ttsVoiceBad:'សំឡេងនោះប្រើមិនបាន។ សាកមួយផ្សេង។', ttsNoSoundN:'គ្មានសំឡេង (មានសំឡេង {n})។ សាកមួយផ្សេង។',
     readLabel:'របៀបអាន', readOne:'មួយចំណុច', readAll:'ទាំងមេរៀន',
     themeLabel:'ផ្ទៃ', themeDay:'ថ្ងៃ', themeNight:'យប់',
     on:'បើក', off:'បិទ', logCopy:'ចម្លងកំណត់ត្រា', logClear:'សម្អាត',
     logEmpty:'មិនទាន់មាន។ ឆ្លើយសំណួរ ឬចុចតួអក្សរណាមួយ។',
     prevT:'ចំណុចមុន', nextT:'ចំណុចបន្ទាប់', stopT:'បើកផ្លូវ', home:'ធ្នើសៀវភៅ',
     tsOn:'បើកស្រទាប់គ្រូ', tsOff:'បិទស្រទាប់គ្រូ',
 playAll:'▶ អានទាំងកថាខណ្ឌ', pause:'⏸ ផ្អាក', resume:'▶ បន្ត', stop:'■ ឈប់', artCap:'ចុចរូប៖ អានម្តងមួយបន្ទាត់',
 memPick:'ជ្រើសកម្រិតដើម្បីចាប់ផ្តើម', memLv1:'កម្រិត ១ · ផ្គូផ្គងសន្លឹកបើក', memLv2:'កម្រិត ២ · ប្រកួត · សន្លឹកបិទ',
 memWin1:'✅ កម្រិត ១ រួចរាល់ក្នុង {t} វិនាទី', memBest1:'លឿនបំផុត៖ {t} វិនាទី　·　កម្រិតបន្ទាប់៖ សន្លឹកបិទ ផ្គូផ្គងតាមការចងចាំ', memBest2:'លឿនបំផុត៖ {t} វិនាទី',
 memGo2:'ប្រកួត · សន្លឹកបិទ', memAgain1:'លេងកម្រិត ១ ម្តងទៀត', memBack:'ត្រឡប់មើលសន្លឹក', memWin2:'🎉 ឆ្លងកម្រិត ២ ក្នុង {t} វិនាទី',
 memAgain2:'ព្យាយាមម្តងទៀត', memTo1:'ត្រឡប់កម្រិត ១', memTodo:'(ការបកប្រែនឹងបំពេញ)',
 fcIntro:'ជុំនេះមានពាក្យថ្មី {n} ពាក្យពី{name}។ ចុចសន្លឹកស្តាប់មុន ចាំថាពាក្យនីមួយៗអានយ៉ាងណា មានន័យអ្វី។',
 fcL1:' <b>កម្រិត ១</b>៖ សន្លឹកទាំងអស់បើក។ ផ្គូផ្គងពាក្យចិនជាមួយពិនអ៊ិននិងអត្ថន័យ។', fcL2:' <b>កម្រិត ២</b>៖ សន្លឹកទាំងអស់បិទ។ បើកហើយផ្គូផ្គងតាមការចងចាំ។ ជ្រើសកម្រិតណាក៏បាន។',
 fcBtn1:'កម្រិត ១ · ផ្គូផ្គង', fcBtn2:'កម្រិត ២ · សន្លឹកបិទ', ttsNoSound:'គ្មានសំឡេង? សូមបង្កើនកម្រិតសំឡេង និងបិទរបៀបស្ងាត់។ បើបើកក្នុង WeChat ឬ WhatsApp សូមបើកតំណនេះក្នុង Safari ឬ Chrome វិញ។', fcDeck:'សំណុំទី {n}', fcDeckNumbers:'លេខ ១ ដល់ ១០', fcDeckWords:'ពាក្យថ្មី', fcPairs:'{n} គូ',
 hzTip:'ចុចតួអក្សរណាមួយខាងក្រោម៖ ប្រអប់ធំបង្ហាញលំដាប់ខ្សែ ហើយផ្ទាំងនេះបង្ហាញការអាននិងពាក្យឧទាហរណ៍។', hzPractice:'✍ អនុវត្ត', hzDict:'🎧 សរសេរតាមអាន',
 hzNote:'ចុចអក្សរដើម្បីមើលខ្សែ។ អនុវត្ត៖ សរសេរតាមស្រមោល ខុសពីរដងនឹងបង្ហាញខ្សែបន្ទាប់។ សរសេរតាមអាន៖ ឲ្យតែការអាននិងពាក្យឧទាហរណ៍ សរសេរតាមការចងចាំ។', hzListen:'🔊 ស្តាប់ពាក្យ', hzPickFirst:'ចុចអក្សរមួយមុន',
 fullPractice:'អនុវត្ត', fullDict:'សរសេរតាមអាន', fullTipP:'សរសេរតាមស្រមោលស្រាល។ ខុសពីរដង ចំណុចចាប់ផ្តើមខ្សែបន្ទាប់នឹងភ្លឺ។', fullTipD:'ឲ្យតែការអាននិងពាក្យឧទាហរណ៍ មិនឲ្យរូបអក្សរទេ។ សរសេរតាមការចងចាំក្នុងក្រឡា។',
 fExample:'ពាក្យឧទាហរណ៍', fExamplePy:'ពាក្យឧទាហរណ៍ (ពិនអ៊ិន)', fPlay:'🔊 ស្តាប់ម្តងទៀត', fHint:'បង្ហាញខ្សែបន្ទាប់', fSkip:'រំលង', fAgain:'ម្តងទៀត',
 fAllRight:'ត្រូវទាំងអស់តែម្តង! ⭐⭐⭐', fScore:'សរសេរ {n} អក្សរ ខុស {m} ខ្សែ។ ព្យាយាមម្តងទៀតឲ្យត្រូវទាំងអស់។', back:'← ត្រឡប់',
 wbIntroP:'ស្តាប់និងអាន រួចពិនិត្យចម្លើយ។', wbIntroE:'ស្តាប់ ១០ សំណួរ អាន ១០ សំណួរ។ ពេលធ្វើមិនដាក់ពិន្ទុទេ ឆ្លើយគ្រប់ ២០ សំណួររួចដាក់ស្នើ។', wbTts:'ការមើលសាកប្រើសំឡេងឧបករណ៍ ការថតផ្លូវការនឹងមក។',
 wbListen:'▶ ស្តាប់', wbStop:'■ ឈប់', wbFill:'ចម្លើយរបស់អ្នក', wbCheck:'ពិនិត្យ', wbRead:'ខ្ញុំអានរួចហើយ', wbReadDone:'✓ អានរួច', wbRetryOne:'ព្យាយាមម្តងទៀត',
 wbSubmit:'ដាក់ស្នើ', wbRedo:'ធ្វើឡើងវិញសំណួរខុស', wbOk:'ត្រឹមត្រូវ។', wbNo:'ព្យាយាមម្តងទៀត។', wbReadLogged:'បានកត់ត្រាការអាន។', wbProgress:'ឆ្លើយ {n} / {t}',
 wbScore:'ពិន្ទុ {s} / 20　ស្តាប់ {l} / 10　អាន {r} / 10', wbNoTts:'កម្មវិធីរុករកនេះអានមិនបាន សូមគ្រូអានតាមអត្ថបទ។', wbTtsErr:'សំឡេងឧបករណ៍មិនអាចប្រើបាន សូមគ្រូអានតាមអត្ថបទ។',
 caution:'ចំណាំ៖ ', wbConfirm:'បញ្ជាក់', wbPickTone:'ជ្រើសសំឡេង៖', wbNeedAll:'ឆ្លើយគ្រប់ ២០ សំណួរទើបដាក់ស្នើបាន',
 wbExamIntro:'តេស្តសាកល្បងតាមទម្រង់ HSK កម្រិត ១៖ ស្តាប់ {l} សំណួរ អាន {r} សំណួរ សរុប {n} សំណួរ រយៈពេល {m} នាទី។', wbExamRules:'ម៉ោងចាប់ផ្តើមរាប់ពេលចុចចាប់ផ្តើម កុំចាកចេញពាក់កណ្តាល។ ឆ្លើយគ្រប់ {n} សំណួររួចដាក់ស្នើ ដល់ម៉ោងនឹងដាក់ស្នើដោយស្វ័យប្រវត្តិ។ ពិន្ទុបង្ហាញក្រោយដាក់ស្នើ។', wbExamStart:'ចាប់ផ្តើម', wbTimeLeft:'នៅសល់ {t}', wbNoLeave:'កំពុងរាប់ម៉ោង កុំចាកចេញ', wbTimeUp:'អស់ម៉ោង បានដាក់ស្នើដោយស្វ័យប្រវត្តិ។'},
 id:{tfYes:'Benar', tfNo:'Salah', nextStop:'Berikutnya', lessonDone:'Pelajaran selesai', howToUse:'Cara pakai', set:'Pengaturan', tlayer:'Guru', log:'Aktivitas', assets:'Aset', capSet:'P E N G A T U R A N', capLog:'A K T I V I T A S',
     uiLang:'Bahasa antarmuka', fsLabel:'Ukuran teks', fsS:'Kecil', fsM:'Normal', fsL:'Besar',
     pyLabel:'Pinyin', trLabel:'Terjemahan', spLabel:'Kecepatan baca', spNormal:'Normal', spSlow:'Pelan',
     voiceLabel:'Suara', voiceAuto:'Otomatis', voiceTest:'Coba', voiceNone:'Tidak ada suara bahasa Mandarin di perangkat ini; unduh di pengaturan sistem', ttsOk:'Ada suara', ttsUnsupported:'Browser ini tidak bisa membaca', ttsNotAllowed:'Browser memblokir suara. Ketuk di mana saja pada halaman, lalu tekan putar lagi.', ttsNoStart:'Tidak ada suara. Perangkat mungkin belum punya suara bahasa Mandarin, atau browser dibisukan.', ttsSynthFail:'Pembacaan gagal. Coba suara lain atau browser lain.', ttsBusy:'Aplikasi lain sedang memakai audio. Tutup dulu lalu coba lagi.', ttsNoVoice:'Perangkat ini tidak punya suara bahasa Mandarin. Tambahkan di pengaturan sistem.', ttsVoiceBad:'Suara itu tidak bisa dipakai. Coba yang lain.', ttsNoSoundN:'Tidak ada suara ({n} suara tersedia). Coba suara lain.',
     readLabel:'Mode baca', readOne:'Satu pos', readAll:'Satu pelajaran', themeLabel:'Tema', themeDay:'Siang', themeNight:'Malam',
     on:'Aktif', off:'Mati', logCopy:'Salin log', logClear:'Hapus', logEmpty:'Belum ada. Jawab soal atau ketuk sebuah karakter.',
     prevT:'Pos sebelumnya', nextT:'Pos berikutnya', stopT:'Buka rute', home:'Rak buku',
     tsOn:'Lapisan guru aktif: catatan adegan, pinyin, teks simakan', tsOff:'Lapisan guru mati',
 playAll:'▶ Putar seluruh dialog', pause:'⏸ Jeda', resume:'▶ Lanjut', stop:'■ Berhenti', artCap:'Ketuk gambar: diputar baris demi baris',
 memPick:'Pilih level untuk mulai', memLv1:'Level 1 · Pasangkan kartu terbuka', memLv2:'Level 2 · Tantangan · Kartu tertutup',
 memWin1:'✅ Level 1 selesai dalam {t} detik', memBest1:'Tercepat: {t} detik　·　Level berikut: kartu ditutup, pasangkan dari ingatan', memBest2:'Tercepat: {t} detik',
 memGo2:'Tantangan · Kartu tertutup', memAgain1:'Main level 1 lagi', memBack:'Kembali lihat kartu', memWin2:'🎉 Tantangan lolos dalam {t} detik',
 memAgain2:'Coba lagi', memTo1:'Kembali ke level 1', memTodo:'(terjemahan menyusul)',
 fcIntro:'Ronde ini berisi {n} kata baru dari {name}. Ketuk kartu dulu untuk mendengar, ingat bunyi dan arti setiap kata.',
 fcL1:' <b>Level 1</b>: semua kartu terbuka. Pasangkan kata Mandarin dengan pinyin dan artinya.', fcL2:' <b>Level 2</b>: semua kartu ditutup. Balik dan pasangkan dari ingatan. Kedua level bisa langsung dipilih.',
 fcBtn1:'Level 1 · Pasangkan', fcBtn2:'Level 2 · Kartu tertutup', ttsNoSound:'Tidak ada suara? Besarkan volume dan matikan mode senyap. Kalau dibuka di dalam WeChat atau WhatsApp, buka tautan ini di Safari atau Chrome.', fcDeck:'Set {n}', fcDeckNumbers:'Angka 1 sampai 10', fcDeckWords:'Kata baru', fcPairs:'{n} pasang',
 hzTip:'Ketuk salah satu karakter di bawah: kotak besar memperagakan urutan goresan, panel ini menampilkan bacaan dan contoh kata.', hzPractice:'✍ Latihan', hzDict:'🎧 Dikte',
 hzNote:'Ketuk karakter untuk melihat goresannya. Latihan: jiplak garis luar; salah dua kali, goresan berikutnya ditunjukkan. Dikte: hanya bacaan dan contoh kata; tulis dari ingatan.', hzListen:'🔊 Dengar kata', hzPickFirst:'Ketuk satu karakter dulu',
 fullPractice:'Latihan', fullDict:'Dikte', fullTipP:'Jiplak garis luar yang samar. Salah dua kali, titik awal goresan berikutnya menyala.', fullTipD:'Hanya bacaan dan contoh kata, tanpa bentuk. Tulis dari ingatan di dalam kotak.',
 fExample:'Contoh kata', fExamplePy:'Contoh kata (pinyin)', fPlay:'🔊 Dengar lagi', fHint:'Tunjukkan goresan berikut', fSkip:'Lewati', fAgain:'Sekali lagi',
 fAllRight:'Semua benar sekali jadi! ⭐⭐⭐', fScore:'{n} karakter selesai, {m} goresan salah. Coba lagi supaya semua benar.', back:'← Kembali',
 wbIntroP:'Dengar dan baca, lalu periksa jawaban.', wbIntroE:'Simakan dan bacaan masing-masing 10 soal. Selama mengerjakan tidak dinilai; kirim setelah 20 soal terjawab.', wbTts:'Pratinjau memakai suara perangkat; rekaman resmi menyusul.',
 wbListen:'▶ Dengar', wbStop:'■ Berhenti', wbFill:'Jawabanmu', wbCheck:'Periksa', wbRead:'Sudah saya baca', wbReadDone:'✓ Sudah dibaca', wbRetryOne:'Coba lagi',
 wbSubmit:'Kirim', wbRedo:'Ulangi yang salah', wbOk:'Benar.', wbNo:'Coba lagi.', wbReadLogged:'Bacaan tercatat.', wbProgress:'{n} dari {t} terjawab',
 wbScore:'Skor {s} / 20　Simakan {l} / 10　Bacaan {r} / 10', wbNoTts:'Browser ini tidak bisa membaca. Guru, mohon bacakan naskahnya.', wbTtsErr:'Suara perangkat tidak tersedia. Guru, mohon bacakan naskahnya.',
 caution:'Perhatian: ', wbConfirm:'Konfirmasi', wbPickTone:'Pilih nada:', wbNeedAll:'Jawab semua 20 soal untuk mengirim',
 wbExamIntro:'Simulasi ujian format HSK Level 1: {l} soal simakan dan {r} soal bacaan, total {n} soal, waktu {m} menit.', wbExamRules:'Waktu mulai dihitung saat menekan Mulai; jangan meninggalkan ujian di tengah jalan. Kirim setelah {n} soal terjawab; otomatis dikirim saat waktu habis. Nilai muncul setelah dikirim.', wbExamStart:'Mulai', wbTimeLeft:'Sisa {t}', wbNoLeave:'Waktu berjalan — jangan pergi', wbTimeUp:'Waktu habis, otomatis dikirim.'}
};
/* ── 板块名:孩子看得懂的说法 + 副语言指示 ──
   主行永远是中文(这是中文课);副行是学生母语的提示,默认显示,可在设置里关。
   候选语种:英语 / 印尼语 / 高棉语,账户建档时选定,之后可改。
   ⚠ km(高棉语)一列为拟稿,需母语者核对后启用。 */
/* 语言只有一个:学生的母语。它同时决定界面文字和板块名下的提示行。
   选「中文」时提示行自然消失(主行已是中文,再重复一遍没有意义)。 */
const LANGS = ['zh','en','id','km'];
const LANG_NAME = {zh:'中文', en:'English', id:'Indonesia', km:'ខ្មែរ'};
/* 板块名与界面文字一律用当前语言。选了英文就只出英文,不再叠一行中文——
   界面语言是学生的母语,重复显示中文只会占地方。课文内容当然还是中文。 */
const SEC = {
  s0 :{zh:'本课目标', en:'Lesson goals', id:'Tujuan pelajaran', km:'គោលដៅមេរៀន'},
  s1 :{zh:'故事一',   en:'Story 1',            id:'Cerita 1',            km:'រឿងទី ១'},
  s2 :{zh:'故事二',   en:'Story 2',            id:'Cerita 2',            km:'រឿងទី ២'},
  s3 :{zh:'故事三',   en:'Story 3',            id:'Cerita 3',            km:'រឿងទី ៣'},
  s4 :{zh:'认字',     en:'Learn the characters',id:'Kenali karakter',    km:'ស្គាល់តួអក្សរ'},
  s5 :{zh:'写字',     en:'Write the characters',id:'Tulis karakter',     km:'សរសេរតួអក្សរ'},
  s6 :{zh:'盼盼课堂', en:"Panpan's class",   id:'Kelas Panpan',       km:'ថ្នាក់រៀនផានផាន'},
  s7 :{zh:'朗读故事', en:'Read the story aloud', id:'Bacakan cerita',    km:'អានរឿងឮៗ'},
  s9 :{zh:'小测验',   en:'Quiz',               id:'Kuis',                km:'តេស្ត'},
  s10:{zh:'盼盼的发现',en:"Panpan's discovery", id:'Temuan Panpan',      km:'ការរកឃើញរបស់ផានផាន'},
  /* 板块内小标题 */
  secRz:{zh:'认一认',   en:'Look and learn',    id:'Lihat dan kenali',    km:'មើលនិងរៀន'},
  secXz:{zh:'写一写',   en:'Trace and write',   id:'Jiplak dan tulis',    km:'គូសនិងសរសេរ'},
  secGame:{zh:'翻牌游戏',en:'Matching game',    id:'Permainan kartu',     km:'ល្បែងផ្គូផ្គង'},
  flash:{zh:'翻卡',     en:'Flashcards',        id:'Kartu balik',         km:'កាតរំលឹក'},   /* 2026-09-15 翻卡站;高棉语拟稿 */
  /* 一级 v5 预览的站名(2026-09-15,用户指出站名没随语言变):plan 节点用 key 指到这里,四语都有 */
  text1:{zh:'课文一', en:'Text 1', id:'Teks 1', km:'អត្ថបទទី ១'},
  text2:{zh:'课文二', en:'Text 2', id:'Teks 2', km:'អត្ថបទទី ២'},
  text3:{zh:'课文三', en:'Text 3', id:'Teks 3', km:'អត្ថបទទី ៣'},
  flash1:{zh:'翻卡一', en:'Flashcards 1', id:'Kartu 1', km:'កាត ១'},
  flash2:{zh:'翻卡二', en:'Flashcards 2', id:'Kartu 2', km:'កាត ២'},
  flash3:{zh:'翻卡三', en:'Flashcards 3', id:'Kartu 3', km:'កាត ៣'},
  practice:{zh:'听读练', en:'Listen & read practice', id:'Latihan dengar & baca', km:'លំហាត់ស្តាប់និងអាន'},
  exam:{zh:'模拟测练', en:'Mock test', id:'Simulasi ujian', km:'តេស្តសាកល្បង'},
  secDrill:{zh:'练一练', en:'Practice',         id:'Latihan',             km:'លំហាត់'},
  exL1:{zh:'听一听,对不对', en:'Listen: true or false?', id:'Dengar: benar atau salah?', km:'ស្តាប់៖ ត្រូវឬខុស?'},
  exL2:{zh:'听对话,选图片', en:'Listen and pick the picture', id:'Dengar lalu pilih gambar', km:'ស្តាប់ហើយជ្រើសរូប'},
  exR1:{zh:'看句子,选图片', en:'Read and pick the picture', id:'Baca lalu pilih gambar', km:'អានហើយជ្រើសរូប'},
  exR4:{zh:'选词填空',   en:'Fill in the blank', id:'Isi bagian kosong',  km:'បំពេញចន្លោះ'},
  btnPlay:{zh:'▶ 听',    en:'▶ Listen',         id:'▶ Dengar',           km:'▶ ស្តាប់'},
  btnSubmit:{zh:'交卷',  en:'Submit',           id:'Kirim',              km:'ដាក់ស្នើ'},
  btnResubmit:{zh:'再交一次', en:'Submit again', id:'Kirim lagi',         km:'ដាក់ស្នើម្តងទៀត'},
  btnRetry:{zh:'再试一次',en:'Try again',        id:'Coba lagi',          km:'ព្យាយាមម្តងទៀត'},
  btnReplay:{zh:'▶ 再放一遍笔顺', en:'▶ Replay strokes', id:'▶ Putar ulang goresan', km:'▶ បង្ហាញខ្សែម្តងទៀត'},
  examHint:{zh:'十道题都做完,再按「交卷」。做错的可以再试一次。',
            en:'Answer all ten, then press Submit. You can retry the ones you miss.',
            id:'Jawab sepuluh soal, lalu tekan Kirim. Yang salah boleh diulang.',
            km:'ឆ្លើយទាំងដប់ រួចចុចដាក់ស្នើ។ អាចព្យាយាមឡើងវិញ។'},
  fillNote:{zh:'已答 {n} / {t}', en:'{n} of {t} answered', id:'{n} dari {t} terjawab', km:'ឆ្លើយ {n} / {t}'},
  score:{zh:'答对 {c} / {t}', en:'{c} of {t} correct', id:'{c} dari {t} benar', km:'ត្រូវ {c} / {t}'},
  allRight:{zh:'全对!', en:'All correct!', id:'Semua benar!', km:'ត្រឹមត្រូវទាំងអស់!'},
  someWrong:{zh:'做错的题上有「再试一次」,可以重做。',
             en:'Missed ones have a Try again button.',
             id:'Yang salah ada tombol Coba lagi.',
             km:'សំណួរខុសមានប៊ូតុងព្យាយាមម្តងទៀត។'}
};
let LANG = 'zh';
function secLabel(key){
  const e = SEC[key];
  return e ? (e[LANG] || e.zh) : key;
}
/* 模块序号用汉字数字,跟中文教材的分节习惯一致 */
const CN_NUM = ['一','二','三','四','五','六','七','八','九','十'];
function modTitle(i, key){
  return '<span class="mod-no">' + CN_NUM[i] + '</span><span data-t="' + key + '"></span>';
}
const T = k => {
  const e = SEC[k];
  if(e) return e[LANG] || e.zh;
  return (I18N[LANG] && I18N[LANG][k]) || I18N.zh[k] || k;
};
/* 带变量的词条:TF('wbProgress', {n:3, t:20}) → 「已答 3 / 20 题」 */
const TF = (k, v) => T(k).replace(/\{(\w+)\}/g, (m, x) => (v && v[x] !== undefined) ? v[x] : m);
/* 词义按界面语言取:课程 JSON 的 vocab_tr {词:{en,id,km}} 有就用,没有退回英文 wordEn。 */
function wordTr(w){
  const t = L.vocab_tr && L.vocab_tr[w];
  return (t && (t[LANG] || t.en)) || wordEn(w);
}
function applyLang(root){
  (root||document).querySelectorAll('[data-t]').forEach(el=>{
    const k = el.dataset.t;
    /* 只改叶子节点的文字。带子元素的容器(顶栏按钮里有图标与计数)只改 title,
       否则 textContent 会把 .ic / .lb / #logCount 一起抹掉。 */
    if(SEC[k]){ el.innerHTML = secLabel(k); el.title = SEC[k].zh; return; }
    if(el.children.length === 0) el.textContent = T(k);
    el.title = T(k);
  });
  document.getElementById('prev').title = T('prevT');
  document.getElementById('next').title = T('nextT');
  document.getElementById('stopBtn').title = T('stopT');
  const hb = document.getElementById('homeBtn');
  hb.title = T('home'); hb.querySelector('.lb').textContent = T('home');
  const mb = document.getElementById('menuBtn');
  mb.title = T('set'); mb.setAttribute('aria-label', T('set'));
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : LANG;
  if(typeof ttsFillSelect === 'function' && 'speechSynthesis' in window) ttsFillSelect(ttsVoices());
  segPaint(); renderLog();
  if(typeof renderStops === 'function'){ renderStops(); syncHead(); }
  /* 内容区里有按语言取值、又不在词表里的文字(如盼盼课堂的用法说明),
     只能整站重绘。加锁避免 applyLang 与 render 互相递归。 */
  if(typeof renderOne === 'function' && !LANG_REDRAW){
    LANG_REDRAW = true;
    (mode === 'all' ? renderAll : renderOne)();
    LANG_REDRAW = false;
  }
}
let LANG_REDRAW = false;

/* ═══ 设置:一个齿轮收纳全部显示选项 ═══ */
const SET = { lang:'zh', fs:0, py:0, tr:0, sp:0, read:0, theme:0 };
function segPaint(){
  const sl = document.getElementById('selLang');
  if(sl) sl.value = SET.lang;
  const map = {segFs:String(SET.fs), segPy:String(SET.py), segTr:String(SET.tr),
               segSp:String(SET.sp), segRead:String(SET.read), segTheme:String(SET.theme),
};
  Object.keys(map).forEach(id=>{
    const g = document.getElementById(id); if(!g) return;
    g.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.v === map[id]));
  });
}
function setOpt(key, v){
  SET[key] = (key === 'lang') ? v : +v;   /* 语种是字符串,别转数字 */
  EV('setting', LID + '.set.' + key, {value:SET[key]});
  if(key==='lang'){
    LANG = v; applyLang();
    if(v === 'km') toast('高棉语为拟稿,待母语者核对');
  }
  if(key==='fs')   applyFs(SET.fs);
  if(key==='py'){  document.body.classList.toggle('showpy', !!SET.py); }
  if(key==='tr'){
    document.body.classList.toggle('showtr', !!SET.tr);
    if(SET.tr){
      const k = document.querySelectorAll('#content .trline').length;
      if(!k) toast('本站没有英文对照。正本只给了目标、盼盼课堂例句、课文四、盼盼的发现四处英文,台词英译待补录');
    }
  }
  if(key==='sp')   SLOW = !!SET.sp;
  if(key==='read') setRead(SET.read ? 'all' : 'one');
  if(key==='theme')document.body.classList.toggle('night', !!SET.theme);
  segPaint();
}
const selLang = document.getElementById('selLang');
if(selLang) selLang.onchange = e => setOpt('lang', e.target.value);
['segFs','segPy','segTr','segSp','segRead','segTheme'].forEach(id=>{
  const g = document.getElementById(id); if(!g) return;
  const key = {segFs:'fs',segPy:'py',segTr:'tr',segSp:'sp',segRead:'read',segTheme:'theme'}[id];
  g.querySelectorAll('button').forEach(b=>{ b.onclick = ()=>setOpt(key, b.dataset.v); });
});

/* ═══ 正文字号:三档 ═══ */
const FS_OPT = [{c:'fs-s'}, {c:''}, {c:'fs-b'}];
function applyFs(i){
  document.body.classList.remove('fs-s','fs-b');
  if(FS_OPT[i].c) document.body.classList.add(FS_OPT[i].c);
  setTimeout(() => PP.fire(PP.resize), 60);   /* 字号变了,牌阵这类要重排 */
}

/* ═══ 阅读方式 ═══ */
let mode = 'one';
function setRead(m){
  mode = m;
  if(m === 'all'){ renderAll(); const el = document.getElementById('sec'+cur); if(el) el.scrollIntoView({block:'start'}); }
  else { renderOne(); window.scrollTo({top:0}); }
  syncHead();
}

/* ═══ 身份:学生 / 教师 ═══ */
let ROLE = 'student';
/* 教师层、学习记录、制作清单是开发期工具,不做界面切换:
   网址后面加 ?dev=1 才出现,正式界面看不到。 */
function setRole(r, silent){
  ROLE = r;
  document.body.classList.toggle('role-student', r === 'student');
  document.body.classList.toggle('role-teacher', r === 'teacher');
  if(r === 'student'){
    document.body.classList.remove('teacher');
    document.getElementById('teachBtn').classList.remove('on');
  }
  if(!silent) EV('setting', LID + '.role', {role:r});
}

/* ═══ 顶栏三个下拉 ═══ */
function menuToggle(btnId, listId, width){
  const el = document.getElementById(listId);
  if(el.classList.contains('open')){ closeMenus(); return; }
  closeMenus();
  positionUnder(btnId, listId, width);
  el.classList.add('open');
  document.getElementById('scrim').classList.add('show');
  const b = document.getElementById(btnId);
  if(b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded','true');
  document.getElementById('bar').classList.toggle('menu-open', btnId === 'menuBtn');
}
document.getElementById('menuBtn').onclick = ()=>menuToggle('menuBtn','setList',330);
document.getElementById('logBtn').onclick = ()=>{ renderLog(); menuToggle('logBtn','logPanel',430); };
document.getElementById('teachBtn').onclick = function(){
  const on = document.body.classList.toggle('teacher');
  this.classList.toggle('on', on);
  toast(T(on ? 'tsOn' : 'tsOff'));
};

/* ═══ 学习记录面板 ═══ */
function renderLog(){
  const box = document.getElementById('logBody'); if(!box) return;
  const c = document.getElementById('logCount'); if(c) c.textContent = EVENTS.length;
  if(!EVENTS.length){ box.innerHTML = '<div class="log-empty">' + T('logEmpty') + '</div>'; return; }
  box.innerHTML = EVENTS.slice(-60).reverse().map(e=>{
    const tm = e.occurred_at.slice(11,19);
    const kd = (LANG==='zh' ? (EV_LABEL[e.kind] || e.kind) : e.kind);
    const pl = Object.keys(e.payload).map(k=>k+'='+e.payload[k]).join(' ');
    return '<div class="log-row"><span class="tm">'+tm+'</span><span class="kd">'+kd+'</span><span class="pl">'+pl+'</span></div>';
  }).join('');
}
function copyLog(){
  const rows = EVENTS.map(e=>[e.occurred_at, e.kind, e.content_id||'', JSON.stringify(e.payload)].join('\t'));
  const t = rows.join('\n');
  if(navigator.clipboard) navigator.clipboard.writeText(t).then(()=>toast(rows.length+' 条已复制'), ()=>toast('复制失败'));
  else toast('此浏览器不支持一键复制');
}
function clearLog(){ EVENTS.length = 0; renderLog(); }
