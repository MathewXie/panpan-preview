// facts-style:start
const PROJECT_STYLE = "原创手绘叙事插画，通透水彩为主并克制叠加薄水粉，不过鲜的中等饱和，柔和暖色漫射光，随物体颜色变化的细轮廓线，线条有轻微粗细变化，人物最清楚，背景物件保持中等清晰，少量干净纸纹与克制笔触，自然、具体且彼此可区分的五官，符合故事学年的儿童比例，中国日常生活场景有完整可信细节，以疏密、淡化和对比形成远近层次，构图有叙事性。不要动漫大眼、民族刻板化五官、塑料高光、粗黑描边、厚重平涂、冷色整体光、空泛背景、照片写实或3D渲染。";
// facts-style:end
/* 制作清单面板 — 只在 ?dev=1 加载
   从 REFERENCE-v47.html 原样切出,第一步只搬家、逐字不改。 */
/* ═══ 制作清单面板 ═══ */
const VOICE = {
  panpan:{n:'盼盼', d:'7岁男童。明亮清脆,语速中等,句尾略上扬。本课第一次坐飞机,好奇多于紧张。'},
  duoduo:{n:'朵朵', d:'4岁半女童。奶声奶气,语速快,情绪起伏大,永远精力过剩。赖床那两句要真困。'},
  baba:{n:'爸爸',   d:'成年男声。敦实沉稳,语速偏慢,交代事情干脆利落。'},
  mama:{n:'妈妈',   d:'成年女声。温柔清亮,耐心,催起床时不凶。'},
  narr:{n:'领读',   d:'女声,标准普通话,教师范读语气。语速比日常慢约两成,字与字之间不连读。生词、汉字、例句一律用这个声音。'}
};
const IMG_WHERE = {
  cover:'第 1 站 出发口', text1:'第 2 站 课文一', text2:'第 3 站 课文二', text3:'第 4 站 课文三',
  text4:'第 8 站 朗读故事', culture:'第 10 站 发现',
  avatar_panpan:'课文台词行', avatar_duoduo:'课文台词行', avatar_baba:'课文台词行', avatar_mama:'课文台词行',
  r1_A:'第 10 站 读1 图池', r1_B:'第 10 站 读1 图池', r1_C:'第 10 站 读1 图池', r1_D:'第 10 站 读1 图池',
  l1_1:'第 10 站 听1(锁)', l1_2:'第 10 站 听1(锁)', l1_3:'第 10 站 听1(锁)',
  l2_A:'第 10 站 听2(锁)', l2_B:'第 10 站 听2(锁)', l2_C:'第 10 站 听2(锁)', l2_D:'第 10 站 听2(锁)'
};
function buildImages(){
  const keys = Object.keys(IMAGES);
  return '<h3>插图清单(共 ' + keys.length + ' 张;当前全部交静态图)</h3>'
   + '<p class="hint">文件放进 <code>images/</code> 即可,占位框会自动消失、直接显示图片。所有图一律不要出现文字,页面会自己叠加。构图请居中留白。</p>'
   + '<h4>画风固定串(出图时原样粘贴,一字不改)</h4>'
   + '<pre class="tree">' + PROJECT_STYLE + '</pre>'
   + '<p class="hint">取自《人物规范》v5.18 的原图水彩标准。<b>本课为旅行场景</b>:书包属于场景道具层,按剧情改为行李。当前只交静态图;课文图构图需可拆成固定背景、人物与前景三层,为 v1.0 后故事短片保留动作空间。</p>'
   + '<table><tr><th style="width:22px"></th><th style="width:150px">存为</th><th style="width:104px">建议尺寸</th><th style="width:104px">用在</th><th>画面说明</th></tr>'
   + keys.map(k=>'<tr><td><span class="pdot no"></span></td>'
       + '<td><code>images/'+k+'.png</code><br><span class="hint">或 .jpg/.webp</span>'
        + '</td>'
       + '<td>'+IMAGES[k].size+'</td><td class="hint">'+(IMG_WHERE[k]||'—')+'</td>'
       + '<td>'+IMAGES[k].desc+'</td></tr>').join('')
   + '</table>';
}
function buildTodo(){
  const n = L.texts.reduce((a,t)=>a+t.lines.length,0);
  return '<h3>待补数据</h3>'
   + '<table><tr><th style="width:120px">项目</th><th style="width:80px">数量</th><th>说明</th></tr>'
   + '<tr><td><b>台词英文对照</b></td><td>' + n + ' 行</td>'
   + '<td>正式版一级每行台词下方都有英译(<code>trline</code>),数据来自课程 JSON;二级数据包只提供了目标、盼盼课堂例句、课文四、盼盼的发现四处英文,台词英译尚无。顶栏「译」在课文站因此没有内容可显。需正本补录后接入。</td></tr>'
   + '<tr><td><b>听力音轨</b></td><td>6 题</td><td>听1 判断 ×3、听2 对话选图 ×3,音轨配套期统一分配,本包不占位。</td></tr>'
   + '<tr><td><b>笔顺数据</b></td><td>' + Object.keys(HZ_DATA).length + ' 字 ✓</td>'
   + '<td>本课 ' + Object.keys(HZ_DATA).length + ' 字笔顺已全部入库(一级库 7 字 + 二级新字 '
   + L.renyiren.length + ' 字,取自 hanzi-writer-data v2.0.1)。'
   + '<b>许可提醒:</b>该数据衍生自 Arphic 字体,依 ARPHIC PUBLIC LICENSE 分发——可免费商用,但要求随产品附上未经改动的 <code>ARPHICPL.TXT</code>,'
   + '并在修改数据时注明改动。本包未修改笔画数据本身。全九级铺开时,建议在 <code>engine/</code> 下常驻一份完整字库与该许可文件。</td></tr>'
   + '<tr><td><b>单字英文释义</b></td><td>' + Object.keys(CHAR_WORD).length + ' 字</td>'
   + '<td>正式版一级汉字页信息板有 <code>CHAR_EN</code>(单字英文)与 <code>WORD_EN</code>(例词英文);二级数据包未提供,信息板暂只显字、拼音、例词与例词读音。</td></tr>'
   + '<tr><td><b>例词英文释义</b></td><td>' + RZ_WORDS.length + ' 词</td>'
   + '<td>翻牌按正式版配「拼音＋中文词 ↔ 英文释义」。正式版一级的英文写在课程 JSON 的 <code>vocab</code> 里(格式 <code>["你好","hello",1]</code>),'
   + '属作者原创内容;二级数据包未提供,官方 HSK 词表只给词性不给释义。下表为拟稿,请核改后回填正本——'
   + '页面里只需改 <code>WORD_EN</code> 一处,牌面与本清单同步更新。'
   + '<table style="margin-top:6px"><tr><th style="width:80px">词</th><th style="width:90px">拼音</th><th>英文(拟稿)</th></tr>'
   + RZ_WORDS.map(w=>'<tr><td class="say">'+w+'</td><td class="hint">'+wordPy(w)+'</td><td>'+(WORD_EN[w]||'—')+'</td></tr>').join('')
   + '</table>'
   + '<div style="margin-top:6px"><button class="pbtn" onclick="copyEn()">复制这份词表(词＋拼音＋英文,制表符分隔)</button></div>'
   + '</td></tr>'
   + '</table>';
}
function audioRows(){
  const rows = [];
  L.texts.forEach((t,i)=>rows.push({k:'text'+(i+1), label:'课文'+'一二三'[i]+' · 常速', where:'第 '+(i+2)+' 站',
    voice:'多角色', lines:t.lines.map(l=>[VMAP[l.who]||'narr', l.text]),
    note:'逐行生成后拼接,行间静音 0.6 秒。语气按场景走,不要念稿。'}));
  Object.keys(CHAR_WORD).forEach(ch=>rows.push({k:'hz_'+ch, label:'汉字 '+ch,
    where:(L.renyiren.indexOf(ch)>=0?'第 5 站 认一认':'第 6 站 写一写'), voice:'narr',
    say:ch+'。'+ch+'。', note:'单字,读两遍,中间停 1 秒。声调要正,不要连读成词。听写面板也用这条。'}));
  [...new Set(Object.values(CHAR_WORD))].forEach(w=>rows.push({k:'w_'+w, label:'例词 '+w,
    where:'第 5 / 6 站 信息板', voice:'narr', say:w+'。'+w+'。', note:'读两遍,中间停 0.8 秒,第二遍可略慢。'}));
  L.classroom.forEach((g,gi)=>g.examples.forEach((e,ei)=>rows.push({k:'gp'+(gi+1)+'_'+(ei+1),
    label:'盼盼课堂 例句'+(gi+1)+'-'+(ei+1), where:'第 7 站', voice:'narr', say:e.zh, note:'例句大声朗读。'})));
  rows.push({k:'text4', label:'课文四 · 全文', where:'第 8 站', voice:'narr', say:L.text4.zh, note:'叙述体,慢速匀速,句号处停顿。'});
  (L.drills||[]).forEach(d=>rows.push({k:'drill'+d.cycle+'_pick', label:'循环练'+d.cycle+' · 听词', where:'第 '+(d.cycle+1)+' 站',
    voice:'narr', say:d.pick.audio, note:'单词,清晰,不带语气。'}));
  ((L.exam&&L.exam.l1)||[]).forEach((q,i)=>rows.push({k:'ex_l1_'+(i+1), label:'小考场 听1 第'+(i+1)+'题', where:'第 10 站',
    voice:'narr', say:q.audio, note:'判断题,读一遍,与图对照。'}));
  ((L.exam&&L.exam.l2)||[]).forEach((q,i)=>rows.push({k:'ex_l2_'+(i+1), label:'小考场 听2 第'+(i+1)+'题', where:'第 10 站',
    voice:'多角色', lines:[['narr',q.d1],['narr',q.d2]], note:'对话题,男女分声,两行之间静音 0.4 秒。'}));
  return rows;
}
function buildAudio(){
  const rows = audioRows();
  const cast = '<table class="cast"><tr><th>角色</th><th>声音要求</th></tr>'
   + Object.keys(VOICE).map(v=>'<tr><td><b>'+VOICE[v].n+'</b></td><td>'+VOICE[v].d+'</td></tr>').join('') + '</table>';
  const body = rows.map(r=>{
    let text;
    if(r.lines) text = '<div>' + r.lines.map(l=>'<div class="ln"><b>'+(VOICE[l[0]]?VOICE[l[0]].n:l[0])+'</b><span class="say">'+l[1]+'</span></div>').join('') + '</div>';
    else text = '<div class="ln"><span class="say">'+r.say+'</span></div>';
    const v = r.voice==='多角色' ? '逐行换声' : (VOICE[r.voice]?VOICE[r.voice].n:r.voice);
    return '<tr><td><span class="pdot no"></span></td><td><code>audio/'+r.k+'.mp3</code><br><span class="hint">或 .m4a/.wav</span></td>'
     + '<td>'+r.label+'<br><span class="hint">'+r.where+'</span></td>'
     + '<td class="hint" style="white-space:nowrap">'+v+'</td><td>'+text+'</td><td class="hint">'+r.note+'</td></tr>';
  }).join('');
  return '<h3>音频清单(共 ' + rows.length + ' 条)</h3>'
   + '<p class="hint">「朗读文本」一列就是要喂给 AI 的原文,已去掉角色名与提示语,可以直接复制;右列「制作提示」只给你调参数用,不要放进合成文本。总原则:普通话,儿童向语气自然亲切,语速比日常慢约两成,句尾标点该停就停,不要加背景音乐。</p>'
   + '<h4>配音角色</h4><p class="hint">同一角色全书用同一把声音,换课不要换人。</p>' + cast
   + '<h4>逐条清单</h4>'
   + '<div style="margin:8px 0"><button class="pbtn" onclick="copyAll()">复制全部文本(文件名＋角色＋原文,制表符分隔)</button></div>'
   + '<table><tr><th style="width:22px"></th><th style="width:132px">存为</th><th style="width:104px">名称 / 用在</th>'
   + '<th style="width:58px">配音</th><th>朗读文本(喂给 AI)</th><th style="width:168px">制作提示</th></tr>' + body + '</table>';
}
function copyAll(){
  const out = [];
  audioRows().forEach(r=>{
    if(r.lines) r.lines.forEach((l,i)=>out.push([r.k+'(第'+(i+1)+'行)', VOICE[l[0]]?VOICE[l[0]].n:l[0], l[1]].join('\t')));
    else out.push([r.k, VOICE[r.voice]?VOICE[r.voice].n:r.voice, r.say].join('\t'));
  });
  const s = out.join('\n');
  if(navigator.clipboard) navigator.clipboard.writeText(s).then(()=>toast(out.length+' 行已复制'), ()=>toast('复制失败,请手动选取'));
  else toast('此浏览器不支持一键复制');
}
function copyEn(){
  const rows = RZ_WORDS.map(w=>[w, wordPy(w), WORD_EN[w]||''].join('\t'));
  const t = rows.join('\n');
  if(navigator.clipboard) navigator.clipboard.writeText(t).then(()=>toast(rows.length+' 词已复制'), ()=>toast('复制失败,请手动选取'));
  else toast('此浏览器不支持一键复制');
}
let panelBuilt = false;
function openPanel(){
  if(!panelBuilt){
    document.getElementById('panelBody').innerHTML =
      '<p><b>文件怎么放:</b>把本文件和两个资源文件夹放在一起。存好文件后刷新页面,占位说明会自动消失,直接显示图片、播放声音。</p>'
      + '<pre class="tree">lesson16/\n├── index.html      ← 就是本文件\n├── images/         ← 所有插图放这里(png / jpg / webp 任选其一)\n└── audio/          ← 所有声音放这里(mp3 / m4a / wav 任选其一)</pre>'
      + '<p class="hint">本页为版式样张:清单由本课数据现场装配,朗读文本逐字取自正本;正式版由 build.py 生成并带文件探测。</p>'
      + buildTodo() + buildImages() + buildAudio();
    panelBuilt = true;
  }
  document.getElementById('panel').classList.add('open');
}
function closePanel(){ document.getElementById('panel').classList.remove('open'); }

/* 原在主脚本行 2200(顶栏下拉段)。切分后 core 先于本文件执行,
   `onclick = openPanel` 会立即求值而报 ReferenceError;按钮属于本面板,绑定随之移来。
   代码一字未改,只换了所在文件。 */
document.getElementById('panelBtn').onclick = openPanel;
