(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const storageKey = 'hoshi-no-yoin-requested-v11';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [
    { key: 'canele', title: '月のカヌレ', sweet: 'カヌレ', scene: '月明かりが差す菫色の書斎と古い本' },
    { key: 'strawberry', title: '太陽のいちごタルト', sweet: 'いちごタルト', scene: '金色の灯りがともる夜の花園と薄紫の雲' },
    { key: 'macaron', title: '星風のマカロン', sweet: 'マカロン', scene: '星が広がるラベンダー色の雲とティーセット' },
    { key: 'montblanc', title: '森のモンブラン', sweet: 'モンブラン', scene: '深い青緑の森と琥珀色のランタン' },
    { key: 'gateau', title: '真夜中のガトーショコラ', sweet: 'ガトーショコラ', scene: '真夜中の温室と紫の木の葉' },
    { key: 'pudding', title: '湖畔のカラメルプリン', sweet: 'カラメルプリン', scene: '三日月を映す湖と藤の咲く茶室' }
  ];
  const pages = [...document.querySelectorAll('[data-page]')];
  const progress = [...document.querySelectorAll('[data-progress]')];
  const samples = [
    { key: 'parfait', title: 'ひとりでは見えなかった色' },
    { key: 'montblanc', title: '森を渡る小さな音' },
    { key: 'pudding', title: '湖の向こうの道' }
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

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(
        Object.fromEntries(fields.map(([id]) => [id, $(id).value]))
      ));
    } catch {
      // Input remains available for this session.
    }
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
      for (const [id] of fields) {
        const value = saved[id] ?? (id === 'challenge' ? saved.effort : '');
        if (typeof value === 'string') $(id).value = value;
      }
    } catch {
      // Ignore an unreadable draft.
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
    $('galleryCaption').textContent = card.title + ' · 作品見本';
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
・本人の言葉に合う星座モチーフを1つ選ぶ
・星座とスイーツを1つずつ選ぶ。候補はパフェ カヌレ タルト マカロン プリン モンブランなど。スイーツ本体は横幅の約60〜65%を目安に手前に描く
・四隅に古金の植物装飾 区切り線に小さな菱形 最下部に月と小枝の飾りを添える。絵には場面に合う花や灯りを使う。文章の周りには十分な余白を残す
・添付見本があれば構図と画風の参考にする

・色と光と背景は振り返りに合わせて選ぶ。菫色の月夜 暖かなアプリコットの花園 群青の星空 深緑と琥珀の森などから変化をつける
・星座記号の隣に日本語の星座名を書く

【レイアウト】
・上端から全高40%までがタイトルと絵。最上部8%に星座記号 短い日本語タイトル 控えめな英語副題。続く32%にスイーツと選んだ背景の水彩画
・全高40%から97%までが明るいアイボリーの文章欄。3段を同じ高さにして古金の細線で区切る
・各段の左36%に見出し 右64%に本文。各段の見出しと本文の開始位置を揃え 読みやすい文字と余白を確保する
・残る最下部3%に小さな金色の装飾

【固定見出し】
① あなたのタイプ
② 今年頑張ったこと
③ 来年のアクション

【文章ルール】
・各本文は25〜42字程度を2〜3行にまとめる。句読点「、」「。」は使わない
・①は振り返りからうかがえる魅力をやさしく表す。星座から性格や未来を断定しない
・②は本人が書いた努力や学びを具体的にねぎらう。書かれていない性格や実績は作らない
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
  }

  function revealPrompt() {
    if (promptTimer !== undefined) return;
    const finish = () => {
      cancelGlow();
      promptBuilt = buildPrompt();
      $('inlinePrompt').value = promptBuilt;
      $('promptText').value = promptBuilt;
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

  async function copyFrom(field) {
    const text = field.value.trim();
    if (!text) return false;
    const active = document.activeElement;
    const currentPage = page;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      if (currentPage !== page) return false;
      field.hidden = false;
      field.focus({ preventScroll: true });
      field.select();
      try {
        if (document.execCommand('copy')) {
          active?.focus({ preventScroll: true });
          return true;
        }
      } catch {
        // The selected text remains available for manual copy.
      }
      return false;
    }
  }

  async function copyPrompt(field, opensChat) {
    if (await copyFrom(field)) {
      showToast('プロンプトをコピーしました');
      return;
    }
    if (opensChat) showToast('コピーできませんでした。戻って文章を選択してコピーできます');
    else showToast('選択した文章を長押ししてコピーしてください');
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
    save();
    if (!clearEverything) $('connection').focus();
    showToast(clearEverything ? '最初の状態に戻しました' : '入力内容をクリアしました');
  }

  function reflectionChanged() {
    if (hasReflection()) showEffortError(false);
    invalidatePrompt();
    updateCounts();
    save();
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
    $('copyPrompt').addEventListener('click', () => copyPrompt($('inlinePrompt')));
    $('viewPrompt').addEventListener('click', showPromptModal);
    $('modalCopy').addEventListener('click', () => copyPrompt($('promptText')));
    $('closePrompt').addEventListener('click', () => $('promptModal').close());
    $('openPrivacy').addEventListener('click', () => $('privacyModal').showModal());
    $('closePrivacy').addEventListener('click', () => $('privacyModal').close());

  }

  setupCards();
  restore();
  bind();
  updateDesign();
  updateCounts();
  setPage(0, false);
})();
