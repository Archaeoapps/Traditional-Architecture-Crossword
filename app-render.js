
function renderClues() {
  const make = (containerId, dir) => {
    const container = el(containerId);
    container.innerHTML = "";
    words.filter(w=>w.dir===dir).forEach(w=>{
      const b = document.createElement("button");
      b.type = "button";
      b.className = "clue";
      b.dataset.word = w.id;
      const solvedBy = state.solved[w.id];
      let winner = "";
      if (solvedBy === "reveal") winner = '<span class="winner">Λύση εμφανίστηκε · 0 β.</span>';
      else if (solvedBy === 0 || solvedBy === 1) winner = `<span class="winner">+1 ${escapeHtml(teamName(solvedBy))}</span>`;
      b.innerHTML = `<span class="n">${w.number}.</span><span>${escapeHtml(w.clue)}${winner}</span>`;
      if (state.selected === w.id) b.classList.add("selected");
      if (Object.prototype.hasOwnProperty.call(state.solved,w.id)) b.classList.add("solved");
      b.addEventListener("click", ()=>selectWord(w.id));
      container.appendChild(b);
    });
  };
  make("acrossClues","A");
  make("downClues","D");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
}

function render() {
  el("teamName0").value = state.teams[0].name;
  el("teamName1").value = state.teams[1].name;
  el("score0").textContent = state.teams[0].score;
  el("score1").textContent = state.teams[1].score;
  el("teamCard0").classList.toggle("active", state.activeTeam===0);
  el("teamCard1").classList.toggle("active", state.activeTeam===1);
  turnText.textContent = teamName(state.activeTeam);
  modeBadge.textContent = state.mode === "steal" ? "Προσπάθεια κλοπής" : "Κανονική προσπάθεια";
  modeBadge.classList.toggle("steal", state.mode === "steal");
  passBtn.textContent = state.mode === "steal" ? "Τέλος κλοπής" : "Παράδοση → Κλοπή";
  progressText.textContent = `${solvedCount()} / ${words.length} λυμένες`;

  const w = state.selected ? wordMap.get(state.selected) : null;
  selectedLabel.textContent = w ? `${w.number} ${w.dir === "A" ? "οριζόντια" : "κάθετα"} · ${w.answer.length} γράμματα` : "Επιλέξτε μια υπόδειξη";
  const usable = !!w && !Object.prototype.hasOwnProperty.call(state.solved,w.id) && !state.completed;
  checkBtn.disabled = !usable;
  passBtn.disabled = !usable;
  revealBtn.disabled = !usable;
  timerBtn.disabled = !usable;

  document.querySelectorAll(".cell").forEach(d=>d.classList.remove("selected","crossing","locked"));
  document.querySelectorAll(".cell input").forEach(input=>{
    const key = input.dataset.key;
    const locked = isLocked(key);
    const inSelected = w ? cells.get(key).words.includes(w.id) : false;
    input.disabled = state.completed || locked || !inSelected;
    if (locked) input.parentElement.classList.add("locked");
    if (inSelected) input.parentElement.classList.add("selected");
    if (w && inSelected && cells.get(key).words.length > 1) input.parentElement.classList.add("crossing");
    input.value = state.values[key] || "";
  });

  renderClues();
  renderFinal();
}

function selectWord(id) {
  if (state.completed) return;
  const w = wordMap.get(id);
  if (!w) return;
  if (Object.prototype.hasOwnProperty.call(state.solved,id)) {
    setMessage("Η λέξη αυτή έχει ήδη λυθεί. Επιλέξτε άλλη υπόδειξη.", "info");
    return;
  }
  state.selected = id;
  resetTimer();
  render();
  const first = wordCells(w).map(p=>document.querySelector(`input[data-key="${p.r},${p.c}"]`)).find(i=>i && !i.disabled);
  if (first) first.focus();
  setMessage(`${teamName(state.activeTeam)}: ${w.number} ${w.dir === "A" ? "οριζόντια" : "κάθετα"}.`, state.mode === "steal" ? "warning" : "info");
  saveState();
}

function onCellFocus(e) {
  const key = e.target.dataset.key;
  if (!key) return;
  const meta = cells.get(key);
  if (!meta) return;
  if (state.selected && meta.words.includes(state.selected)) return;
  const candidate = meta.words.find(id=>!Object.prototype.hasOwnProperty.call(state.solved,id));
  if (candidate) selectWord(candidate);
}

function onCellInput(e) {
  const input = e.target;
  const key = input.dataset.key;
  const val = normalizeChar(input.value);
  input.value = val;
  state.values[key] = val;
  saveState();
  if (val) moveRelative(input, 1);
}

function onCellKeyDown(e) {
  if (!state.selected) return;
  if (e.key === "Backspace" && !e.target.value) {
    e.preventDefault();
    moveRelative(e.target, -1);
    return;
  }
  if (["ArrowRight","ArrowDown"].includes(e.key)) { e.preventDefault(); moveRelative(e.target, 1); }
  if (["ArrowLeft","ArrowUp"].includes(e.key)) { e.preventDefault(); moveRelative(e.target, -1); }
}

function moveRelative(input, delta) {
  const w = wordMap.get(state.selected);
  if (!w) return;
  const sequence = wordCells(w).map(p=>`${p.r},${p.c}`);
  let idx = sequence.indexOf(input.dataset.key);
  for (let step=idx+delta; step>=0 && step<sequence.length; step+=delta) {
    const next = document.querySelector(`input[data-key="${sequence[step]}"]`);
    if (next && !next.disabled) { next.focus(); next.select(); break; }
  }
}

function currentEntry(w) {
  return wordCells(w).map(p=>normalizeChar(state.values[`${p.r},${p.c}`] || "")).join("");
}

function clearWordUnsolvedCells(w) {
  for (const p of wordCells(w)) {
    const key = `${p.r},${p.c}`;
    if (!isLocked(key)) state.values[key] = "";
  }
}

function fillAnswer(w) {
  wordCells(w).forEach((p,i)=>{ state.values[`${p.r},${p.c}`] = w.answer[i]; });
}

function finishWord(w, solvedBy) {
  fillAnswer(w);
  state.solved[w.id] = solvedBy;
  if (solvedBy === 0 || solvedBy === 1) state.teams[solvedBy].score += 1;
  const wasSteal = state.mode === "steal";
  const current = state.activeTeam;
  state.mode = "normal";
  state.activeTeam = wasSteal ? current : 1-current;
  state.selected = null;
  resetTimer();
  if (solvedCount() === words.length) state.completed = true;
}
