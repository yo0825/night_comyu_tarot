(()=>{
  'use strict';
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'hoshi-rebuild-v10';
  const cards = [
    {src:'assets/original_card.webp', name:'つながりのデザイナー'},
    {src:'assets/card_1.webp', name:'月のカヌレ'},
    {src:'assets/card_2.webp', name:'太陽のいちごタルト'},
    {src:'assets/card_3.webp', name:'星風のマカロン'},
    {src:'assets/card_4.webp', name:'森のモンブラン'}
  ];
  let view = 0, cardIndex = 0, timer = null, toastTimer = null;
  let selectedFile = null, objectUrl = null, postTouched = false;

  const safe = s => (s || '').trim();
  const getData = () => ({ reflection: safe($('reflection').value), connection: safe($('connection').value) });
  const clip = (s, n) => [...s].length > n ? [...s].slice(0, n - 1).join('') + '…' : s;

  function showToast(message){
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...getData(), post: $('postText').value, postTouched })); }catch(_e){}
  }

  function restore(){
    try{
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if(!data) return;
      if(typeof data.reflection === 'string') $('reflection').value = data.reflection;
      if(typeof data.connection === 'string') $('connection').value = data.connection;
      if(typeof data.post === 'string') $('postText').value = data.post;
      postTouched = Boolean(data.postTouched);
    }catch(_e){}
  }

  function updateCounts(){
    $('reflectionCount').textContent = [...$('reflection').value].length;
    $('connectionCount').textContent = [...$('connection').value].length;
    const score = [
      $('reflection').value.length > 0,
      $('reflection').value.length >= 40,
      $('reflection').value.length >= 90,
      $('connection').value.length > 0,
      $('connection').value.length >= 30
    ].filter(Boolean).length;
    [...$('starMeter').children].forEach((star, i) => star.classList.toggle('on', i < score));
    const n = [...$('postText').value].length;
    $('postCount').textContent = `${n} / 280`;
  }

  function setView(next){
    next = Number(next);
    if(next >= 2 && !getData().reflection){
      showToast('まずは 今年頑張ったことを入力してください');
      next = 1;
    }
    view = Math.max(0, Math.min(3, next));
    document.querySelectorAll('[data-view]').forEach(section => {
      const active = Number(section.dataset.view) === view;
      section.hidden = !active;
      section.classList.toggle('is-active', active);
    });
    document.querySelectorAll('[data-progress]').forEach((step, idx) => {
      const stepNo = idx + 1;
      step.classList.toggle('current', view === stepNo);
      step.classList.toggle('done', view > stepNo);
    });
    if(view === 3 && !postTouched) buildPost(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    if(view === 0) startSlider(); else stopSlider();
  }

  function renderCard(){
    const card = cards[cardIndex];
    $('heroCardImage').src = card.src;
    $('heroCardImage').alt = `${card.name} のカード見本`;
    $('cardDots').querySelectorAll('button').forEach((btn, i) => btn.setAttribute('aria-current', String(i === cardIndex)));
  }

  function startSlider(){
    stopSlider();
    if(document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer = setInterval(() => {
      cardIndex = (cardIndex + 1) % cards.length;
      renderCard();
    }, 6200);
  }
  function stopSlider(){ if(timer) clearInterval(timer); timer = null; }
  function moveCard(delta){ cardIndex = (cardIndex + delta + cards.length) % cards.length; renderCard(); startSlider(); }
  function initSlider(){
    const dots = $('cardDots');
    cards.forEach((card, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', card.name);
      btn.setAttribute('aria-current', String(i === cardIndex));
      btn.addEventListener('click', () => { cardIndex = i; renderCard(); startSlider(); });
      dots.appendChild(btn);
    });
    $('prevCard').addEventListener('click', () => moveCard(-1));
    $('nextCard').addEventListener('click', () => moveCard(1));
    document.addEventListener('visibilitychange', () => document.hidden ? stopSlider() : (view === 0 && startSlider()));
    $('heroStage').addEventListener('mouseenter', stopSlider);
    $('heroStage').addEventListener('mouseleave', () => view === 0 && startSlider());
    renderCard();
    startSlider();
  }

  function buildPrompt(full = false){
    const d = getData();
    const base = `今年頑張ったこと：${d.reflection}
楽しかったこと・人とのつながり：${d.connection || '未記入'}`;
    if(!full){
      return `【画像生成】次の振り返りから 星座×スイーツ×タロットカードを 1枚だけ直接生成して
【カード仕様】縦長2:3 画像全体がカード 細いアンティークゴールド二重枠 安全余白5% 机の上の写真にはしない
【レイアウト】上13%は星座記号 日本語タイトル 英語副題 中央50%はスイーツと夜空の水彩画 下34%はアイボリー地に3段の文章 最下部3%は小さな金装飾
【固定見出し】①あなたのタイプ ②今年頑張ったこと ③来年のアクション
【文のルール】見出し以外の日本語には句読点「、」「。」を使わない 2〜3行で読みやすく 本人の実績や性格を捏造しない 占いとして断定しない
【内容】③には 2027年に合う挑戦1つと 2026年12月の最初の小さな行動を入れる
【絵柄】最初の見本のような上品な水彩タロット 20〜30代の働く女性向け 紺 くすみラベンダー アイボリー 古金 花 月 星灯りを繊細に スイーツと星座は内容に合うものを選ぶ
【本人の振り返り】
${base}
今すぐ1枚の画像を生成`;
    }
    return `【依頼】
本人の2026年1〜11月の振り返りから 星座×スイーツ×タロットカードの完成画像を 1枚だけ生成してください

【見た目】
最初に作った見本カードの雰囲気に近い 繊細な水彩タロット
・縦長2:3 画像全体がカード
・細いアンティークゴールド二重枠 角丸は控えめ
・上13%に星座記号 短い日本語タイトル 控えめな英語副題
・中央50%にスイーツ1種類を主役にした月夜の美しい水彩画
・下34%を明るいアイボリー地にし 3つの文章を読みやすく配置
・最下部3%に小さな金の飾り

【固定見出し】
① あなたのタイプ
② 今年頑張ったこと
③ 来年のアクション

【文字ルール】
カード内の日本語本文には句読点「、」「。」を使わない
各本文は 2〜3行
見出しと本文は十分に読みやすい大きさ

【内容ルール】
①は本人の言葉から見える長所や雰囲気
②は実際に頑張ったことをやさしくねぎらう
③は 2027年の挑戦1つと 2026年12月の最初の15〜30分の小さな行動
書かれていない成果や性格は創作しない

【世界観】
20〜30代の働く女性に似合う 上品で静かな大人可愛い世界観
紺 くすみラベンダー アイボリー 古金を軸に 花 月 星 ランタンのやさしい灯り

【本人の振り返り】
${base}`;
  }

  function openPromptDialog(text){
    $('promptField').value = text;
    if(!$('promptDialog').open) $('promptDialog').showModal();
  }

  async function copyText(text){
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-99999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if(!ok) throw new Error('copy failed');
      }
      return true;
    } catch(_e){
      openPromptDialog(text);
      showToast('コピーできないため 文章を表示しました');
      return false;
    }
  }

  function openChat(){
    if(!getData().reflection){ setView(1); return; }
    const prompt = buildPrompt(false);
    const url = 'https://chatgpt.com/?q=' + encodeURIComponent(prompt);
    if(url.length > 10000){
      openPromptDialog(buildPrompt(true));
      showToast('文章が長いため コピーしてChatGPTへ貼り付けてください');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('ChatGPTを開きました 画像を保存したら次へ進んでください');
  }

  function buildPost(markTouched){
    const d = getData();
    const a = clip(d.reflection, 75);
    const b = d.connection ? `
うれしかったこと：${clip(d.connection, 50)}` : '';
    $('postText').value = `今年のわたしに おつかれさま ✧

今年頑張ったこと：${a}${b}

来年も 自分のペースで一歩ずつ進みたい

#夜活コミュニティ #SHElikes`;
    postTouched = !!markTouched;
    updateCounts();
    save();
  }

  function currentPost(){ return $('postText').value.trim(); }

  function openX(){
    const text = currentPost();
    if(!text){ showToast('投稿文を入力してください'); return; }
    const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(selectedFile ? 'X上で画像を添付してください' : 'Xの投稿画面を開きました');
  }

  function updateShareButton(){
    const button = $('nativeShareButton');
    const can = Boolean(selectedFile && navigator.share && navigator.canShare && navigator.canShare({ files:[selectedFile] }));
    button.hidden = !can;
    $('shareHelp').textContent = can
      ? 'この端末では 画像と文章を一緒に共有できます 共有先でXを選択してください'
      : 'Xへは文章を自動で渡します 画像はアップロードした場合に一緒に共有できる端末があります';
  }

  async function nativeShare(){
    if(!(selectedFile && navigator.share && navigator.canShare && navigator.canShare({ files:[selectedFile] }))){
      showToast('この端末では 画像つき共有に対応していません');
      return;
    }
    try{
      await navigator.share({ files:[selectedFile], text: currentPost() });
    } catch(err){
      if(err.name !== 'AbortError') showToast('共有できませんでした');
    }
  }

  function setImage(file){
    if(!file) return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)) { showToast('PNG JPG WebP の画像を選んでください'); return; }
    if(file.size > 16 * 1024 * 1024) { showToast('16MB以下の画像を選んでください'); return; }
    if(objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    selectedFile = file;
    $('shareCardImage').src = objectUrl;
    $('shareCardImage').alt = 'アップロードした完成カード';
    $('uploadNote').textContent = `${file.name} を表示しています`;
    $('previewTag').textContent = 'YOUR LITTLE STAR';
    $('uploadBox').classList.add('has-user-image');
    updateShareButton();
    showToast('画像を読み込みました');
  }

  function downloadMemo(){
    const d = getData();
    const text = `星のふりかえりカード

【今年頑張ったこと】
${d.reflection}

【楽しかったこと・人とのつながり】
${d.connection}

【投稿文】
${currentPost()}
`;
    const blob = new Blob(['﻿' + text], { type:'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '星のふりかえりカード_メモ.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 800);
    showToast('メモを保存しました');
  }

  function reset(){
    if(!confirm('入力内容と投稿文を消去しますか')) return;
    $('reflection').value = ''; $('connection').value = ''; $('postText').value = '';
    postTouched = false;
    if(objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null; selectedFile = null; $('imageUpload').value = '';
    $('shareCardImage').src = 'assets/original_card.webp';
    $('shareCardImage').alt = 'カード見本';
    $('previewTag').textContent = '見本カード';
    $('uploadNote').textContent = 'ChatGPTで保存したカード画像をアップロードすると ここに表示されます';
    $('uploadBox').classList.remove('has-user-image');
    try{ localStorage.removeItem(STORAGE_KEY); }catch(_e){}
    updateCounts(); updateShareButton(); setView(0); showToast('最初の状態に戻しました');
  }

  function bind(){
    $('brandButton').addEventListener('click', () => setView(0));
    $('startButton').addEventListener('click', () => setView(1));
    $('resetButton').addEventListener('click', reset);
    document.querySelectorAll('[data-goto]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.goto)));
    ['reflection','connection'].forEach(id => $(id).addEventListener('input', () => { updateCounts(); if(!postTouched) buildPost(false); save(); }));
    document.querySelectorAll('[data-append]').forEach(btn => btn.addEventListener('click', () => {
      const target = $(btn.dataset.append); const text = btn.dataset.text;
      if(target.value.includes(text)) { showToast('すでに追加されています'); return; }
      const next = target.value.trim() ? target.value.trim() + "\n" + text : text;
      if(next.length > target.maxLength) { showToast('入力の上限に達します'); return; }
      target.value = next; target.dispatchEvent(new Event('input', { bubbles:true })); target.focus();
    }));
    $('toMakeButton').addEventListener('click', () => setView(2));
    $('generateButton').addEventListener('click', openChat);
    $('copyPromptButton').addEventListener('click', async() => { if(await copyText(buildPrompt(true))) showToast('プロンプトをコピーしました'); });
    $('toShareButton').addEventListener('click', () => setView(3));
    $('postText').addEventListener('input', () => { postTouched = true; updateCounts(); save(); });
    $('makePostButton').addEventListener('click', () => { buildPost(true); showToast('投稿文を作り直しました'); });
    $('copyPostButton').addEventListener('click', async() => { if(!currentPost()) { showToast('投稿文を入力してください'); return; } if(await copyText(currentPost())) showToast('投稿文をコピーしました'); });
    $('openXButton').addEventListener('click', openX);
    $('nativeShareButton').addEventListener('click', nativeShare);
    $('imageUpload').addEventListener('change', e => setImage(e.target.files?.[0]));
    $('downloadMemoButton').addEventListener('click', downloadMemo);
    $('policyButton').addEventListener('click', () => $('policyDialog').showModal());
    $('closePolicyDialog').addEventListener('click', () => $('policyDialog').close());
    $('closePromptDialog').addEventListener('click', () => $('promptDialog').close());
    $('dialogCopy').addEventListener('click', async() => { if(await copyText($('promptField').value)) { $('promptDialog').close(); showToast('文章をコピーしました'); } });
    $('dialogOpenChat').addEventListener('click', () => { window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer'); $('promptDialog').close(); });
    ['promptDialog','policyDialog'].forEach(id => $(id).addEventListener('click', e => { if(e.target === $(id)) $(id).close(); }));
  }

  restore(); bind(); initSlider(); updateCounts(); updateShareButton(); setView(0);
})();