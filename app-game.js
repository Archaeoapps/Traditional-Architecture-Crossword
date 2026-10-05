function checkAnswer() {
  const w = state.selected ? wordMap.get(state.selected) : null;
  if (!w || Object.prototype.hasOwnProperty.call(state.solved,w.id)) return;
  const entry = currentEntry(w);
  if (entry.length !== w.answer.length) {
    setMessage(`Χρειάζονται ${w.answer.length} γράμματα πριν από τον έλεγχο.`, "warning");
    return;
  }
  if (entry === w.answer) {
    const scorer = state.activeTeam;
    const wasSteal = state.mode === "steal";
    finishWord(w, scorer);
    render();
    setMessage(`Σωστά! +1 βαθμός για ${teamName(scorer)}${wasSteal ? " από κλοπή" : ""}.`, "success");
    saveState();
    return;
  }
  clearWordUnsolvedCells(w);
  if (state.mode === "normal") {
    state.activeTeam = 1-state.activeTeam;
    state.mode = "steal";
    resetTimer();
    render();
    setMessage(`Λάθος. ${teamName(state.activeTeam)} έχει μία προσπάθεια για κλοπή του βαθμού.`, "warning");
  } else {
    state.mode = "normal";
    state.selected = null;
    resetTimer();
    render();
    setMessage(`Η κλοπή δεν πέτυχε. Η λέξη παραμένει διαθέσιμη. Σειρά έχει ${teamName(state.activeTeam)}.`, "error");
  }
  saveState();
}

function passAttempt() {
  const w = state.selected ? wordMap.get(state.selected) : null;
  if (!w) return;
  clearWordUnsolvedCells(w);
  if (state.mode === "normal") {
    state.activeTeam = 1-state.activeTeam;
    state.mode = "steal";
    resetTimer();
    render();
    setMessage(`${teamName(state.activeTeam)} μπορεί να κλέψει τον βαθμό.`, "warning");
  } else {
    state.mode = "normal";
    state.selected = null;
    resetTimer();
    render();
    setMessage(`Η κλοπή έληξε χωρίς απάντηση. Σειρά έχει ${teamName(state.activeTeam)}.`, "info");
  }
  saveState();
}

function revealAnswer() {
  const w = state.selected ? wordMap.get(state.selected) : null;
  if (!w) return;
  if (!window.confirm("Να εμφανιστεί η λύση; Δεν θα δοθεί βαθμός σε καμία ομάδα.")) return;
  const wasSteal = state.mode === "steal";
  const current = state.activeTeam;
  fillAnswer(w);
  state.solved[w.id] = "reveal";
  state.mode = "normal";
  state.activeTeam = wasSteal ? current : 1-current;
  state.selected = null;
  resetTimer();
  if (solvedCount() === words.length) state.completed = true;
  render();
  setMessage(`Η λύση εμφανίστηκε χωρίς βαθμό. Σειρά έχει ${teamName(state.activeTeam)}.`, "info");
  saveState();
}

function renderFinal() {
  if (!state.completed) { finalResult.hidden = true; return; }
  const a = state.teams[0].score, b = state.teams[1].score;
  let result;
  if (a > b) result = `Νικήτρια: ${teamName(0)} (${a}–${b})`;
  else if (b > a) result = `Νικήτρια: ${teamName(1)} (${b}–${a})`;
  else result = `Ισοπαλία ${a}–${b}`;
  finalResult.textContent = `Το σταυρόλεξο ολοκληρώθηκε. ${result}.`;
  finalResult.hidden = false;
}

function resetGame() {
  if (!window.confirm("Να διαγραφεί η τρέχουσα βαθμολογία και να ξεκινήσει νέο παιχνίδι;")) return;
  const names = [el("teamName0").value.trim() || "Ομάδα Α", el("teamName1").value.trim() || "Ομάδα Β"];
  state = freshState();
  state.teams[0].name = names[0];
  state.teams[1].name = names[1];
  resetTimer();
  render();
  setMessage("Νέο παιχνίδι. Η πρώτη ομάδα επιλέγει υπόδειξη.", "info");
  saveState();
}

function resetTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
  timerSeconds = 10;
  timerEl.textContent = "10″";
  timerBtn.textContent = "Έναρξη 10″";
}

function toggleTimer() {
  if (timerHandle) { resetTimer(); return; }
  timerBtn.textContent = "Ακύρωση";
  timerHandle = setInterval(()=>{
    timerSeconds -= 1;
    timerEl.textContent = `${timerSeconds}″`;
    if (timerSeconds <= 0) {
      clearInterval(timerHandle); timerHandle = null;
      timerBtn.textContent = "Επανεκκίνηση 10″";
      setMessage("Ο χρόνος έληξε. Ελέγξτε την απάντηση ή δώστε την προσπάθεια στην άλλη ομάδα.", "warning");
    }
  },1000);
}
