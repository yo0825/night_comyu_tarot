(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const KEY='hoshi-no-yoin-final-2026';
  const cards=[
    {src:'assets/card_canele.webp',title:'月のカヌレ'},
    {src:'assets/card_strawberry.webp',title:'太陽のいちごタルト'},
    {src:'assets/card_macaron.webp',title:'星風のマカロン'},
    {src:'assets/card_montblanc.webp',title:'森のモンブラン'}
  ];
  let page=0,cardIndex=0,timer=null,changeToken=0,toastTimer=null;
  let postTouched=false,photo=null,photoURL=null;
  const getText=()=>({effort:$('effort').value.trim(),joy:$('joy').value.trim()});
  const shorten=(text,n)=>[...text].length>n?[...text].slice(0,n-1).join('')+'…':text;
  const browserCanShareFile=file=>{
    try{return Boolean(file && navigator.share && navigator.canShare && navigator.canShare({files:[file]}));}catch(_e){return false;}
  };

  function notify(text){
    const toast=$('toast');toast.textContent=text;toast.classList.add('show');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),3600);
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify({...getText(),post:$('postText').value,postTouched}));}catch(_e){}
  }
  function restore(){
    try{
      const d=JSON.parse(localStorage.getItem(KEY)||'null');if(!d)return;
      if(typeof d.effort==='string')$('effort').value=d.effort;
      if(typeof d.joy==='string')$('joy').value=d.joy;
      if(typeof d.post==='string')$('postText').value=d.post;
      postTouched=Boolean(d.postTouched);
    }catch(_e){}
  }
  function updateCounts(){
    $('effortCount').textContent=[...$('effort').value].length+' / 520';
    $('joyCount').textContent=[...$('joy').value].length+' / 350';
    const l=$('effort').value.length,j=$('joy').value.length;
    const score=Number(l>0)+Number(l>=35)+Number(l>=80)+Number(j>0)+Number(j>=40);
    [...$('littleStars').children].forEach((s,i)=>s.classList.toggle('lit',i<score));
    $('postCount').textContent=[...$('postText').value].length+' / 280';
  }
  function setPage(newPage){
    newPage=Number(newPage);
    if(newPage>=2 && !getText().effort){notify('まずは今年頑張ったことを一つ入力してください');newPage=1;}
    page=Math.max(0,Math.min(3,newPage));
    document.querySelectorAll('[data-page]').forEach(el=>{
      const active=Number(el.dataset.page)===page;
      el.hidden=!active;el.classList.toggle('active',active);
    });
    document.querySelectorAll('[data-progress]').forEach((el,i)=>{
      el.classList.toggle('current',page===i+1);
      el.classList.toggle('done',page>i+1);
    });
    if(page===3&&!postTouched)buildPost(false);
    if(page===0)startCarousel();else stopCarousel();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function stopCarousel(){if(timer)clearInterval(timer);timer=null;}
  function startCarousel(){
    stopCarousel();
    if(page!==0 || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    timer=setInterval(()=>moveCard(1),5900);
  }
  function showCard(index){
    cardIndex=(index+cards.length)%cards.length;
    const card=cards[cardIndex]; const image=$('featureImage');const myToken=++changeToken;
    const loaded=new Image();loaded.onload=()=>{
      if(myToken!==changeToken)return;
      image.classList.add('fading');
      setTimeout(()=>{
        if(myToken!==changeToken)return;
        image.src=loaded.src;image.alt=card.title+'のカード見本';
        image.classList.remove('fading');
      },260);
    };
    loaded.onerror=()=>{if(myToken===changeToken)notify('カード画像を読み込めませんでした');};
    loaded.src=card.src;
    $('galleryCaption').textContent=card.title+' · 作品見本';
    document.querySelectorAll('#cardDots button').forEach((button,i)=>button.setAttribute('aria-current',String(i===cardIndex)));
    $('downloadSample').href=card.src;
  }
  function moveCard(step){showCard(cardIndex+step);startCarousel();}
  function initializeCarousel(){
    cards.forEach((c,i)=>{
      const btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-label',c.title+'を表示');btn.setAttribute('aria-current',String(i===0));
      btn.addEventListener('click',()=>{showCard(i);startCarousel();});$('cardDots').appendChild(btn);
    });
    $('prevCard').addEventListener('click',()=>moveCard(-1));
    $('nextCard').addEventListener('click',()=>moveCard(1));
    $('galleryRegion').addEventListener('mouseenter',stopCarousel);
    $('galleryRegion').addEventListener('mouseleave',()=>page===0&&startCarousel());
    $('galleryRegion').addEventListener('focusin',stopCarousel);
    $('galleryRegion').addEventListener('focusout',e=>{if(!e.currentTarget.contains(e.relatedTarget))startCarousel();});
    document.addEventListener('visibilitychange',()=>document.hidden?stopCarousel():(page===0&&startCarousel()));
    $('downloadSample').href=cards[0].src;
    startCarousel();
  }
  function buildPrompt(full=false){
    const d=getText();const data=`【本人の振り返り】\n今年頑張ったこと・できたこと：${d.effort}\n楽しかったこと・人とのつながり：${d.joy||'未記入'}`;
    const directive=`今年の振り返りをもとに「星座×スイーツ×タロット」の【完成した縦長カード画像を1枚だけ】直接生成してください 文章回答 比較画像 複数枚 コラージュは禁止\n【固定見出し】①あなたのタイプ ②今年頑張ったこと ③来年のアクション 一字一句変えない\n【構図】縦長2:3 画像の全体が1枚のカード 金の繊細な二重枠 四隅は小さく角丸 上部約42%に星座シンボルと短い和文タイトル 英語の副題 そして水彩スイーツの美しい夜景 下部約55%は明るいアイボリー地に3つの読みやすいメッセージ 最下部約3%は小さな金の装飾\n【文章】3段の各本文は原則2行で25〜42字程度 記述の事実を尊重し架空の成果を作らない 3つ目は2027年に向けた具体的な挑戦1つと2026年12月に始める小さな準備を提案\n【文字】画像内の日本語には読点「、」と句点「。」を一切使わない 文字欠け 重複 誤字を避ける\n【見た目】20〜30代の働く女性にも似合う大人可愛い繊細な手描き水彩 紙の質感 金の細線 月 夜景 星座 季節の花 1種類のスイーツが主役 AI特有の過剰な光沢や過密な飾りは避け余白を重視\n【変化】振り返りに合う星座風モチーフとスイーツをAIが一つ選ぶ 星座は生まれ星座だと決めつけない 色の組合せは月のカヌレ・太陽のいちごタルト・星風のマカロン・森のモンブランのような世界観から選ぶ\n${data}\n必ず画像生成を実行しカード1枚のみを出力してください`;
    if(!full)return directive;
    return `【最重要】完成画像を1枚のみ生成してください 説明は不要です\n\n${directive}\n\n【レイアウトの精密指定】\n上部タイトルは大きくしすぎず 星座記号・日本語タイトル・短い英語の副題をきれいに揃える\n中央のイラストにはスイーツを大きく描く 背景は月明かりや夕暮れの水彩世界 金の細い星座線を添える\n下部は3段を均等に分け 各段の見出しと本文を中央寄せか左揃えで統一 見出しは本文より少し強くする\n文章を詰め込まず 装飾より可読性を優先 日本語本文の句読点なしを厳守\n具体性のない一般論ではなく 本人の記述に合った良さと実際の頑張りを言葉にする\n来年のアクションには無理のない 小さく始められる提案を含める\n\n【最終検査】3見出し 1種類のスイーツ 全体1枚カード 2:3比率 日本語句読点なし 他のカードは描かない`;
  }
  function modalPrompt(){
    $('promptText').value=buildPrompt(true);
    if(!$('promptModal').open)$('promptModal').showModal();
  }
  async function copyText(text){
    try{
      if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}
      const tmp=document.createElement('textarea');tmp.value=text;tmp.style.position='fixed';tmp.style.left='-9999px';document.body.appendChild(tmp);tmp.select();
      const ok=document.execCommand('copy');tmp.remove();if(!ok)throw new Error('copy unsupported');return true;
    }catch(_e){$('promptText').value=text;if(!$('promptModal').open)$('promptModal').showModal();$('promptText').focus();$('promptText').select();notify('コピーできませんでした 表示された文章をコピーしてください');return false;}
  }
  function openChatGPT(){
    if(!getText().effort){setPage(1);return;}
    const url='https://chatgpt.com/?q='+encodeURIComponent(buildPrompt(false));
    if(url.length>10500){modalPrompt();notify('文章が長いため コピー方式で開いてください');return;}
    window.open(url,'_blank','noopener,noreferrer');
    notify('ChatGPTを開きました 内容を確認して画像を生成してください');
  }
  function buildPost(touched){
    const d=getText();
    const f=shorten(d.effort,82);
    const j=d.joy?'\nうれしかったこと：'+shorten(d.joy,47):'';
    const post=`今年の私に おつかれさま ✧\n\n今年頑張ったこと：${f}${j}\n\n2027年も 自分のペースで一歩ずつ\n\n#夜活コミュニティ #SHElikes`;
    $('postText').value=[...post].slice(0,280).join('');
    postTouched=touched;updateCounts();save();
  }
  function getPost(){return $('postText').value.trim();}
  function openX(){
    if(!getPost()){notify('投稿文を入力してください');return;}
    const url='https://twitter.com/intent/tweet?text='+encodeURIComponent(getPost());
    window.open(url,'_blank','noopener,noreferrer');
    notify(photo?'Xの投稿画面に文章を渡しました 画像は必要に応じて添付してください':'Xの投稿画面を開きました');
  }
  function refreshShare(){
    const can=browserCanShareFile(photo);
    $('nativeShare').hidden=!can;
    $('shareHint').textContent=can
      ?'この端末では画像と文章を一緒に共有できます Xを共有先に選択してください'
      :'Xで投稿文を開いたあと 画像を添付して投稿してください';
  }
  async function shareFile(){
    if(!browserCanShareFile(photo)){notify('この端末では画像付き共有に対応していません');return;}
    try{await navigator.share({files:[photo],text:getPost()});}
    catch(error){if(error.name!=='AbortError')notify('共有できませんでした Xの投稿画面をご利用ください');}
  }
  function uploadImage(file){
    if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){notify('PNG JPG WebPの画像を選んでください');return;}
    if(file.size>16*1024*1024){notify('画像は16MB以下にしてください');return;}
    if(photoURL)URL.revokeObjectURL(photoURL);
    photo=file;photoURL=URL.createObjectURL(file);
    $('uploadedImage').src=photoURL;$('uploadedBox').hidden=false;$('uploadPlaceholder').hidden=true;
    $('imageStatus').textContent=file.name+'を読み込みました';refreshShare();notify('完成カードを表示しました');
  }
  function downloadMemo(){
    const d=getText();const body=`星の余韻 2026年のふりかえり\n\n【今年頑張ったこと】\n${d.effort}\n\n【楽しかったこと・人とのつながり】\n${d.joy}\n\n【X投稿文】\n${getPost()}\n`;
    const href=URL.createObjectURL(new Blob(['\uFEFF'+body],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=href;a.download='星の余韻_ふりかえり.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);notify('メモを保存しました');
  }
  function clearAll(){
    if(!confirm('この端末に保存された入力と投稿文を消去しますか'))return;
    $('effort').value='';$('joy').value='';$('postText').value='';$('imageFile').value='';postTouched=false;
    if(photoURL)URL.revokeObjectURL(photoURL);photoURL=null;photo=null;
    $('uploadedImage').removeAttribute('src');$('uploadedBox').hidden=true;$('uploadPlaceholder').hidden=false;
    $('imageStatus').textContent='ChatGPTで保存した画像を選択してください';
    try{localStorage.removeItem(KEY);}catch(_e){}
    updateCounts();refreshShare();setPage(0);notify('入力内容を消去しました');
  }
  function bind(){
    $('goHome').addEventListener('click',()=>setPage(0));
    $('clearAll').addEventListener('click',clearAll);
    $('start').addEventListener('click',()=>setPage(1));
    document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.goto)));
    ['effort','joy'].forEach(id=>$(id).addEventListener('input',()=>{
      updateCounts();if(!postTouched)buildPost(false);save();
    }));
    document.querySelectorAll('[data-field]').forEach(b=>b.addEventListener('click',()=>{
      const field=$(b.dataset.field);const text=b.dataset.value;
      if(field.value.includes(text)){notify('その内容は入力されています');return;}
      const updated=field.value.trim()?field.value.trim()+'\n'+text:text;
      if([...updated].length>field.maxLength){notify('文字数の上限に達しています');return;}
      field.value=updated;field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();
    }));
    $('goMake').addEventListener('click',()=>setPage(2));
    $('openChatGPT').addEventListener('click',openChatGPT);
    $('copyPrompt').addEventListener('click',async()=>{if(await copyText(buildPrompt(true)))notify('生成プロンプトをコピーしました');});
    $('viewPrompt').addEventListener('click',modalPrompt);
    $('goShare').addEventListener('click',()=>setPage(3));
    $('postText').addEventListener('input',()=>{postTouched=true;updateCounts();save();});
    $('rebuildPost').addEventListener('click',()=>{buildPost(true);notify('投稿文を作り直しました');});
    $('copyPost').addEventListener('click',async()=>{if(!getPost()){notify('投稿文を入力してください');return;}if(await copyText(getPost()))notify('投稿文をコピーしました');});
    $('postToX').addEventListener('click',openX);
    $('nativeShare').addEventListener('click',shareFile);
    $('imageFile').addEventListener('change',e=>uploadImage(e.target.files?.[0]));
    $('downloadMemo').addEventListener('click',downloadMemo);
    $('openPrivacy').addEventListener('click',()=>$('privacyModal').showModal());
    $('closePrivacy').addEventListener('click',()=>$('privacyModal').close());
    $('closePrompt').addEventListener('click',()=>$('promptModal').close());
    $('modalCopy').addEventListener('click',async()=>{if(await copyText($('promptText').value)){$('promptModal').close();notify('文章をコピーしました');}});
    $('modalChat').addEventListener('click',()=>{window.open('https://chatgpt.com/','_blank','noopener,noreferrer');$('promptModal').close();});
    ['promptModal','privacyModal'].forEach(id=>$(id).addEventListener('click',e=>{if(e.target===$(id))$(id).close();}));
  }
  restore();bind();initializeCarousel();updateCounts();refreshShare();setPage(0);
})();
