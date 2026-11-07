(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const STORAGE_KEY='star-reflection-2026-v5';
 const examples=[
  {file:'sample_1.webp',name:'月のカヌレ'},
  {file:'sample_2.webp',name:'太陽のいちごタルト'},
  {file:'sample_3.webp',name:'星風のマカロン'},
  {file:'sample_4.webp',name:'森のモンブラン'}
 ];
 const ids=['reflection','connection'];
 let screen=0,carouselIndex=2,timer=null,arrivalTimer=null,toastTimer=null,imageObjectUrl=null,postTouched=false;
 const image=i=>'assets/'+examples[(i+4)%4].file;
 const getData=()=>({reflection:$('reflection').value.trim(),connection:$('connection').value.trim()});
 const short=(s,n)=>{s=(s||'').replace(/\s+/g,' ').trim();return [...s].length>n?[...s].slice(0,n-1).join('')+'…':s};
 const checksum=s=>[...s].reduce((a,c)=>((a*31+c.codePointAt(0))>>>0),7);
 function toast(t){let e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),3300)}
 function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({...getData(),post:$('postText').value,postTouched}));}catch(e){}}
 function restore(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!v)return;for(const id of ids)if(typeof v[id]==='string')$(id).value=v[id];if(typeof v.post==='string')$('postText').value=v.post;postTouched=!!v.postTouched;}catch(e){}}
 function stopCarousel(){if(timer){clearInterval(timer);timer=null}}
 function paintCarousel(){const img=$('heroCardImage');if(!img)return;img.src=image(carouselIndex);img.alt=examples[carouselIndex].name+'のタロットカード見本';$('stackLeft').src=image(carouselIndex+3);$('stackRight').src=image(carouselIndex+1);const card=$('heroCard');card.classList.remove('is-arriving','is-resting');void card.offsetWidth;card.classList.add('is-arriving');clearTimeout(arrivalTimer);arrivalTimer=setTimeout(()=>{card.classList.remove('is-arriving');card.classList.add('is-resting')},1150);$('heroDots').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',String(i===carouselIndex)))}
 function startCarousel(){stopCarousel();if(document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches || screen!==0)return;timer=setInterval(()=>{carouselIndex=(carouselIndex+1)%4;paintCarousel()},4700)}
 function changeCarousel(delta){carouselIndex=(carouselIndex+delta+4)%4;paintCarousel();startCarousel()}
 function initCarousel(){const dots=$('heroDots');examples.forEach((ex,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',ex.name+'を見る');b.setAttribute('aria-current',String(i===carouselIndex));b.addEventListener('click',()=>{carouselIndex=i;paintCarousel();startCarousel()});dots.append(b)});$('prevCard').addEventListener('click',()=>changeCarousel(-1));$('nextCard').addEventListener('click',()=>changeCarousel(1));$('heroStage').addEventListener('mouseenter',stopCarousel);$('heroStage').addEventListener('mouseleave',startCarousel);$('heroStage').addEventListener('focusin',stopCarousel);$('heroStage').addEventListener('focusout',e=>{if(!e.currentTarget.contains(e.relatedTarget))startCarousel()});document.addEventListener('visibilitychange',()=>document.hidden?stopCarousel():startCarousel());paintCarousel()}
 function showPreview(){const d=getData();const i=d.reflection?checksum(d.reflection+'|'+d.connection)%4:carouselIndex;const e=examples[i];$('selectedCard').src=image(i);$('selectedCard').alt=e.name+'のデザイン見本';$('selectedLabel').textContent='振り返りから生まれる、一枚の物語';if(!imageObjectUrl){$('sharedCardImage').src=image(i);$('sharedCardImage').alt=e.name+'のデザイン見本';}}
 function showScreen(value){const n=Number(value);if(n===3&&!getData().reflection){toast('今年取り組んだことを、ひとつご入力ください。');screen=1;$('reflection').focus()}else{screen=[0,1,3,4].includes(n)?n:0}
   if(screen===4&&!postTouched)createPost(false);
   document.querySelectorAll('[data-screen]').forEach(s=>{const active=Number(s.dataset.screen)===screen;s.hidden=!active;s.classList.toggle('is-current',active)});
   if(screen===3||screen===4)showPreview();
   if(screen===0)startCarousel();else stopCarousel();
   if(screen===4)updatePostCount();
   window.scrollTo({top:0,behavior:'instant'});
 }
 function hasText(){return !!getData().reflection}
 function buildPrompt(){const d=getData();
  return `【画像生成の依頼】\n2026年1〜11月の本人の振り返りから、世界にひとつの「星座×スイーツ×タロット」カード画像を【必ず1枚だけ】生成してください。まずカードの内容と美術コンセプトを内部で決め、そのまま画像生成を実行してください。説明・文章だけの回答・複数案・カードの並列・コラージュは禁止です。\n\n【想定読者とコンセプト】\n20〜30代の働く女性。SHElikesなどの学びやコミュニティ、キャリアの模索、仕事とプライベートの両立を身近に感じる人が「これ欲しい！」と思う上品な大人可愛いデザイン。ただし本人がSHElikesに所属している、転職活動している等、入力にない属性や成果を決めつけない。励ましは具体的・自然で、上から目線や大げさな褒め言葉を避ける。テーマは「今年の自分におつかれさまを。来年の小さな一歩を見つける夜」。\n\n【最重要：AIが自動で決める内容】\n・ユーザーにカード柄や星座、色、スイーツの選択は求めない。振り返りのキーワードや感情に合うものをあなたが選ぶ。\n・星座モチーフは12星座からひとつ、または星座風のオリジナル構図を選ぶ。本人の誕生星座は推定しない。星を結ぶ主星は3・5・7・9個など変化を持たせ、視覚的に異なる構図にする。\n・スイーツはカヌレ、マカロン、いちごタルト、モンブラン、ティラミス、月餅などから意味と色の相性で1種類を選ぶ。月夜ラベンダー、澄んだ青、柔らかなピーチ、深い森などのカラーパレットも内容に合わせて選ぶ。単一の色や菓子に固定しない。\n・【2027年の新しい挑戦】を振り返りから具体的にひとつ提案。本人の興味・頑張り・人とのつながりの延長で無理なく一歩広げる提案にする。学びの実践（小さな作品を公開）、仲間との協働、好きなテーマの発信、新しい役割や勉強への挑戦などから適切に選ぶが、入力にない願望を創作しない。2026年12月にできる15〜30分程度の最初のアクションも示す。\n\n【必須のカード仕様】\n・画像全体が1枚のカード。縦長2:3（1080×1620相当）。一般的な細身タロットらしい余白と上品な角丸。机・手・写真背景・別のカードは描かない。\n・細いアンティークゴールド二重枠。安全余白を上下左右5%以上確保。\n・上15%：星座のシンボル、日本語の短い詩的なカードタイトル（12文字以内）、短い英語副題。\n・中央47%：選んだスイーツ1種類を主役にした、美しい水彩・絵本タッチのイラスト。星座の結び線、静かな夜景、花、月明かりを控えめに重ねる。\n・下35%：アイボリー地の読みやすい日本語メッセージ3段。各段は左に小さな金色アイコン、右に固定見出し＋短い本文。\n・最下部3%：繊細な金色の小さな飾り。\n\n【固定見出しと文章】\n①「あなたはこんなタイプ」：本人の文章に基づく長所を25〜35字で。\n②「今年こんなことを頑張ってきたね」：具体的な行動を引用しつつ、頑張りを25〜40字で。\n③「これからのあなたへの小さなお告げ」：2027年のチャレンジと2026年12月の最初の一歩を40〜55字で。\n文字は読みやすく、各段2〜3行程度。長いときは短く整え、枠からはみ出さない。誤字、文字化け、重複を避ける。\n\n【本人の入力】\n今年頑張ったこと・できたこと：${d.reflection}\n楽しかったこと・人とのつながり（未入力なら断定しない）：${d.connection||'未入力'}\n\n【最終指示】説明は不要。本人の入力を尊重し、2027年の挑戦まで含む、大人可愛い静かな星とスイーツのタロットカード画像【1枚のみ】を直接出力してください。`;
 }
 function promptDialog(t){$('promptText').value=t;if(!$('promptDialog').open)$('promptDialog').showModal()}
 function goChatGPT(){if(!hasText()){showScreen(1);toast('今年取り組んだことをご入力ください。');return}const prompt=buildPrompt();const url='https://chatgpt.com/?q='+encodeURIComponent(prompt);if(url.length>7800){promptDialog(prompt);toast('プロンプトが長いため、コピーしてChatGPTへ貼り付けてください。');return}window.open(url,'_blank','noopener,noreferrer');showScreen(4);toast('ChatGPTを開きました。生成された画像を保存してください。')}
 function createPost(markTouched=true){const d=getData();$('postText').value=`この一年のわたしへ、ありがとう ✧\n\n${short(d.reflection,70)||'小さな頑張りを積み重ねた一年'}\n\n2027年は、見つけた小さな一歩を大切に育てていきたいです ☾\n\n#夜活コミュニティ #SHElikes`;postTouched=markTouched;updatePostCount();save()}
 function updatePostCount(){const n=[...$('postText').value].length;$('postCount').textContent=`${n} / 280`;$('postCount').style.color=n>270?'#b33d58':'#817e8b'}
 async function copy(t){try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(t);else{const a=document.createElement('textarea');a.value=t;a.style='position:fixed;left:-10000px';document.body.append(a);a.select();const ok=document.execCommand('copy');a.remove();if(!ok)throw Error('copy failed')}return true}catch(e){promptDialog(t);return false}}
 function downloadMemo(){const d=getData(),body=`星の余韻｜2026年\n\n【頑張ったこと・できたこと】\n${d.reflection}\n\n【楽しかったこと・つながり】\n${d.connection}\n\n【2027年の挑戦】\nChatGPTで生成したカードに記載されています。\n`;const a=document.createElement('a');const url=URL.createObjectURL(new Blob(['\ufeff'+body],{type:'text/plain;charset=utf-8'}));a.href=url;a.download='星の余韻_2026.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1100);toast('振り返りメモを保存しました。')}
 function clearAll(){if(!confirm('入力した内容を消去しますか？'))return;ids.forEach(id=>$(id).value='');$('postText').value='';postTouched=false;if(imageObjectUrl){URL.revokeObjectURL(imageObjectUrl);imageObjectUrl=null;}try{localStorage.removeItem(STORAGE_KEY)}catch(e){}showScreen(0);toast('入力を消去しました。')}
 function chooseImage(e){const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')||file.size>15*1024*1024){toast('15MB以下の画像を選んでください。');return}if(imageObjectUrl)URL.revokeObjectURL(imageObjectUrl);imageObjectUrl=URL.createObjectURL(file);$('sharedCardImage').src=imageObjectUrl;$('sharedCardImage').alt='ChatGPTで生成したカード画像';toast('完成画像を表示しました。X投稿時には画像を添付してください。')}
 function bind(){
  $('homeButton').addEventListener('click',()=>showScreen(0));$('startButton').addEventListener('click',()=>showScreen(1));$('resetButton').addEventListener('click',clearAll);
  document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.next)));
  document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.back)));
  for(const id of ids)$(id).addEventListener('input',()=>{save();showPreview()});
  document.querySelectorAll('.suggestions button').forEach(b=>b.addEventListener('click',()=>{const t=$(b.dataset.for),v=b.dataset.text;if(t.value.includes(v))return toast('すでに入力されています。');const s=t.value?t.value.trim()+'／'+v:v;if(s.length>t.maxLength)return toast('文字数の上限です。');t.value=s;save();showPreview();t.focus()}));
  $('createButton').addEventListener('click',goChatGPT);
  $('copyPromptButton').addEventListener('click',async()=>{if(!hasText()){showScreen(1);toast('今年の頑張りを入力してください。');return}if(await copy(buildPrompt()))toast('生成プロンプトをコピーしました。')});
  $('postText').addEventListener('input',()=>{postTouched=true;updatePostCount();save()});
  $('regeneratePost').addEventListener('click',()=>createPost());
  $('copyPostButton').addEventListener('click',async()=>{if(await copy($('postText').value))toast('投稿文をコピーしました。')});
  $('openXButton').addEventListener('click',()=>{const t=$('postText').value.trim();if(!t)return toast('投稿文を入力してください。');window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(t),'_blank','noopener,noreferrer')});
  $('cardUpload').addEventListener('change',chooseImage);$('saveMemoButton').addEventListener('click',downloadMemo);
  $('dialogClose').addEventListener('click',()=>$('promptDialog').close());$('promptDialog').addEventListener('click',e=>{if(e.target===$('promptDialog'))$('promptDialog').close()});
  $('dialogCopy').addEventListener('click',async()=>{if(await copy($('promptText').value)){$('promptDialog').close();toast('コピーしました。')}});
  $('dialogOpen').addEventListener('click',()=>{window.open('https://chatgpt.com/','_blank','noopener,noreferrer');$('promptDialog').close();showScreen(4)});
 }
 restore();bind();initCarousel();showPreview();showScreen(0);updatePostCount();
})();
