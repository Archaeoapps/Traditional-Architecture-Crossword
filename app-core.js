
const rows = 9, cols = 17;
const words = [
  {id:"1A", number:1, dir:"A", row:0, col:0, answer:"ΔΙΜΟΥΡΕΛΛΗ", clue:"Τοιχοποιία με δύο όψεις ή «μούρες»."},
  {id:"1D", number:1, dir:"D", row:0, col:0, answer:"ΔΙΧΩΡΟ", clue:"Ευρύς χώρος που προκύπτει ουσιαστικά από τη συνένωση δύο μακρυναριών."},
  {id:"2D", number:2, dir:"D", row:0, col:2, answer:"ΜΑΚΡΥΝΑΡΙ", clue:"Μακρόστενος βασικός χώρος της παραδοσιακής κυπριακής κατοικίας."},
  {id:"3D", number:3, dir:"D", row:0, col:15, answer:"ΠΟΡΤΙΟ", clue:"Διαμπερής ή στεγασμένος χώρος εισόδου που συνδέει τον δρόμο με την αυλή."},
  {id:"4D", number:4, dir:"D", row:1, col:11, answer:"ΒΟΛΙΤΖΙΑ", clue:"Ξύλινα δοκάρια που χρησιμοποιούνται στην κατασκευή της στέγης."},
  {id:"5D", number:5, dir:"D", row:1, col:13, answer:"ΝΕΥΚΑ", clue:"Κύριο ξύλινο στοιχείο δίρριχτης στέγης πάνω στο οποίο στηρίζονται τα βολίτζια."},
  {id:"6A", number:6, dir:"A", row:2, col:6, answer:"ΣΙΔΕΡΟΠΕΤΡΑ", clue:"Πολύ σκληρή πέτρα που χρησιμοποιείται ως οικοδομικό υλικό."},
  {id:"7D", number:7, dir:"D", row:3, col:5, answer:"ΝΙΣΚΙΑ", clue:"Κτιστή εστία για άναμμα φωτιάς και μαγείρεμα."},
  {id:"8A", number:8, dir:"A", row:5, col:5, answer:"ΣΟΥΒΑΝΤΖΑ", clue:"Εσωτερικό αρχιτεκτονικό στοιχείο όπου τοποθετούνταν ή εκτίθεντο σκεύη και αντικείμενα."},
  {id:"9A", number:9, dir:"A", row:7, col:9, answer:"ΗΛΙΑΚΟΣ", clue:"Στεγασμένος, ημιυπαίθριος χώρος της κατοικίας, συνήθως προς την αυλή."},
  {id:"10A", number:10, dir:"A", row:8, col:0, answer:"ΠΛΙΘΘΑΡΙ", clue:"Παραδοσιακό ωμόπλινθο οικοδομικό στοιχείο από χώμα."}
];

const wordMap = new Map(words.map(w => [w.id, w]));
const cells = new Map();
const starts = new Map();
for (const w of words) {
  for (let i=0; i<w.answer.length; i++) {
    const r = w.row + (w.dir === "D" ? i : 0);
    const c = w.col + (w.dir === "A" ? i : 0);
    const key = `${r},${c}`;
    if (!cells.has(key)) cells.set(key, {words:[], correct:w.answer[i]});
    cells.get(key).words.push(w.id);
    if (cells.get(key).correct !== w.answer[i]) throw new Error("Ασυμβατότητα στο πλέγμα");
  }
  const startKey = `${w.row},${w.col}`;
  if (!starts.has(startKey)) starts.set(startKey, w.number);
}

const freshState = () => ({
  teams:[{name:"Ομάδα Α", score:0},{name:"Ομάδα Β", score:0}],
  activeTeam:0,
  mode:"normal",
  selected:null,
  solved:{},
  values:{},
  completed:false
});

let state = freshState();
let timerSeconds = 10;
let timerHandle = null;

const el = id => document.getElementById(id);
const gridEl = el("crossword");
const messageEl = el("message");
const selectedLabel = el("selectedLabel");
const progressText = el("progressText");
const checkBtn = el("checkBtn");
const passBtn = el("passBtn");
const revealBtn = el("revealBtn");
const resetBtn = el("resetBtn");
const timerEl = el("timer");
const timerBtn = el("timerBtn");
const modeBadge = el("modeBadge");
const turnText = el("turnText");
const finalResult = el("finalResult");

function normalizeChar(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/Σ$/g, "Σ")
    .slice(-1);
}

function wordCells(w) {
  return Array.from({length:w.answer.length}, (_,i) => ({
    r:w.row + (w.dir === "D" ? i : 0),
    c:w.col + (w.dir === "A" ? i : 0)
  }));
}

function isLocked(key) {
  const meta = cells.get(key);
  return !!meta && meta.words.some(id => Object.prototype.hasOwnProperty.call(state.solved,id));
}

function setMessage(text, kind="info") {
  messageEl.className = `message ${kind}`;
  messageEl.textContent = text;
}

function teamName(i) {
  return (state.teams[i].name || `Ομάδα ${i+1}`).trim() || `Ομάδα ${i+1}`;
}

function solvedCount() { return Object.keys(state.solved).length; }

function saveState() {
  state.teams[0].name = el("teamName0").value.trim() || "Ομάδα Α";
  state.teams[1].name = el("teamName1").value.trim() || "Ομάδα Β";
  try {
    localStorage.setItem("cy_arch_crossword_2teams", JSON.stringify(state));
  } catch (_) {}
}

function loadState() {
  let packed = "";
  try { packed = localStorage.getItem("cy_arch_crossword_2teams") || ""; } catch (_) {}
  if (packed) {
    try {
      const parsed = JSON.parse(packed);
      if (parsed && parsed.teams && parsed.solved && parsed.values) state = parsed;
    } catch (_) { state = freshState(); }
  }
}

function renderGrid() {
  gridEl.innerHTML = "";
  for (let r=0; r<rows; r++) {
    for (let c=0; c<cols; c++) {
      const key = `${r},${c}`;
      const div = document.createElement("div");
      const meta = cells.get(key);
      if (!meta) {
        div.className = "cell block";
        div.setAttribute("aria-hidden","true");
        gridEl.appendChild(div);
        continue;
      }
      div.className = "cell";
      div.dataset.key = key;
      if (starts.has(key)) {
        const n = document.createElement("span");
        n.className = "cell-number";
        n.textContent = starts.get(key);
        div.appendChild(n);
      }
      const input = document.createElement("input");
      input.maxLength = 1;
      input.autocomplete = "off";
      input.autocapitalize = "characters";
      input.spellcheck = false;
      input.inputMode = "text";
      input.setAttribute("aria-label", `Γραμμή ${r+1}, στήλη ${c+1}`);
      input.dataset.key = key;
      input.value = state.values[key] || "";
      input.addEventListener("input", onCellInput);
      input.addEventListener("keydown", onCellKeyDown);
      input.addEventListener("focus", onCellFocus);
      div.appendChild(input);
      gridEl.appendChild(div);
    }
  }
}
