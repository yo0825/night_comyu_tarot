(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const STORAGE_KEY='hoshi-yoin-workshop-v8';
  const SAMPLES=[
    {file:'sample_1.webp',name:'月明かりとカヌレのカード'},
    {file:'sample_2.webp',name:'夕陽といちごタルトのカード'},
    {file:'sample_3.webp',name:'星空とマカロンのカード'},
    {file:'sample_4.webp',name:'夜の森とモンブランのカード'}
  ];
  const sampleSrc=index=>'assets/'+SAMPLES[(index+SAMPLES.length)%SAMPLES.length].file;
  let currentScreen=0;
  let carouselIndex=2,carouselTimer=null,animationTimer=null,toastTimer=null;
  let postEdited=false;
  let uploadedImageUrl=null;
  const getForm=()=>({reflection:$('reflection').value.trim(),connection:$('connection').value.trim()});

  function notify(message){const el=$('toast');el.textContent=message;el.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('is-visible'),3500);}
  function showScreen(index){
    if(index===2&&!getForm().reflection){notify('今年の頑張りをひとつご記入ください。');index=1;}
    currentScreen=Math.min(3,Math.max(0,index));
    if(currentScreen===2)updateSummary();
    if(currentScreen===3&&!postEdited)makePost(false);
    document.querySelectorAll('[data-screen]').forEach(el=>{const isCurrent=Number(el.dataset.screen)===currentScreen;el.hidden=!isCurrent;el.classList.toggle('is-current',isCurrent)});
    if(currentScreen===0)startCarousel();else stopCarousel();
    if(currentScreen===3)updatePostCount();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function save(){try{const data={...getForm(),post:$('postText').value,postEdited};localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(error){/* storage may be disabled */}}
  function restore(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!saved)return;['reflection','connection'].forEach(id=>{if(typeof saved[id]==='string')$(id).value=saved[id]});if(typeof saved.post==='string')$('postText').value=saved.post;postEdited=!!saved.postEdited;}catch(error){}}
  function clearAll(){if(!confirm('入力内容と保存された下書きを消去しますか？'))return;['reflection','connection','postText'].forEach(id=>$(id).value='');postEdited=false;if(uploadedImageUrl){URL.revokeObjectURL(uploadedImageUrl);uploadedImageUrl=null;}$('cardUpload').value='';$('sharedCardImage').src=sampleSrc(2);$('sharedImageNote').textContent='ここに、あなたのカードを飾れます。';try{localStorage.removeItem(STORAGE_KEY)}catch(e){}updateCounts();showScreen(0);notify('入力内容を消去しました。');}
  function updateCounts(){for(const id of ['reflection','connection']){const el=$(id);$(id+'Count').textContent=`${el.value.length} / ${el.maxLength}`;}}
  function updateSummary(){const d=getForm();const s=d.reflection.replace(/\s+/g,' ');$('summaryReflection').textContent=s.length>170?s.slice(0,169)+'…':s||'あなたの振り返りがここに表示されます。';}
  function moveCarousel(){
    $('heroImage').src=sampleSrc(carouselIndex);$('heroImage').alt=SAMPLES[carouselIndex].name+'の完成見本';
    $('heroLeft').src=sampleSrc(carouselIndex+3);$('heroRight').src=sampleSrc(carouselIndex+1);
    const el=$('heroCenter');el.classList.remove('is-resting','is-arriving');void el.offsetWidth;el.classList.add('is-arriving');
    clearTimeout(animationTimer);animationTimer=setTimeout(()=>{el.classList.remove('is-arriving');el.classList.add('is-resting');},1120);
    $('carouselDots').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',String(i===carouselIndex)));
  }
  function stopCarousel(){clearInterval(carouselTimer);carouselTimer=null;}
  function startCarousel(){stopCarousel();if(document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches||currentScreen!==0)return;carouselTimer=setInterval(()=>{carouselIndex=(carouselIndex+1)%SAMPLES.length;moveCarousel();},5400);}
  function initCarousel(){SAMPLES.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',s.name+'を表示');b.setAttribute('aria-current',String(carouselIndex===i));b.addEventListener('click',()=>{carouselIndex=i;moveCarousel();startCarousel()});$('carouselDots').appendChild(b)});$('prevCard').addEventListener('click',()=>{carouselIndex=(carouselIndex+SAMPLES.length-1)%SAMPLES.length;moveCarousel();startCarousel()});$('nextCard').addEventListener('click',()=>{carouselIndex=(carouselIndex+1)%SAMPLES.length;moveCarousel();startCarousel()});const stage=$('heroVisual');stage.addEventListener('mouseenter',stopCarousel);stage.addEventListener('mouseleave',startCarousel);stage.addEventListener('focusin',stopCarousel);stage.addEventListener('focusout',e=>{if(!stage.contains(e.relatedTarget))startCarousel()});document.addEventListener('visibilitychange',()=>document.hidden?stopCarousel():startCarousel());moveCarousel();}
  function cardPrompt(){const d=getForm();return `【依頼】2026年1〜11月の振り返りから、星座×スイーツ×タロットの完成画像を必ず【1枚だけ】生成してください。解説文・複数案・コラージュ・カードを置いた写真は禁止。画像生成を実行し、画面全体を1枚のカードにしてください。

【デザイン】20〜30代の働く女性が記念に持ち帰りたくなる、静かで上品な絵本調の水彩。夜空・月光・繊細な星座の結び線・アンティークゴールドの細い二重枠・アイボリーの紙。可愛さは控えめで洗練された大人の雰囲気。SHElikesでの学びやキャリアを考える人にも似合うが、本人の所属や仕事は推測しない。

【自動で決める】振り返りの気持ちに合う星座風モチーフ、スイーツ1種類、夜空の色、短いカード名を選んでください。実際の誕生星座は断定しない。3〜9個程度の主星を細く結び、毎回異なる星座構図にする。2027年に無理なく試せる新しい挑戦を1つ考え、2026年12月に15〜30分でできる第一歩も添える。

【レイアウト厳守】縦長2:3（約1080×1620）。カード1枚のみ。上下左右5%以上の安全余白。上15%：星座の記号、日本語タイトル12字以内、短い英語副題。中央47%：スイーツを主役にした美しいイラスト。下35%：明るいアイボリー地に3段の文章。最下部3%：小さな金色の星。文字切れなし、同じ左位置に整列。

【下部の見出しを正確に表記】①「あなたはこんなタイプ」：文章から読み取れる長所を25〜35字。②「今年こんなことを頑張ってきたね」：本人の具体的な行動を25〜40字。③「これからのあなたへの小さなお告げ」：2027年の挑戦と12月の最初の一歩を40〜50字。各本文は2〜3行を目安に短く、読みやすい日本語で。文字化け、誤字、文の重複を避ける。

【本人の言葉・創作根拠】
頑張ったこと・できたこと：${d.reflection}
楽しかったこと・つながり：${d.connection||'未記入'}

入力されていない実績や性格、希望を決めつけない。押しつけず、具体的にねぎらう。最終出力は完成画像【1枚のみ】。`;}
  function urlPrompt(){const d=getForm();return `この人の2026年1〜11月の振り返りをもとに、星座×スイーツ×タロットの【完成カード画像を1枚だけ】直接生成してください。文章での説明・複数画像・コラージュは禁止。
【構図】縦長2:3。細い金の二重枠、安全余白5%。上15%：星座・日本語タイトル・英語副題。中央47%：スイーツ1種類の水彩イラストと月夜、星座の結び線。下35%：アイボリー地に金アイコン付き文章3段。下端3%：小さな星。日本語の文字は切らずに整列。
【文章の見出し】「あなたはこんなタイプ」「今年こんなことを頑張ってきたね」「これからのあなたへの小さなお告げ」。本人の長所と具体的な努力をねぎらい、2027年に試す新しい挑戦1つと2026年12月の15〜30分の一歩を優しく提案。各本文は25〜45字程度。
【画風】大人の女性が持ち帰りたくなる、静かで繊細な絵本調。星座・スイーツ・色は入力からAIが自動選択。本人の誕生星座や事実を推測しない。過剰なラメ・3D風は避ける。
【振り返り】頑張り：${d.reflection}\n楽しかったこと・つながり：${d.connection||'未記入'}
画像生成を実行し、単一カード画像1枚のみを出力。`;}
  function openDialog(text,reason){$('promptText').value=text;$('dialogIntro').textContent=reason||'自動入力されない場合は、以下の文章をコピーしてChatGPTに貼り付けてください。';const dialog=$('promptDialog');if(!dialog.open)dialog.showModal();}
  function checkInput(){if(getForm().reflection)return true;showScreen(1);$('reflection').classList.add('is-invalid');$('reflection').focus();notify('今年の頑張りを、ひとつご記入ください。');return false;}
  function openChatGPT(){if(!checkInput())return;const short=urlPrompt();const url='https://chatgpt.com/?q='+encodeURIComponent(short);if(url.length>12000){openDialog(cardPrompt(),'文章が長くなったため、コピーしてChatGPTへ貼り付けてください。');return;}
    // Run directly within the click handler, to avoid popup blockers.
    const popup=window.open(url,'_blank');if(!popup){openDialog(cardPrompt(),'新しいタブが開きませんでした。文章をコピーしてChatGPTへ貼り付けてください。');notify('ポップアップがブロックされた可能性があります。');return;}
    try{popup.opener=null}catch(e){}
    showScreen(3);
    notify('ChatGPTを開きました。内容を確認して、画像を生成してください。');
  }
  async function copyText(content){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(content);return true}const el=document.createElement('textarea');el.value=content;el.style.cssText='position:fixed;left:-10000px;top:0';document.body.append(el);el.focus();el.select();const ok=document.execCommand('copy');el.remove();return ok;}catch(e){return false;}}
  function makePost(manual=false){const d=getForm();const concise=(d.reflection||'今年の私が続けてきたこと').replace(/\s+/g,' ').slice(0,63);let text=`この一年の自分へ、おつかれさま。✧\n\n${concise}\n\n小さな歩みも、大切にできた一年でした。\n2027年も私らしく、一歩ずつ。\n\n#夜活コミュニティ #SHElikes`;
    if([...text].length>280)text=[...text].slice(0,280).join('');$('postText').value=text;postEdited=manual;updatePostCount();save();}
  function updatePostCount(){$('postCount').textContent=`${[...$('postText').value].length} / 280`;}
  function saveMemo(){const d=getForm();const text=`星の余韻｜2026年\n\n【今年頑張ったこと・できたこと】\n${d.reflection}\n\n【楽しかったこと・心に残ったつながり】\n${d.connection}\n\n【X投稿用メッセージ】\n${$('postText').value}\n\n※AIが提案した2027年の挑戦はChatGPTのカード画像に記載されています。`;const blob=new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='星の余韻_2026年のふりかえり.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('ふりかえりを保存しました。');}
  function previewUpload(e){const file=e.target.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12*1024*1024){notify('PNG・JPEG・WebPで12MB以下の画像を選んでください。');e.target.value='';return;}if(uploadedImageUrl)URL.revokeObjectURL(uploadedImageUrl);uploadedImageUrl=URL.createObjectURL(file);$('sharedCardImage').src=uploadedImageUrl;$('sharedCardImage').alt='ご自身で生成された完成カード';$('sharedImageNote').textContent='完成カードをプレビューしています。';notify('カード画像を表示しました。Xへの画像添付は投稿画面で行ってください。');}
  function bind(){
    $('homeButton').addEventListener('click',()=>showScreen(0));$('startButton').addEventListener('click',()=>showScreen(1));$('resetButton').addEventListener('click',clearAll);
    $('reflectionForm').addEventListener('submit',e=>e.preventDefault());
    document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showScreen(Number(b.dataset.go))));
    for(const id of ['reflection','connection'])$(id).addEventListener('input',()=>{$(id).classList.remove('is-invalid');updateCounts();save();});
    document.querySelectorAll('[data-suggest]').forEach(b=>b.addEventListener('click',()=>{const field=$(b.closest('[data-for]').dataset.for),s=b.dataset.suggest;if(field.value.includes(s)){notify('すでに入力されています。');return;}const v=field.value.trim()?field.value.trim()+'／'+s:s;if(v.length>field.maxLength){notify('入力文字数の上限に達しています。');return;}field.value=v;field.classList.remove('is-invalid');updateCounts();save();field.focus();}));
    $('reflectionNext').addEventListener('click',()=>{if(checkInput())showScreen(2)});
    $('createButton').addEventListener('click',openChatGPT);
    $('copyPromptButton').addEventListener('click',()=>{if(!checkInput())return;openDialog(cardPrompt(),'必要に応じて、文章をコピーしてChatGPTへ貼り付けてください。');});
    $('postText').addEventListener('input',()=>{postEdited=true;updatePostCount();save();});
    $('regeneratePost').addEventListener('click',()=>makePost(true));
    $('copyPostButton').addEventListener('click',async()=>{const t=$('postText').value.trim();if(!t){notify('投稿文をご入力ください。');return;}if(await copyText(t))notify('投稿文をコピーしました。');else notify('コピーできませんでした。文章を選択してコピーしてください。');});
    $('openXButton').addEventListener('click',()=>{const t=$('postText').value.trim();if(!t){notify('投稿文をご入力ください。');return;}const p=window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(t),'_blank');if(p)try{p.opener=null}catch(e){}else notify('新しいタブを開けませんでした。投稿文をコピーしてお使いください。');});
    $('cardUpload').addEventListener('change',previewUpload);$('saveMemoButton').addEventListener('click',saveMemo);
    $('dialogClose').addEventListener('click',()=>$('promptDialog').close());
    $('dialogCopy').addEventListener('click',async()=>{const t=$('promptText').value;if(await copyText(t)){notify('プロンプトをコピーしました。');}else{$('promptText').focus();$('promptText').select();notify('コピーできませんでした。選択された文章を手動でコピーしてください。');}});
    $('dialogOpen').addEventListener('click',()=>{const p=window.open('https://chatgpt.com/','_blank');if(p){try{p.opener=null}catch(e){}$('promptDialog').close();showScreen(3);notify('ChatGPTが開きました。プロンプトを貼り付けてください。');}else notify('新しいタブを開けませんでした。ブラウザの設定をご確認ください。');});
    $('howItWorks').addEventListener('click',()=>$('infoDialog').showModal());$('infoClose').addEventListener('click',()=>$('infoDialog').close());$('infoDone').addEventListener('click',()=>$('infoDialog').close());
    for(const id of ['promptDialog','infoDialog'])$(id).addEventListener('click',e=>{if(e.target===$(id))$(id).close();});
  }
  restore();bind();initCarousel();updateCounts();showScreen(0);updatePostCount();
})();
