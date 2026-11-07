(()=>{
  'use strict';
  const STORAGE_KEY='star-reflection-2026-v4';
  const $=(id)=>document.getElementById(id);
  const editable=['learning','connection','happy','effort','values','action','dessert','starCount'];
  const looks={
    moon:{index:0,file:'sample_1.webp',name:'月光ラベンダー',title:'月のカヌレ',dessert:'カヌレ',palette:'くすみラベンダー、星屑ゴールド、クリーム色',symbol:'☾'},
    sun:{index:1,file:'sample_2.webp',name:'やわらかな夕陽',title:'太陽のいちごタルト',dessert:'いちごタルト',palette:'ピーチ、淡いコーラル、蜂蜜ゴールド、アイボリー',symbol:'☼'},
    star:{index:2,file:'sample_3.webp',name:'青い星空',title:'星風のマカロン',dessert:'マカロン',palette:'深いインクブルー、ラベンダー、シャンパンゴールド、アイボリー',symbol:'✧'},
    forest:{index:3,file:'sample_4.webp',name:'静かな夜の森',title:'森のモンブラン',dessert:'モンブラン',palette:'深いフォレストグリーン、セージ、アンティークゴールド、ミルク色',symbol:'♧'}
  };
  const lookKeys=Object.keys(looks);
  const zodiac=[
    ['aries','♈','おひつじ座'],['taurus','♉','おうし座'],['gemini','♊','ふたご座'],['cancer','♋','かに座'],
    ['leo','♌','しし座'],['virgo','♍','おとめ座'],['libra','♎','てんびん座'],['scorpio','♏','さそり座'],
    ['sagittarius','♐','いて座'],['capricorn','♑','やぎ座'],['aquarius','♒','みずがめ座'],['pisces','♓','うお座']
  ];
  let state={screen:0,look:'star',sign:'auto',postTouched:false};
  let carouselIndex=2, carouselTimer=null, restTimer=null, toastTimer=null, selectedCardObjectUrl=null;
  const img=(look)=>'assets/'+looks[look].file;
  const getData=()=>Object.fromEntries(editable.map(id=>[id, $(id).value.trim()]));
  const short=(s,n)=>{s=(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'…':s;};
  function toast(message){const n=$('toast');n.textContent=message;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),3500);}
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({...getData(),look:state.look,sign:state.sign,post:$('postText').value,postTouched:state.postTouched}));}catch(e){}}
  function restore(){try{const found=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!found)return;editable.forEach(id=>{if(typeof found[id]==='string')$(id).value=found[id]});if(looks[found.look])state.look=found.look;if(found.sign==='auto'||zodiac.some(z=>z[0]===found.sign))state.sign=found.sign; if(typeof found.post==='string'){$('postText').value=found.post;state.postTouched=!!found.postTouched;}}catch(e){}}
  function switchScreen(n){
    n=Math.max(0,Math.min(4,Number(n)));
    if(n===3&&!hasReflection()){toast('今年のできごとをひとつ書いてから進みましょう。');n=1;}
    if(n===4&&!state.postTouched){createPost(false);}
    state.screen=n;
    document.querySelectorAll('[data-screen]').forEach(e=>{const active=Number(e.dataset.screen)===n;e.hidden=!active;e.classList.toggle('is-current',active)});
    window.scrollTo({top:0,behavior:'instant'});
    if(n===0)startCarousel();else stopCarousel();
    if(n===4)updateCount();
  }
  function hasReflection(){return ['learning','connection','happy','effort'].some(id=>$(id).value.trim())}
  function selectLook(key){if(!looks[key])return;state.look=key;document.querySelectorAll('[data-look]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.look===key)));$('selectedCard').src=img(key);$('selectedCard').alt=looks[key].name+'のカード見本';$('selectedLabel').textContent=looks[key].title;if(!selectedCardObjectUrl){$('sharedCardImage').src=img(key);$('sharedCardImage').alt=looks[key].title+'のカード見本';}const el=$('selectedCard').parentElement;el.classList.remove('new-selection');void el.offsetWidth;el.classList.add('new-selection');save();}
  function selectZodiac(key){state.sign=key;document.querySelectorAll('[data-sign]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sign===key)));renderConstellation();save();}
  function renderConstellation(){
    const count=$('starCount').value==='auto'?5:Number($('starCount').value);
    const signIndex=Math.max(0,zodiac.findIndex(z=>z[0]===state.sign));
    const pts=Array.from({length:count},(_,i)=>({x:13+i*154/(count-1),y:35+Math.sin(i*1.49+signIndex*.83)*18+(i%3)*2}));
    const lines=pts.slice(1).map((pt,i)=>`<line x1="${pts[i].x.toFixed(1)}" y1="${pts[i].y.toFixed(1)}" x2="${pt.x.toFixed(1)}" y2="${pt.y.toFixed(1)}"/>`).join('');
    const dots=pts.map(pt=>`<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="2.7"/>`).join('');
    $('miniConstellation').innerHTML=`<g stroke="#e8cda6" opacity=".76" stroke-width="1.25">${lines}</g><g fill="#fff0cf">${dots}</g>`;
    const sign=zodiac.find(z=>z[0]===state.sign);
    $('miniZodiacLabel').textContent=(sign?sign[1]+' '+sign[2]:'✧ 星座おまかせ')+' · 主星'+count+'つ';
  }
  function initZodiac(){const list=$('zodiacList');[['auto','✧','おまかせ'],...zodiac].forEach(([id,symbol,name])=>{const button=document.createElement('button');button.type='button';button.className='zodiac-pill';button.dataset.sign=id;button.setAttribute('aria-pressed',String(id===state.sign));const sign=document.createElement('span');sign.textContent=symbol;const label=document.createElement('small');label.textContent=name;button.append(sign,label);button.addEventListener('click',()=>selectZodiac(id));list.append(button)});}
  function updateHeroImage(direction=1){
    const centerKey=lookKeys[carouselIndex];const leftKey=lookKeys[(carouselIndex+lookKeys.length-1)%lookKeys.length];const rightKey=lookKeys[(carouselIndex+1)%lookKeys.length];
    $('stackLeft').src=img(leftKey);$('stackRight').src=img(rightKey);
    $('heroCardImage').src=img(centerKey);$('heroCardImage').alt=looks[centerKey].title+'のカード見本';
    const el=$('heroCard');el.classList.remove('is-arriving','is-resting');void el.offsetWidth;el.classList.add('is-arriving');
    clearTimeout(restTimer);restTimer=setTimeout(()=>{el.classList.remove('is-arriving');el.classList.add('is-resting')},1150);
    $('heroDots').querySelectorAll('button').forEach((dot,i)=>dot.setAttribute('aria-current',String(i===carouselIndex)));
  }
  function changeHero(delta){carouselIndex=(carouselIndex+delta+lookKeys.length)%lookKeys.length;updateHeroImage(delta);startCarousel()}
  function stopCarousel(){clearInterval(carouselTimer);carouselTimer=null}
  function startCarousel(){stopCarousel();if(document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches)return;carouselTimer=setInterval(()=>{if(state.screen===0&&!document.hidden){carouselIndex=(carouselIndex+1)%lookKeys.length;updateHeroImage();}},4800)}
  function initCarousel(){const box=$('heroDots');lookKeys.forEach((key,i)=>{const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',looks[key].name+'の見本を見る');dot.setAttribute('aria-current',String(i===carouselIndex));dot.addEventListener('click',()=>{carouselIndex=i;updateHeroImage();startCarousel()});box.append(dot)});$('prevCard').addEventListener('click',()=>changeHero(-1));$('nextCard').addEventListener('click',()=>changeHero(1));$('heroStage').addEventListener('mouseenter',stopCarousel);$('heroStage').addEventListener('mouseleave',()=>{if(state.screen===0)startCarousel()});$('heroStage').addEventListener('focusin',stopCarousel);$('heroStage').addEventListener('focusout',e=>{if(!e.currentTarget.contains(e.relatedTarget))startCarousel()});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCarousel();else if(state.screen===0)startCarousel()});}
  function createPrompt(compact=false){
    const d=getData(),look=looks[state.look], sign=zodiac.find(z=>z[0]===state.sign);
    const mainDessert=d.dessert==='auto'?look.dessert:d.dessert;
    const constellation=sign?`${sign[2]}（${sign[1]}）の星座を、優美な細い線で描く。`: '実際の誕生星座を推測せず、夜空に似合う架空の星座モチーフを描く。';
    const stars=d.starCount==='auto'?'星の数はモチーフに合わせて自然に調整':'主星は'+d.starCount+'個。小さな背景星は控えめ';
    const intro=`この人の2026年1〜11月の振り返りをもとに「星座×スイーツ×タロット」の完成カード画像を【1枚だけ】直接生成。画像生成を実行し、解説文・複数案・コラージュ・比較画像は禁止。画像全体がカードそのもの。`;
    const layout=`【カード】縦長2:3（1080×1620相当の比率）。四隅を軽く丸めた細いアンティークゴールド二重枠、文字や装飾は端から5%以上内側。上15%：星座のシンボル、日本語の短いタイトル1行、控えめな英語副題。中央47%：${mainDessert}を主役にした繊細な水彩・絵本調の美しいイラスト、夜景、星座の結び線。下35%：アイボリーの明るい紙面、読みやすい日本語メッセージ3段。最下部3%：小さな金色の飾り。文字は切れず、3段とも同じ左位置に整列。`;
    const message=`【カードに入れる3つの見出しは一字一句固定】①あなたはこんなタイプ（振り返りから見える長所25〜35文字）②今年こんなことを頑張ってきたね（本人の具体的な頑張り25〜40文字）③これからのあなたへの小さなお告げ（12月の一歩に向けた提案25〜40文字）。各欄の左に小さな金色丸アイコン。見出しは本文より強く。本文は原則2〜3行、必要なら短くして可読性を優先する。`;
    const art=`【世界観】${look.name}：${look.palette}。${look.symbol}。落ち着いた星空、柔らかい月光、淡い水彩の絵本調、大人可愛い上品なタロット。金色は繊細に、過度なラメや3D風を避ける。星座：${constellation}${stars}。スイーツは1種類。占いで性格・未来を断定しない。`;
    const reflection=`【本人の言葉】\n学び・スキル：${d.learning||'未記入'}\n人とのつながり：${d.connection||'未記入'}\n嬉しかったこと：${d.happy||'未記入'}\n今年の自分をねぎらうこと：${d.effort||'未記入'}\n来年大切にしたいこと：${d.values||'未記入'}\n12月の小さな一歩：${d.action||'未記入。無理なく始められる小さな一歩を提案する'}`;
    const policy='書かれていない成果・性格・出来事を創作しない。小さな頑張りを具体的にねぎらい、やさしく背中を押す。完成画像は縦長2:3で必ず1枚だけ。';
    return [intro,layout,message,art,reflection,policy].join('\n\n');
  }
  function openPromptDialog(text){$('promptText').value=text;if(!$('promptDialog').open)$('promptDialog').showModal();else{$('promptText').focus();$('promptText').select();}}
  function openChatGPT(){
    if(!hasReflection()){switchScreen(1);toast('まずは今年のできごとをひとつ書いてみてください。');$('learning').focus();return;}
    const prompt=createPrompt();const url='https://chatgpt.com/?q='+encodeURIComponent(prompt);
    // The URL prefill is unofficial and subject to change. Fall back to dialog/copy for large payloads.
    if(url.length>7700){openPromptDialog(prompt);toast('入力が長いため、文章をコピーする方法で開きます。');return;}
    // A real button click opens the URL in a new tab. With 'noopener', window.open may
    // return null even when the new tab opened, so do not treat that as failure.
    window.open(url,'_blank','noopener,noreferrer');
    switchScreen(4);
    toast('ChatGPTを別タブで開く操作をしました。開かない場合は生成プロンプトをコピーしてください。');
  }
  function createPost(markTouched){
    const d=getData();const effort=short(d.effort||d.learning||d.connection||d.happy||'小さな一歩を積み重ねてきたこと',55);const action=short(d.action||d.values||'自分のペースで一歩を踏み出す',50);
    $('postText').value=`今年の自分に、おつかれさま ✧\n\n今年の私が頑張ったこと：${effort}\n\n12月の小さな一歩：${action}\n\n#夜活コミュニティ`;
    if(markTouched)state.postTouched=true;updateCount();save();
  }
  function updateCount(){const s=$('postText').value;const n=[...s].length;$('postCount').textContent=n+' / 280';$('postCount').style.color=n>270?'#b33d58':'#817e8b'}
  async function copyText(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text)}else{const t=document.createElement('textarea');t.value=text;t.style.cssText='position:fixed;left:-10000px;top:0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error('Clipboard unavailable')}return true}catch(e){openPromptDialog(text);toast('コピーができませんでした。表示された文章を手動でコピーしてください。');return false}}
  async function copyPrompt(){const ok=await copyText(createPrompt());if(ok)toast('画像生成プロンプトをコピーしました。')}
  async function copyPost(){const text=$('postText').value.trim();if(!text){toast('投稿する文章を入力してください。');return;}if(await copyText(text))toast('投稿文をコピーしました。')}
  function openX(){const content=$('postText').value.trim();if(!content){toast('投稿する文章を入力してください。');return;}const url='https://twitter.com/intent/tweet?text='+encodeURIComponent(content);window.open(url,'_blank','noopener,noreferrer');toast('Xの投稿画面を開きました。カード画像はご自身で添付してください。')}
  function downloadMemo(){const d=getData();const content='星のふりかえり手帖｜2026年1〜11月\n\n'+[['できたこと・学んだこと',d.learning],['人とのつながり',d.connection],['楽しかったこと',d.happy],['おつかれさまと言いたいこと',d.effort],['来年大切にしたいこと',d.values],['12月の小さな一歩',d.action]].map(([title,body])=>'【'+title+'】\n'+body).join('\n\n');const blob=new Blob(['\ufeff'+content],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='星のふりかえり手帖_2026.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('ふりかえりメモを保存しました。')}
  function clearAll(){if(!window.confirm('入力内容と、この端末の保存データを消去しますか？'))return;editable.forEach(id=>$(id).value=id==='dessert'||id==='starCount'?'auto':'');$('postText').value='';if(selectedCardObjectUrl){URL.revokeObjectURL(selectedCardObjectUrl);selectedCardObjectUrl=null;}state={screen:0,look:'star',sign:'auto',postTouched:false};try{localStorage.removeItem(STORAGE_KEY)}catch(e){}selectLook('star');selectZodiac('auto');try{localStorage.removeItem(STORAGE_KEY)}catch(e){}switchScreen(0);toast('入力内容を消去しました。')}
  function handleUpload(e){const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){toast('画像ファイルを選んでください。');return}if(file.size>15*1024*1024){toast('15MB以下の画像を選んでください。');return}if(selectedCardObjectUrl)URL.revokeObjectURL(selectedCardObjectUrl);selectedCardObjectUrl=URL.createObjectURL(file);$('sharedCardImage').src=selectedCardObjectUrl;$('sharedCardImage').alt='選んだ完成カード画像';toast('完成カードをプレビューに表示しました。X投稿時には画像を添付してください。')}
  function bind(){
    $('homeButton').addEventListener('click',()=>switchScreen(0));$('startButton').addEventListener('click',()=>switchScreen(1));$('resetButton').addEventListener('click',clearAll);
    document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>switchScreen(b.dataset.next)));
    document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>switchScreen(b.dataset.back)));
    document.querySelectorAll('.suggestions button').forEach(b=>b.addEventListener('click',()=>{const t=$(b.dataset.for),value=b.dataset.text;if(t.value.includes(value)){toast('すでに入力されています。');return;}const newValue=t.value?t.value.trim()+'／'+value:value;if(newValue.length>t.maxLength){toast('入力できる文字数を超えています。');return;}t.value=newValue;save();t.focus();}));
    editable.forEach(id=>$(id).addEventListener('input',()=>{if(id==='starCount')renderConstellation();save();}));
    document.querySelectorAll('[data-look]').forEach(b=>b.addEventListener('click',()=>selectLook(b.dataset.look)));
    $('createButton').addEventListener('click',openChatGPT);$('copyPromptButton').addEventListener('click',copyPrompt);
    $('postText').addEventListener('input',()=>{state.postTouched=true;updateCount();save()});
    $('regeneratePost').addEventListener('click',()=>createPost(true));
    $('copyPostButton').addEventListener('click',copyPost);$('openXButton').addEventListener('click',openX);$('cardUpload').addEventListener('change',handleUpload);$('saveMemoButton').addEventListener('click',downloadMemo);
    $('dialogClose').addEventListener('click',()=>$('promptDialog').close());$('promptDialog').addEventListener('click',e=>{if(e.target===$('promptDialog'))$('promptDialog').close()});
    $('dialogCopy').addEventListener('click',async()=>{if(await copyText($('promptText').value)){$('promptDialog').close();toast('文章をコピーしました。')}});
    $('dialogOpen').addEventListener('click',()=>{window.open('https://chatgpt.com/','_blank','noopener,noreferrer');$('promptDialog').close();switchScreen(4)});
  }
  initZodiac();restore();bind();initCarousel();updateHeroImage();selectLook(state.look);selectZodiac(state.sign);renderConstellation();switchScreen(0);updateCount();
})();
