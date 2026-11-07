(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const KEY='hoshi-no-yoin-requested-v11';
  const cards=[
    {src:'assets/card_canele.webp',title:'月のカヌレ'},
    {src:'assets/card_strawberry.webp',title:'太陽のいちごタルト'},
    {src:'assets/card_macaron.webp',title:'星風のマカロン'},
    {src:'assets/card_montblanc.webp',title:'森のモンブラン'}
  ];
  let page=0, cardIndex=0, timer=null, changing=false, toastTimer=null;
  let postTouched=false, photo=null, photoURL=null, promptBuilt='';

  const getText=()=>({effort:$('effort').value.trim(), joy:$('joy').value.trim()});
  const chars=s=>[...s].length;
  const clip=(s,n)=>chars(s)>n?[...s].slice(0,n-1).join('')+'…':s;

  function showToast(msg){ const el=$('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}  
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify({...getText(), post:$('postText').value, postTouched})); }catch(_e){} }
  function restore(){ try{ const d=JSON.parse(localStorage.getItem(KEY)||'null'); if(!d) return; if(typeof d.effort==='string') $('effort').value=d.effort; if(typeof d.joy==='string') $('joy').value=d.joy; if(typeof d.post==='string') $('postText').value=d.post; postTouched=Boolean(d.postTouched);}catch(_e){} }

  function setThemeClass(){ document.body.className='page-theme-'+page; }
  function setPage(next){
    next=Number(next);
    if(next>=2 && !getText().effort){ showToast('まずは 今年頑張ったことを入力してください'); next=1; }
    page=Math.max(0,Math.min(3,next));
    document.querySelectorAll('[data-page]').forEach(sec=>{ const on=Number(sec.dataset.page)===page; sec.hidden=!on; sec.classList.toggle('active',on); });
    document.querySelectorAll('[data-progress]').forEach((step,i)=>{ const idx=i+1; step.classList.toggle('current', page===idx); step.classList.toggle('done', page>idx); });
    setThemeClass();
    if(page===0) startSlider(); else stopSlider();
    if(page===3 && !postTouched) buildPost(false);
    window.scrollTo({top:0,behavior:'instant'});
  }

  function renderDots(){
    const dots=$('cardDots'); dots.innerHTML='';
    cards.forEach((card,i)=>{ const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',card.title); b.setAttribute('aria-current', String(i===cardIndex)); b.addEventListener('click',()=>showCard(i)); dots.appendChild(b); });
  }
  function showCard(i){
    if(changing) return; changing=true; const img=$('featureImage'); img.classList.add('fading');
    setTimeout(()=>{ cardIndex=(i+cards.length)%cards.length; img.src=cards[cardIndex].src; img.alt=cards[cardIndex].title+'のカード見本'; $('galleryCaption').textContent=cards[cardIndex].title+' · 作品見本'; [...$('cardDots').children].forEach((d,idx)=>d.setAttribute('aria-current', String(idx===cardIndex))); img.classList.remove('fading'); changing=false; },180);
    restartSlider();
  }
  function startSlider(){ stopSlider(); if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; timer=setInterval(()=>showCard(cardIndex+1), 6200); }
  function stopSlider(){ if(timer) clearInterval(timer); timer=null; }
  function restartSlider(){ if(page===0) startSlider(); }

  function updateReflect(){
    $('effortCount').textContent=`${chars($('effort').value)} / 520`; $('joyCount').textContent=`${chars($('joy').value)} / 350`; $('postCount').textContent=`${chars($('postText').value)} / 280`;
    const score=[chars($('effort').value)>0, chars($('effort').value)>=40, chars($('effort').value)>=90, chars($('joy').value)>0, chars($('joy').value)>=28].filter(Boolean).length;
    [...$('littleStars').children].forEach((s,idx)=>s.classList.toggle('lit', idx<score));
  }

  function buildPrompt(){
    const d=getText();
    const ref = `今年頑張ったこと：${d.effort}\n楽しかったこと・人とのつながり：${d.joy||'未記入'}`;
    return `【画像生成】次の振り返りから 星座×スイーツ×タロットカードの完成画像を 1枚だけ直接生成してください

【絶対条件】
・画像全体がカードそのもの
・縦長2:3
・上部は夜空とスイーツの美しい絵
・下部は明るいアイボリーの文章欄
・大人っぽく上品で 静かな雰囲気

【カード構図】
・細いアンティークゴールドの二重枠
・最上部に星座記号 日本語タイトル 英語副題
・上側約58%は 夜空 星座 月 灯り 花を背景にした繊細な水彩イラスト
・主役のスイーツは中央に大きく一種類だけ
・下側約42%はアイボリー地の整った文章欄
・文章欄は3段に区切り 左に見出し 右に本文の読みやすい構成

【固定見出し】
① あなたのタイプ
② 今年頑張ったこと
③ 来年のアクション

【本文ルール】
・見出し以外の本文には句読点「、」「。」を使わない
・各項目は2〜4行程度
・本人が書いた内容から自然に要約する
・成果や性格を大げさに創作しすぎない
・③では 2027年に向いていそうな挑戦を1つ と 2026年12月の最初の小さな行動を具体的に書く

【絵柄】
・20〜30代の働く女性に似合う 大人可愛い水彩タロット
・紺 ラベンダー アイボリー 古金を中心に上品にまとめる
・AI感を減らし 絵本のようにやわらかく繊細に描く
・全体は静かな夜のムード

【本人の振り返り】
${ref}

今すぐ完成した1枚のカード画像を生成してください`;
  }

  function revealPrompt(){
    if(!getText().effort){ setPage(1); showToast('まずは振り返りを入力してください'); return; }
    promptBuilt = buildPrompt();
    $('promptFlash').classList.add('show');
    setTimeout(()=>{
      $('promptFlash').classList.remove('show');
      $('inlinePrompt').value=promptBuilt;
      $('promptText').value=promptBuilt;
      $('promptPanel').hidden=false;
      $('promptPanel').scrollIntoView({behavior:'smooth', block:'nearest'});
      showToast('プロンプトを作成しました');
    }, 1250);
  }

  async function copy(text){
    try{
      if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else { const t=document.createElement('textarea'); t.value=text; t.style.position='fixed'; t.style.left='-9999px'; document.body.appendChild(t); t.select(); const ok=document.execCommand('copy'); t.remove(); if(!ok) throw new Error('copy'); }
      return true;
    }catch(_e){ $('promptText').value=text; $('promptModal').showModal(); return false; }
  }

  function openChat(){
    if(!promptBuilt) promptBuilt=buildPrompt();
    const url='https://chatgpt.com/?q='+encodeURIComponent(promptBuilt);
    if(url.length>12000){ $('promptText').value=promptBuilt; $('promptModal').showModal(); showToast('文章が長いため コピーして貼り付けてください'); return; }
    window.open(url,'_blank','noopener,noreferrer');
    showToast('ChatGPTを開きました 見本カードや構図見本を添付すると近づけやすいです');
  }

  function buildPost(mark){
    const d=getText();
    const text=`今年のわたしに おつかれさま ✧

今年頑張ったこと：${clip(d.effort,70)}${d.joy?`
楽しかったこと：${clip(d.joy,48)}`:''}

来年も 自分のペースで一歩ずつ進みたい

#夜活コミュニティ #SHElikes`;
    $('postText').value=text; postTouched=!!mark; updateReflect(); save();
  }

  function openX(){ const text=$('postText').value.trim(); if(!text){ showToast('投稿文を入力してください'); return; } window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text),'_blank','noopener,noreferrer'); showToast(photo?'Xで画像を添付してください':'Xの投稿画面を開きました'); }
  function updateShare(){ const can=Boolean(photo && navigator.share && navigator.canShare && navigator.canShare({files:[photo]})); $('nativeShare').hidden=!can; $('shareHint').textContent=can?'この端末では 画像と文章を一緒に共有できます 共有先でXを選択してください':'Xで投稿文を開いたあと 画像を添付して投稿してください'; }
  async function nativeShare(){ if(!(photo && navigator.share && navigator.canShare && navigator.canShare({files:[photo]}))){ showToast('この端末では画像つき共有に対応していません'); return;} try{ await navigator.share({files:[photo], text:$('postText').value.trim()}); }catch(e){ if(e.name!=='AbortError') showToast('共有できませんでした'); }}
  function onImage(file){ if(!file) return; if(!/^image\//.test(file.type)){ showToast('画像ファイルを選んでください'); return; } if(file.size>16*1024*1024){ showToast('16MB以下の画像を選んでください'); return; } if(photoURL) URL.revokeObjectURL(photoURL); photo=file; photoURL=URL.createObjectURL(file); $('uploadedImage').src=photoURL; $('uploadedBox').hidden=false; $('uploadPlaceholder').hidden=true; $('imageStatus').textContent=file.name+' を読み込みました'; updateShare(); }
  function downloadMemo(){ const d=getText(); const text=`星の余韻

【今年頑張ったこと】
${d.effort}

【楽しかったこと・人とのつながり】
${d.joy}

【生成プロンプト】
${promptBuilt||buildPrompt()}

【投稿文】
${$('postText').value}
`; const blob=new Blob(['﻿'+text],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='星の余韻_メモ.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),800); }
  function resetAll(){ if(!confirm('入力内容を最初から消去しますか')) return; ['effort','joy','postText','inlinePrompt','promptText'].forEach(id=>$(id).value=''); postTouched=false; promptBuilt=''; $('promptPanel').hidden=true; if(photoURL) URL.revokeObjectURL(photoURL); photo=null; photoURL=null; $('uploadedBox').hidden=true; $('uploadPlaceholder').hidden=false; $('imageStatus').textContent='ChatGPTで保存した画像を選択してください'; $('imageFile').value=''; try{localStorage.removeItem(KEY)}catch(_e){} updateReflect(); updateShare(); setPage(0); showToast('最初の状態に戻しました'); }

  function bind(){
    $('goHome').addEventListener('click',()=>setPage(0)); $('start').addEventListener('click',()=>setPage(1)); $('clearAll').addEventListener('click',resetAll);
    document.querySelectorAll('[data-goto]').forEach(btn=>btn.addEventListener('click',()=>setPage(btn.dataset.goto)));
    ['effort','joy'].forEach(id=>$(id).addEventListener('input',()=>{updateReflect(); if(!postTouched) buildPost(false); save();}));
    document.querySelectorAll('.suggestions button').forEach(btn=>btn.addEventListener('click',()=>{ const field=$(btn.dataset.field), val=btn.dataset.value; const next=field.value.trim()?field.value.trim()+'\n'+val:val; if(chars(next)>Number(field.maxLength)){ showToast('入力の上限に達します'); return;} field.value=next; field.dispatchEvent(new Event('input',{bubbles:true})); field.focus(); }));
    $('goMake').addEventListener('click',()=>setPage(2)); $('buildPrompt').addEventListener('click',revealPrompt); $('openChatGPT').addEventListener('click',openChat);
    $('copyPrompt').addEventListener('click',async()=>{ const txt=promptBuilt||buildPrompt(); if(await copy(txt)) showToast('プロンプトをコピーしました'); }); $('viewPrompt').addEventListener('click',()=>{ $('promptText').value=promptBuilt||buildPrompt(); $('promptModal').showModal(); }); $('goShare').addEventListener('click',()=>setPage(3));
    $('rebuildPost').addEventListener('click',()=>{ buildPost(true); showToast('投稿文を作り直しました');}); $('postText').addEventListener('input',()=>{ postTouched=true; updateReflect(); save(); }); $('copyPost').addEventListener('click',async()=>{ const txt=$('postText').value.trim(); if(!txt){showToast('投稿文を入力してください'); return;} if(await copy(txt)) showToast('投稿文をコピーしました'); }); $('postToX').addEventListener('click',openX); $('nativeShare').addEventListener('click',nativeShare);
    $('imageFile').addEventListener('change',e=>onImage(e.target.files?.[0])); $('downloadMemo').addEventListener('click',downloadMemo);
    $('openPrivacy').addEventListener('click',()=>$('privacyModal').showModal()); $('closePrivacy').addEventListener('click',()=>$('privacyModal').close()); $('closePrompt').addEventListener('click',()=>$('promptModal').close()); $('modalCopy').addEventListener('click',async()=>{ if(await copy($('promptText').value)){$('promptModal').close(); showToast('文章をコピーしました');}}); $('modalChat').addEventListener('click',()=>window.open('https://chatgpt.com/','_blank','noopener,noreferrer'));
    ['promptModal','privacyModal'].forEach(id=>$(id).addEventListener('click',e=>{ if(e.target===$(id)) $(id).close(); }));
    $('prevCard').addEventListener('click',()=>showCard(cardIndex-1)); $('nextCard').addEventListener('click',()=>showCard(cardIndex+1)); document.addEventListener('visibilitychange',()=>document.hidden?stopSlider():page===0&&startSlider()); $('galleryRegion').addEventListener('mouseenter',stopSlider); $('galleryRegion').addEventListener('mouseleave',()=>page===0&&startSlider());
  }

  restore(); bind(); renderDots(); updateReflect(); updateShare(); buildPost(false); setPage(0); startSlider();
})();