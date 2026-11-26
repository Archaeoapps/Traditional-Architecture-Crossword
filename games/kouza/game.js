'use strict';
const LETTERS=[...'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'];
const MAX_ERRORS=3, ROUND_SECONDS=90, POINTS=10;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const norm=s=>s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ');
const greek=c=>LETTERS.includes(c);
function parse(text){
  const found=new Map();
  for(const block of text.replace(/^\uFEFF/,'').split(/^\s*---\s*$/m)){
    const row={};
    for(const line of block.split(/\r?\n/)){
      if(!line.trim()||line.trim().startsWith('#'))continue;
      const i=line.indexOf(':');if(i>0)row[line.slice(0,i).trim().toLowerCase()]=line.slice(i+1).trim();
    }
    if(!row.word)continue;
    const w=norm(row.word);
    if(![...w].some(greek))continue;
    if(/[A-Z0-9]/.test(w))continue;
    if(!found.has(w))found.set(w,{...row,normalized:w});
  }
  return [...found.values()];
}
function shuffle(a,rng=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
let inventory=[],queue=[],round=0,current=null,team='A',scores={A:0,B:0},guessed=new Set(),wrong=0,phase='loading',deadline=0,interval=null;
const stateNames=['Άθικτη φοινιώτικη κούζα','Ρωγμή χαμηλά στην κοιλιά','Ρωγμές στην κοιλιά και στον λαιμό','Σπασμένη κούζα με αποσπασμένο τμήμα του λαιμού'];
const pngPaths=stateNames.map((_,i)=>'assets/kouza-'+i+'.png');
const preloaded=pngPaths.map(src=>{let img=new Image();img.src=src;return img});
function clearTimer(){if(interval!==null)clearInterval(interval);interval=null;deadline=0}
function renderTime(seconds){
  $('#timer').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  $('#timer').classList.toggle('urgent',seconds<=15);
  $('#timeBar').style.width=(seconds/ROUND_SECONDS*100)+'%';
  $('#timeBar').classList.toggle('urgent',seconds<=15);
}
function tick(){
  if(phase!=='playing')return;
  const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
  renderTime(seconds);if(seconds===0)endRound('timeout');
}
function renderScores(){
  $('#scoreA').textContent=scores.A;$('#scoreB').textContent=scores.B;
  for(const t of ['A','B'])$('#card'+t).classList.toggle('active',team===t&&phase!=='complete');
  $('#activeTeam').textContent=phase==='complete'?'Τέλος παιχνιδιού':team==='A'?'Ομάδα Α':'Ομάδα Β';
}
function renderJar(){
  const img=$('#kouzaGraphic');img.src=pngPaths[wrong];img.alt=stateNames[wrong];
  $('#mistakes').textContent='Λάθη: '+wrong+' / '+MAX_ERRORS;
  $$('#errors span').forEach((el,i)=>el.classList.toggle('used',i<wrong));
}
function renderWord(reveal=false){
  const el=$('#word');el.replaceChildren();if(!current)return;
  for(const part of current.normalized.split(' ')){
    const group=document.createElement('span');group.className='word-group';
    for(const c of part){
      const letter=document.createElement('span');letter.className='letter';
      if(!greek(c)){letter.classList.add('punct');letter.textContent=c}
      else if(guessed.has(c)){letter.textContent=c}
      else if(reveal){letter.textContent=c;letter.classList.add('missed')}
      else{letter.textContent='\u00a0';letter.setAttribute('aria-label','Κρυφό γράμμα')}
      group.append(letter);
    }el.append(group);
  }
  el.setAttribute('aria-label',reveal?current.word:[...current.normalized].map(c=>greek(c)&&!guessed.has(c)?'_':c).join(' '));
}
function renderKeyboard(){
  const el=$('#keyboard');el.replaceChildren();
  for(const letter of LETTERS){
    const button=document.createElement('button');button.type='button';button.className='key';button.textContent=letter;
    const used=guessed.has(letter);button.disabled=phase!=='playing'||used;
    if(used&&current)button.classList.add(current.normalized.includes(letter)?'hit':'miss');
    button.addEventListener('click',()=>guess(letter));el.append(button);
  }
}
function controls(){
  $('#start').disabled=phase!=='ready';
  $('#next').disabled=phase!=='ended';
  $('#reset').disabled=phase==='loading'||!inventory.length;
  $('#next').textContent=round>=queue.length?'Αποτελέσματα →':'Επόμενη λέξη →';
}
function nextRound(){
  clearTimer();
  if(round>=queue.length){complete();return}
  current=queue[round++];team=round%2===1?'A':'B';phase='ready';wrong=0;guessed=new Set();
  $('#roundCounter').textContent='Λέξη '+round+' / '+queue.length;
  $('#hint').textContent=current.hint||'Δεν υπάρχει υπόδειξη.';
  $('#category').textContent=current.category?'Κατηγορία: '+current.category:'';
  $('#status').textContent='Η κούζα είναι άθικτη. Πατήστε «Έναρξη».';
  renderScores();renderJar();renderWord();renderTime(ROUND_SECONDS);renderKeyboard();controls();
}
function startRound(){
  if(phase!=='ready')return;phase='playing';deadline=Date.now()+ROUND_SECONDS*1000;
  $('#status').textContent='Μάντεψε τη λέξη!';
  renderKeyboard();controls();tick();interval=setInterval(tick,100);
}
function guess(letter){
  if(phase!=='playing'||!greek(letter)||guessed.has(letter))return;
  tick();if(phase!=='playing')return;
  guessed.add(letter);
  if(!current.normalized.includes(letter)){
    wrong++;renderJar();
    if(wrong===MAX_ERRORS){endRound('broken');return}
    $('#status').textContent=stateNames[wrong]+'.';
  }
  renderWord();renderKeyboard();
  if([...current.normalized].filter(greek).every(c=>guessed.has(c)))endRound('solved');
}
function endRound(reason){
  if(phase!=='playing')return;phase='ended';clearTimer();
  if(reason==='solved'){
    scores[team]+=POINTS;renderScores();
    $('#status').textContent='Σωστά! Η Ομάδα '+(team==='A'?'Α':'Β')+' κερδίζει '+POINTS+' βαθμούς.';
  }else if(reason==='broken')$('#status').textContent='Έσπασεν η κούζα! Η λέξη ήταν: '+current.word;
  else $('#status').textContent='Τέλειωσε ο χρόνος! Η λέξη ήταν: '+current.word;
  renderWord(true);renderKeyboard();controls();
}
function complete(){
  clearTimer();phase='complete';current=null;
  $('#word').textContent='ΤΕΛΟΣ';$('#word').setAttribute('aria-label','Τέλος παιχνιδιού');
  $('#hint').textContent='Όλες οι λέξεις χρησιμοποιήθηκαν.';$('#category').textContent='';
  $('#roundCounter').textContent=queue.length+' / '+queue.length+' λέξεις';
  const winner=scores.A===scores.B?'Ισοπαλία!':'Νικήτρια: Ομάδα '+(scores.A>scores.B?'Α':'Β')+'!';
  $('#status').textContent=winner+' Τελικό σκορ: '+scores.A+' – '+scores.B+'.';
  renderScores();renderKeyboard();controls();
}
function resetGame(){
  clearTimer();queue=shuffle(inventory);round=0;scores={A:0,B:0};nextRound();
}
$('#start').addEventListener('click',startRound);
$('#next').addEventListener('click',()=>{if(phase==='ended')nextRound()});
$('#reset').addEventListener('click',()=>{if(inventory.length&&confirm('Να ξεκινήσει νέο παιχνίδι με νέα τυχαία σειρά λέξεων;'))resetGame()});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||e.repeat||phase!=='playing')return;if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;const c=norm(e.key);if(greek(c)){e.preventDefault();guess(c)}});
document.addEventListener('visibilitychange',tick);
async function load(){
  try{const response=await fetch('content.txt',{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);inventory=parse(await response.text());if(!inventory.length)throw Error('Δεν βρέθηκαν έγκυρες ελληνικές λέξεις.');resetGame()}
  catch(e){phase='error';$('#word').textContent='Σφάλμα';$('#status').textContent='Αδυναμία φόρτωσης λέξεων. Ελέγξτε το content.txt και ανανεώστε τη σελίδα.';console.error(e);renderKeyboard();controls()}
}
load();
