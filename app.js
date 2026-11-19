(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const legacyDraftKey = 'hoshi-no-yoin-requested-v11';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pages = [...document.querySelectorAll('[data-page]')];
  const progress = [...document.querySelectorAll('[data-progress]')];
  const samples = [
    { key: 'canele', title: '月のカヌレ' },
    { key: 'tart', title: '太陽のいちごタルト' },
    { key: 'macaron', title: '星風のマカロン' },
    { key: 'montblanc', title: '森のモンブラン' }
  ];
  const artwork = card => 'assets/sample-' + card.key + '.webp';
  const fields = [['connection', 'つながり'], ['joy', '喜び'], ['challenge', '挑戦'], ['growth', '成長']];
  const getText = () => fields.map(([id, label]) => [label, $(id).value.trim()]);
  const hasReflection = () => getText().some(([, value]) => value);

  let page = 0;
  let cardIndex = 0;
  let toastTimer;
  let promptTimer;
  let promptBuilt = '';
  let clearEverything = false;

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function clearSavedDraft() {
    try {
      localStorage.removeItem(legacyDraftKey);
    } catch {
      // The current form is cleared even if browser storage is unavailable.
    }
  }

  function showEffortError(visible) {
    $('effortError').hidden = !visible;
    if (visible) $('connection').setAttribute('aria-invalid', 'true');
    else $('connection').removeAttribute('aria-invalid');
  }

  function setPage(next, focus = true) {
    if (next >= 2 && !hasReflection()) {
      if (page !== 1) setPage(1, false);
      showEffortError(true);
      $('connection').focus();
      return;
    }
    if (next !== page) cancelGlow();
    page = next;
    pages.forEach((section, index) => {
      section.hidden = index !== page;
      section.classList.toggle('active', index === page);
    });
    progress.forEach((step, index) => {
      step.classList.toggle('current', page === index + 1);
      step.classList.toggle('done', page > index + 1);
      if (page === index + 1) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    document.body.className = 'page-theme-' + page;
    if (focus) $(pages[page].getAttribute('aria-labelledby')).focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function showCard(index) {
    cardIndex = (index + samples.length) % samples.length;
    const card = samples[cardIndex];
    const image = $('featureImage');
    image.src = artwork(card);
    image.alt = card.title + 'のカード見本';
    if (!reducedMotion.matches && image.animate) {
      image.getAnimations().forEach(animation => animation.cancel());
      image.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    }
    [...$('cardDots').children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === cardIndex)));
  }

  function setupCards() {
    samples.forEach((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', card.title);
      button.setAttribute('aria-current', String(index === cardIndex));
      button.addEventListener('click', () => showCard(index));
      $('cardDots').append(button);
    });
  }

  function updateDesign() {
    const card = samples[0];
    $('designImage').src = artwork(card);
    $('designImage').alt = card.title + 'のカード見本';
    $('secondaryDesignImage').src = artwork(samples[1]);
  }

  function updateCounts() {
    const count = getText().filter(([, value]) => value).length;
    [...$('littleStars').children].forEach((star, index) => star.classList.toggle('lit', index < count));
  }

  function buildPrompt() {
    const reflection = getText().map(([label, value]) => label + "： " + (value || "未記入")).join("\n");
    return `【画像生成】以下の振り返りから 星座×スイーツ×タロットカードの完成画像を1枚生成してください

【カードの仕様】
・縦長2:3 画像全体が1枚のカード 安全余白5%
・細いアンティークゴールドの二重枠 四隅は小さく丸める
・古金とアイボリーを共通にした 繊細な手描き水彩と水彩紙
・振り返りに合う星座を十二星座から1つ選ぶ。実際の誕生星座とは断定しない
・星座とスイーツを1つずつ選ぶ。スイーツの例はカヌレ いちごタルト マカロン モンブラン。スイーツ本体は横幅の約60〜65%を目安に手前に描く
・四隅に古金の植物装飾 区切り線に小さな菱形 最下部に月と小枝の飾りを添える。絵には場面に合う花や灯りを使う。文章の周りには十分な余白を残す
・上部には選んだ星座の記号をはっきり描き 日本語の星座名と小さな英語名を添える。選んだ星座の実際の星の配置と主な結び方に沿った星座線 月と星のきらめきで星座タロットらしさを表す
・紙の粒子と絵具のにじみが見える繊細な水彩で描く。スイーツの背景に夜空や月 小さなランタン 花などを調和させる
・添付見本があれば枠 水彩の質感 文章欄の配置を参考にする。スイーツや配色まで固定しない

・色と光と背景は振り返りに合わせて選ぶ。菫色の月夜 暖かなアプリコットの花園 群青の星空 深緑と琥珀の森などから変化をつける
・星座名 日本語と英語の表記 星座記号 星を結ぶ線の形を一致させる。星座記号の対応は 牡羊座♈ 牡牛座♉ 双子座♊ 蟹座♋ 獅子座♌ 乙女座♍ 天秤座♎ 蠍座♏ 射手座♐ 山羊座♑ 水瓶座♒ 魚座♓。飾りの星を適当につないだ架空の星座や 別の星座の形を描かない。完成前に4つの対応を見直す

【レイアウト】
・上端から全高40%までをタイトルも含めた一体の水彩画にする。星座記号 日本語の星座名と小さな英語名 短い日本語タイトルを背景に自然に添える
・全高40%から97%までが明るいアイボリーの文章欄。3段を同じ高さにして古金の細線で区切る
・各段の左36%に見出し 右64%に本文。各段の見出しと本文の開始位置を揃え 読みやすい文字と余白を確保する
・残る最下部3%に小さな金色の装飾

【固定見出し】
① あなたのタイプ
② 今年頑張ったこと
③ 来年のアクション

【文章ルール】
・①②の本文は25〜45字程度を2〜3行にまとめる。③は12月の一歩と翌年の目標が伝わる長さにして3〜4行に収める。句読点「、」「。」は使わない
・自然な日本語で本人にやさしく語りかける。大げさな比喩や不自然な言い切りを避け 書いた内容をただ並べず意味の通る文章に整える
・①は本人の取り組みから伝わる姿勢を自然な言葉で表す。星座から性格や未来を断定しない。「可能性を育む」「輪郭をつかむ」など意味が曖昧な比喩は避ける
・②は本人が書いた出来事に触れてやさしくねぎらう。書かれていない性格や実績は作らない。入力内容をただ羅列せず 自然な文章に整える
・③は「2026年12月の最初の一歩 → 2027年の目標」の順で書く。先に2026年12月に着手できる具体的な行動を1つ 次にその行動につながる2027年の目標を1つ提案する。所要時間は指定しない。受講生の振り返りに応じて制作 練習 受講内容の実践 講評 仲間との学び キャリア探索などから役立つ行動を考える
・固定見出しは一字一句そのまま 誤字や文字のはみ出しがないか確認する

【本人の振り返り】
${reflection}

記入された項目を使い 未記入の内容は作らず 完成カードを1枚生成してください。`;
  }

  function cancelGlow() {
    clearTimeout(promptTimer);
    promptTimer = undefined;
    $('promptFlash').hidden = true;
    $('buildPrompt').disabled = false;
    $('buildPrompt').removeAttribute('aria-busy');
  }

  function invalidatePrompt() {
    cancelGlow();
    promptBuilt = '';
    $('inlinePrompt').value = '';
    $('promptText').value = '';
    $('promptPanel').hidden = true;
    $('buildPrompt').hidden = false;
    $('buildPrompt').setAttribute('aria-expanded', 'false');
    $('openChatGPT').href = 'https://chatgpt.com/';
    $('modalChat').href = 'https://chatgpt.com/';
    $('copyStatus').textContent = '';
    $('modalCopyStatus').textContent = '';
  }

  function chatUrlFor(text) {
    const url = new URL('https://chatgpt.com/');
    url.searchParams.set('q', text);
    return url.href;
  }

  function revealPrompt() {
    if (promptTimer !== undefined) return;
    const finish = () => {
      cancelGlow();
      promptBuilt = buildPrompt();
      $('inlinePrompt').value = promptBuilt;
      $('promptText').value = promptBuilt;
      const chatUrl = chatUrlFor(promptBuilt);
      $('openChatGPT').href = chatUrl;
      $('modalChat').href = chatUrl;
      $('copyStatus').textContent = '';
      $('promptPanel').hidden = false;
      $('buildPrompt').setAttribute('aria-expanded', 'true');
      $('buildPrompt').hidden = true;
      $('promptTitle').focus();
      showToast('プロンプトを作成しました');
    };
    if (reducedMotion.matches) {
      finish();
      return;
    }
    $('buildPrompt').disabled = true;
    $('buildPrompt').setAttribute('aria-busy', 'true');
    $('promptFlash').hidden = false;
    promptTimer = setTimeout(finish, 840);
  }

  function showPromptModal() {
    if (!$('promptModal').open) $('promptModal').showModal();
  }

  function downloadPrompt() {
    const text = $('promptText').value;
    if (!text.trim()) return;
    const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '星の余韻_画像生成プロンプト.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function selectPrompt(field) {
    field.hidden = false;
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, field.value.length);
  }

  async function copyPrompt(field) {
    const text = field.value;
    if (!text.trim()) {
      showToast('先にプロンプトを作成してください');
      return false;
    }

    const wasHidden = field.hidden;
    const sourcePage = page;
    let apiCopy = Promise.resolve(false);
    if (navigator.clipboard?.writeText) {
      try {
        apiCopy = Promise.resolve(navigator.clipboard.writeText(text)).then(() => true, () => false);
      } catch {
        // Continue with the synchronous copy while the click is still active.
      }
    }

    // This fallback must run before the first await. Some browsers require
    // the original click gesture for copy, even if an API attempt is rejected.
    selectPrompt(field);
    let selectionCopied = false;
    const writePlainText = event => {
      if (event.clipboardData) {
        event.clipboardData.setData('text/plain', text);
        event.preventDefault();
      }
    };
    document.addEventListener('copy', writePlainText);
    try {
      selectionCopied = document.execCommand('copy');
    } catch {
      // The selected text stays available for manual copy.
    } finally {
      document.removeEventListener('copy', writePlainText);
    }

    const apiCopied = await apiCopy;
    const copied = apiCopied || selectionCopied;
    if (field.value !== text || sourcePage !== page) return false;
    const message = copied
      ? 'コピーしました。ChatGPTの入力欄で Ctrl+V / ⌘V、スマホは長押し→貼り付けをしてください。'
      : '自動コピーできませんでした。選択された文章を Ctrl+C / ⌘C、スマホは長押し→コピーしてください。';
    if (copied) field.hidden = wasHidden;
    else selectPrompt(field);
    $('copyStatus').textContent = message;
    $('modalCopyStatus').textContent = message;
    showToast(message);
    return copied;
  }

  function openChatWithPrompt(event, field) {
    if (!field.value.trim()) {
      event.preventDefault();
      showToast('先にプロンプトを作成してください');
      return;
    }
    // Use the normal link navigation in the original click. The prompt is
    // passed in q, independent of clipboard access and popup permissions.
    event.currentTarget.href = chatUrlFor(field.value);
  }

  function openClear(all) {
    clearEverything = all;
    $('clearTitle').textContent = all ? '最初からやり直しますか？' : '入力をクリアしますか？';
    $('clearDescription').textContent = all
      ? '振り返りとプロンプトが消去されます。'
      : '振り返りの4項目とプロンプトが消去されます。';
    $('clearModal').returnValue = '';
    $('clearModal').showModal();
  }

  function clearDraft() {
    for (const [id] of fields) $(id).value = '';
    showEffortError(false);
    invalidatePrompt();
    if (clearEverything) {
      updateDesign();
      showCard(0);
      setPage(0);
    }
    updateCounts();
    clearSavedDraft();
    if (!clearEverything) $('connection').focus();
    showToast(clearEverything ? '最初の状態に戻しました' : '入力内容をクリアしました');
  }

  function reflectionChanged() {
    if (hasReflection()) showEffortError(false);
    invalidatePrompt();
    updateCounts();
  }

  function bind() {
    $('goHome').addEventListener('click', () => setPage(0));
    $('start').addEventListener('click', () => setPage(1));
    $('goMake').addEventListener('click', () => setPage(2));
    document.querySelectorAll('[data-goto]').forEach(button => {
      button.addEventListener('click', () => setPage(Number(button.dataset.goto)));
    });

    for (const [id] of fields) $(id).addEventListener('input', reflectionChanged);
    $('clearReflection').addEventListener('click', () => openClear(false));
    $('clearAll').addEventListener('click', () => openClear(true));
    $('clearModal').addEventListener('close', () => {
      if ($('clearModal').returnValue === 'confirm') clearDraft();
    });

    $('prevCard').addEventListener('click', () => showCard(cardIndex - 1));
    $('nextCard').addEventListener('click', () => showCard(cardIndex + 1));

    $('buildPrompt').addEventListener('click', revealPrompt);
    $('openChatGPT').addEventListener('click', event => openChatWithPrompt(event, $('inlinePrompt')));
    $('modalChat').addEventListener('click', event => openChatWithPrompt(event, $('promptText')));
    $('viewPrompt').addEventListener('click', showPromptModal);
    $('modalCopy').addEventListener('click', () => copyPrompt($('promptText')));
    $('modalSelect').addEventListener('click', () => {
      selectPrompt($('promptText'));
      $('modalCopyStatus').textContent = '全文を選択しました。Ctrl+C / ⌘C、スマホは長押し→コピーしてください。';
    });
    $('downloadPrompt').addEventListener('click', downloadPrompt);
    $('openPrivacy').addEventListener('click', () => $('privacyModal').showModal());
    document.querySelectorAll('[data-close-dialog]').forEach(button => {
      button.addEventListener('click', () => {
        const dialog = $(button.dataset.closeDialog);
        if (dialog?.open) dialog.close('cancel');
      });
    });

  }

  setupCards();
  for (const [id] of fields) $(id).value = '';
  bind();
  updateDesign();
  updateCounts();
  setPage(0, false);
})();
