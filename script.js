/* ---------------- decor generator ---------------- */
function buildDecor(el, dark){
  const emojis = dark ? ['🌸','💖','🌷','💐','🌺','💕'] : ['🌷','🌸','💐','🌼','💖','🌹'];
  const spots = [];
  // top & bottom bars
  for(let x=4; x<=96; x+=12){
    spots.push({x, y:2});
    spots.push({x, y:96});
  }
  // left & right columns
  for(let y=10; y<=90; y+=14){
    spots.push({x:1.5, y});
    spots.push({x:96.5, y});
  }
  spots.forEach((s,i)=>{
    const span = document.createElement('span');
    span.textContent = emojis[i % emojis.length];
    span.style.left = s.x + '%';
    span.style.top = s.y + '%';
    span.style.fontSize = (16 + (i%3)*6) + 'px';
    el.appendChild(span);
  });
}
buildDecor(document.getElementById('decor-game'), true);
buildDecor(document.getElementById('decor-quiz'), false);
buildDecor(document.getElementById('decor-success'), false);

/* ---------------- screen switching ---------------- */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ---------------- evading green heart ---------------- */
const heartEl = document.getElementById('heart');
let pointer = {x:-9999, y:-9999};
let heart = {x: window.innerWidth/2, y: window.innerHeight/2};

let gameStarted = false;
const TIRED_INTERVAL = 6000; // ms between "are you tired" check-ins
let tiredTimerId = null;

function scheduleTiredPopup(){
  clearTimeout(tiredTimerId);
  tiredTimerId = setTimeout(()=>{
    // only interrupt if still on the game screen
    if(document.getElementById('game').classList.contains('active')){
      document.getElementById('tired-overlay').classList.add('show');
    }
  }, TIRED_INTERVAL);
}

function startTimers(){
  if(gameStarted) return;
  gameStarted = true;
  setTimeout(()=> document.getElementById('encourage').classList.add('show'), 4000);
  scheduleTiredPopup();
}

