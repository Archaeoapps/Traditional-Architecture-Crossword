checkBtn.addEventListener("click", checkAnswer);
passBtn.addEventListener("click", passAttempt);
revealBtn.addEventListener("click", revealAnswer);
resetBtn.addEventListener("click", resetGame);
timerBtn.addEventListener("click", toggleTimer);
el("teamName0").addEventListener("change", ()=>{ state.teams[0].name=el("teamName0").value.trim()||"Ομάδα Α"; render(); saveState(); });
el("teamName1").addEventListener("change", ()=>{ state.teams[1].name=el("teamName1").value.trim()||"Ομάδα Β"; render(); saveState(); });

window.addEventListener("pagehide", saveState);

loadState();
renderGrid();
render();
if (state.completed) setMessage("Το παιχνίδι έχει ολοκληρωθεί. Μπορείτε να ξεκινήσετε νέο παιχνίδι.", "success");
else if (solvedCount() > 0) setMessage("Το προηγούμενο παιχνίδι αποκαταστάθηκε από αυτόν τον browser.", "info");
saveState();