function setPointer(x,y){ pointer.x = x; pointer.y = y; startTimers(); }
window.addEventListener('mousemove', e => setPointer(e.clientX, e.clientY));
window.addEventListener('touchmove', e => { if(e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});
window.addEventListener('touchstart', e => { if(e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});

/* ---------------- pink heart-snake trail following the cursor/finger everywhere ---------------- */
const snakeCanvas = document.getElementById('snakeCanvas');
const sctx = snakeCanvas.getContext('2d');
let SW, SH, SDPR;
function resizeSnake(){
  SDPR = Math.min(window.devicePixelRatio || 1, 2);
  SW = window.innerWidth; SH = window.innerHeight;
  snakeCanvas.width = SW * SDPR; snakeCanvas.height = SH * SDPR;
  sctx.setTransform(SDPR,0,0,SDPR,0,0);
}
window.addEventListener('resize', resizeSnake);
resizeSnake();

const SNAKE_COUNT = 12;
const snakeSegs = [];
for(let i=0;i<SNAKE_COUNT;i++) snakeSegs.push({x:-9999,y:-9999});
let snakeEnabled = true;

function heartPath(ctx,x,y,size){
  ctx.beginPath();
  const top = size*0.3;
  ctx.moveTo(x,y+top);
  ctx.bezierCurveTo(x,y,x-size/2,y,x-size/2,y+top);
  ctx.bezierCurveTo(x-size/2,y+(size+top)/1.5,x,y+(size+top)/1.2,x,y+size);
  ctx.bezierCurveTo(x,y+(size+top)/1.2,x+size/2,y+(size+top)/1.5,x+size/2,y+top);
  ctx.bezierCurveTo(x+size/2,y,x,y,x,y+top);
  ctx.closePath();
}

let sT = 0;
function snakeLoop(){
  sT += 0.05;
  if(!snakeEnabled){
    sctx.clearRect(0,0,SW,SH);
    requestAnimationFrame(snakeLoop);
    return;
  }
  if(pointer.x > -1000){
    snakeSegs[0].x += (pointer.x - snakeSegs[0].x) * 0.32;
    snakeSegs[0].y += (pointer.y - snakeSegs[0].y) * 0.32;
    const GAP = 16;
    for(let i=1;i<snakeSegs.length;i++){
      const dx = snakeSegs[i-1].x - snakeSegs[i].x;
      const dy = snakeSegs[i-1].y - snakeSegs[i].y;
      const dist = Math.hypot(dx,dy) || 1;
      if(dist > GAP){
        const pull = (dist-GAP)/dist*0.85;
        snakeSegs[i].x += dx*pull;
        snakeSegs[i].y += dy*pull;
      }
    }
  }
  sctx.clearRect(0,0,SW,SH);
  for(let i=snakeSegs.length-1;i>=0;i--){
    const s = snakeSegs[i];
    if(s.x < -500) continue;
    const ratio = 1 - i/snakeSegs.length;
    const size = 8 + ratio*16;
    sctx.save();
    sctx.globalAlpha = 0.35 + ratio*0.65;
    sctx.shadowColor = 'rgba(255,77,125,.85)';
    sctx.shadowBlur = 10 + ratio*10;
    sctx.fillStyle = i===0 ? '#fff0f5' : '#ff6f94';
    heartPath(sctx, s.x, s.y - size/2, size);
    sctx.fill();
    sctx.restore();
  }
  requestAnimationFrame(snakeLoop);
}
snakeLoop();

const SAFE = 130;
const PAD = 50;

function gameLoop(){
  const dx = heart.x - pointer.x, dy = heart.y - pointer.y;
  const dist = Math.hypot(dx,dy);
  if(dist < SAFE){
    const angle = Math.atan2(dy,dx) + (Math.random()-0.5)*0.7;
    const runDist = SAFE + 90 + Math.random()*80;
    const tx = pointer.x + Math.cos(angle)*runDist;
    const ty = pointer.y + Math.sin(angle)*runDist;
    heart.x += (tx - heart.x) * 0.4;
    heart.y += (ty - heart.y) * 0.4;
  } else {
    heart.x += Math.sin(Date.now()/850) * 0.35;
    heart.y += Math.cos(Date.now()/650) * 0.35;
  }
  heart.x = Math.min(Math.max(heart.x, PAD), window.innerWidth - PAD);
  heart.y = Math.min(Math.max(heart.y, PAD + 40), window.innerHeight - PAD);
  heartEl.style.transform = `translate(${heart.x}px, ${heart.y}px) translate(-50%,-50%)`;
  requestAnimationFrame(gameLoop);
}
gameLoop();

/* ---------------- tired popup buttons ---------------- */
document.getElementById('tired-no').addEventListener('click', ()=>{
  document.getElementById('tired-overlay').classList.remove('show');
  scheduleTiredPopup(); // ask again after another 6s, instead of never again
});
document.getElementById('tired-yes').addEventListener('click', ()=>{
  document.getElementById('tired-overlay').classList.remove('show');
  clearTimeout(tiredTimerId);
  showScreen('quiz');
});

/* ---------------- quiz logic ---------------- */
let quizAttempts = 0;
const quizInput = document.getElementById('quiz-input');
const feedback = document.getElementById('feedback');
const retryBtn = document.getElementById('quiz-retry');
const submitBtn = document.getElementById('quiz-submit');

function checkAnswer(){
  const nums = (quizInput.value.match(/\d+/g) || []).map(Number);
  const correct = nums.length === 3 && nums[0] === 24 && nums[1] === 11 && nums[2] === 22;
  if(correct){
    showScreen('success');
    setTimeout(()=> document.getElementById('gift-btn').classList.add('show'), 5000);
    return;
  }
  quizAttempts++;
  if(quizAttempts === 1){
    feedback.textContent = "Uff, I can't believe it 😅 Try again, my love.";
  } else {
    feedback.textContent = "Hmm... maybe ask AI using your date of birth and my question 🤖💭 Then try again.";
  }
  submitBtn.style.display = 'none';
  retryBtn.style.display = 'inline-block';
}

submitBtn.addEventListener('click', checkAnswer);
quizInput.addEventListener('keydown', e => { if(e.key === 'Enter') checkAnswer(); });
retryBtn.addEventListener('click', ()=>{
  quizInput.value = '';
  feedback.textContent = '';
  retryBtn.style.display = 'none';
  submitBtn.style.display = 'inline-block';
  quizInput.focus();
});

/* ---------------- gift reveal -> birthday screen ---------------- */
let rainTimerId = null;
function startRain(){
  const emojis = ['🌸','🌷','💐','🌺','🌻','💖','💕','❤️','🌹'];
  const layer = document.getElementById('rain-layer');
  rainTimerId = setInterval(()=>{
    const d = document.createElement('div');
    d.className = 'drop';
    d.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    d.style.left = Math.random()*100 + 'vw';
    d.style.fontSize = (16 + Math.random()*18) + 'px';
    const dur = 4 + Math.random()*3;
    d.style.animationDuration = dur + 's';
    layer.appendChild(d);
    setTimeout(()=> d.remove(), dur*1000 + 200);
  }, 220);
}

document.getElementById('gift-btn').addEventListener('click', ()=>{
  showScreen('birthday');
  startRain();
  // hide the snake trail once the whole reveal sequence (words -> book -> cards) has finished
  setTimeout(()=>{
    snakeEnabled = false;
    document.body.classList.add('show-cursor');
  }, 5300);
});

/* ============================================================
   PHOTO BOOK — 47 photo slots, generated automatically
   ============================================================
   To add your own pictures: put 47 image URLs (or relative file
   paths, e.g. "photos/1.jpg") into the array below, in order.
   Leave an entry as '' (empty string) to keep the placeholder
   "photo coming soon" box for that slot until you're ready.
   ------------------------------------------------------------ */
const TOTAL_PHOTOS = 47;
const photoUrls = [
  'kb2.jpg', 'kb3 (2).jpg', 'kb3.jpg', 'kb4.jpeg', 'kb5.jpeg',
  '20230914_170213.jpg', '20231025_111827.jpg', '20240502_100411.jpg', '20250310_172729.jpg', '20250425_155540.jpg',   // 1–10

  '1640100123258.jpg', '1640155354100.jpg', '1640155398196.jpg', '1641051052236.jpg', '1641107074704.jpg',
  'kb6.jpeg', '1669489518368.jpg', '1673097521371.jpg', '1675591159379.jpg', 'IMG_20211222_005613.jpg',   // 11–20

  'IMG_20220101_232921.jpg', 'IMG_20220314_175028.jpg', 'IMG_20220324_141419.jpg', 'IMG_20220801_194434.jpg', 'IMG_20220812_095147.jpg',
  'IMG_20230118_161911.jpg', 'IMG_20230214_152127.jpg', 'IMG_20230801_140704_184.jpg', 'IMG_20241023_182125.jpg', 'IMG_20241103_165648.jpg',   // 21–30

  'IMG_20241103_200641_832.jpg', 'IMG_20241229_175339_379.jpg', 'IMG_20241229_175347_099.jpg', 'PicsArt_04-14-01.08.31.jpg', 'PicsArt_12-28-11.15.46.jpg',
  'received_273962694572866.jpeg', 'received_322631409611939.jpeg', 'received_337678684482472.jpeg', 'received_4742035882523556.jpeg', 'received_6172843989424078.jpeg',   // 31–40

  'Snapchat-185656842.jpg', 'Snapchat-567925013.jpg', 'Snapchat-1475353768.jpg', 'Snapchat-1710478999.jpg', 'Snapchat-2124525828.jpg',
  'ttn-image-2024-02-17-213253196.png', 'ttn-image-2024-02-17-214832866.png'   // 41–47
];
function makeFace(data, side){
  const face = document.createElement('div');
  face.className = 'face ' + side;
  if(!data){ face.classList.add('blank'); return face; }
  if(data.type === 'cover'){
    face.classList.add('cover');
    face.innerHTML = '💌 Our Storybook 💌<br><span style="font-size:13px;font-weight:400;">Flip the page to view, bae</span>';
  } else if(data.type === 'closing'){
    face.classList.add('closing');
    face.textContent = 'To be continued... 💕';
  } else {
    const url = photoUrls[data.index];
    if(url){
      face.classList.add('photo-face');
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Photo ' + (data.index + 1);
      face.appendChild(img);
    } else {
      face.classList.add('photo-slot');
      face.innerHTML = '📷<br>Photo ' + (data.index + 1);
    }
  }
  return face;
}

function buildBook(){
  const bookEl = document.getElementById('book');
  const faces = [{type:'cover'}];
  for(let i = 0; i < TOTAL_PHOTOS; i++) faces.push({type:'photo', index:i});
  faces.push({type:'closing'});

  const sheetCount = Math.ceil(faces.length / 2);
  for(let s = 0; s < sheetCount; s++){
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.id = 'sheet' + s;
    sheet.appendChild(makeFace(faces[s*2], 'front'));
    sheet.appendChild(makeFace(faces[s*2 + 1], 'back'));
    bookEl.appendChild(sheet);
  }
}
buildBook();

/* ---------------- flip book ---------------- */
try {
  var sheets = [...document.querySelectorAll('#book .sheet')];
  sheets.forEach((s,i)=> s.style.zIndex = sheets.length - i);
  var bookPage = 0;
  var backZ = 0;
  var frontZ = sheets.length + 1;

  function flipNext(){
    if(bookPage >= sheets.length) return;
    sheets[bookPage].classList.add('flipped');
    sheets[bookPage].style.zIndex = --backZ;
    bookPage++;
  }
  function flipPrev(){
    if(bookPage <= 0) return;
    bookPage--;
    sheets[bookPage].style.zIndex = frontZ++;
    sheets[bookPage].classList.remove('flipped');
  }
  document.getElementById('next-page').addEventListener('click', e => { e.stopPropagation(); flipNext(); });
  document.getElementById('prev-page').addEventListener('click', e => { e.stopPropagation(); flipPrev(); });
} catch(err){ console.error('Flip-book setup failed:', err); }

/* ---------------- swipe-to-flip: touch + mouse combined for reliability ---------------- */
try {
  var bookEl = document.getElementById('book');
  var dragStartX = 0, dragStartY = 0, isDragging = false, justSwiped = false;

  var dragStart = function(x,y){ dragStartX = x; dragStartY = y; isDragging = true; };
  var dragEnd = function(x,y){
    if(!isDragging) return;
    isDragging = false;
    const dx = x - dragStartX, dy = y - dragStartY;
    if(Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)){
      justSwiped = true; // stop the follow-up click from also flipping
      if(dx < 0) flipNext(); else flipPrev();
    }
  };
  bookEl.addEventListener('mousedown', e => dragStart(e.clientX, e.clientY));
  bookEl.addEventListener('mouseup', e => dragEnd(e.clientX, e.clientY));
  bookEl.addEventListener('touchstart', e => { const t = e.touches[0]; dragStart(t.clientX, t.clientY); }, {passive:true});
  bookEl.addEventListener('touchend', e => { const t = e.changedTouches[0]; dragEnd(t.clientX, t.clientY); });
  bookEl.addEventListener('click', () => {
    if(justSwiped){ justSwiped = false; return; }
    flipNext();
  });
} catch(err){ console.error('Swipe-to-flip setup failed:', err); }

/* ---------------- book preview: pops open into the big flip-book ---------------- */
try {
  var bookPreview = document.getElementById('book-preview');
  var bookOverlay = document.getElementById('book-overlay');
  var bookModal = document.getElementById('book-modal');
  var bookCloseBtn = document.getElementById('book-close');

  if(!bookPreview || !bookOverlay || !bookModal || !bookCloseBtn){
    console.error('Book preview elements missing — check that index.html has #book-preview, #book-overlay, #book-modal, #book-close.');
  } else {
    var popOpen = function(originEl, overlayEl, modalEl){
      const rect = originEl.getBoundingClientRect();
      const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
      const vw = window.innerWidth/2, vh = window.innerHeight/2;
      overlayEl.classList.add('show');
      modalEl.style.transition = 'none';
      modalEl.style.transform = `translate(${cx-vw}px, ${cy-vh}px) scale(.2)`;
      modalEl.style.opacity = '0';
      requestAnimationFrame(()=>{
        modalEl.style.transition = 'transform .6s cubic-bezier(.34,1.15,.4,1), opacity .4s ease';
        modalEl.style.transform = 'translate(0,0) scale(1)';
        modalEl.style.opacity = '1';
      });
    };
    var popClose = function(modalEl, overlayEl){
      modalEl.style.transition = 'transform .4s ease, opacity .3s ease';
      modalEl.style.transform = 'translate(0,0) scale(.2)';
      modalEl.style.opacity = '0';
      setTimeout(()=> overlayEl.classList.remove('show'), 380);
    };

    bookPreview.addEventListener('click', () => popOpen(bookPreview, bookOverlay, bookModal));
    bookCloseBtn.addEventListener('click', e => { e.stopPropagation(); popClose(bookModal, bookOverlay); });
    bookOverlay.addEventListener('click', e => { if(e.target === bookOverlay) popClose(bookModal, bookOverlay); });
  }
} catch(err){ console.error('Book preview pop-open setup failed:', err); }

/* ---------------- envelopes: message slides out into a big card ---------------- */
try {
  var overlay = document.getElementById('card-overlay');
  var modal = document.getElementById('card-modal');
  var modalText = document.getElementById('card-modal-text');
  var modalIcon = document.querySelector('.card-modal-icon');

  document.querySelectorAll('.envelope').forEach(env => {
    env.addEventListener('click', e => {
      e.stopPropagation();
      const rect = env.getBoundingClientRect();
      const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
      const vw = window.innerWidth/2, vh = window.innerHeight/2;
      modalText.textContent = env.dataset.msg;
      modalIcon.textContent = env.dataset.icon || '💖';
      overlay.classList.add('show');
      modal.style.transition = 'none';
      modal.style.transform = `translate(${cx-vw}px, ${cy-vh}px) scale(.15)`;
      modal.style.opacity = '0';
      requestAnimationFrame(()=>{
        modal.style.transition = 'transform .6s cubic-bezier(.34,1.15,.4,1), opacity .4s ease';
        modal.style.transform = 'translate(0,0) scale(1)';
        modal.style.opacity = '1';
      });
    });
  });

  function closeCard(){
    modal.style.transition = 'transform .4s ease, opacity .3s ease';
    modal.style.transform = 'translate(0,0) scale(.15)';
    modal.style.opacity = '0';
    setTimeout(()=> overlay.classList.remove('show'), 380);
  }
  document.getElementById('card-close').addEventListener('click', e => { e.stopPropagation(); closeCard(); });
  overlay.addEventListener('click', e => { if(e.target === overlay) closeCard(); });
} catch(err){ console.error('Envelope card setup failed:', err); }

window.addEventListener('resize', ()=>{
  heart.x = Math.min(heart.x, window.innerWidth - PAD);
  heart.y = Math.min(heart.y, window.innerHeight - PAD);
});