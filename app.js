/* =========================================================
   Project September — Personal OS — V0
   Local-only PWA. All data lives in localStorage on this device.
   ========================================================= */

const STORAGE_KEY = 'ps_v0_state';
const SPRINT_START = '2026-08-13'; // dia en què es va tancar el disseny
const SPRINT_END = '2026-09-01';   // objectiu del primer tram

const BEDTIME_WINDOW_START = '23:30'; // franja objectiu de son: 23:30–00:30
const BEDTIME_WINDOW_END = '00:30';

const PILLARS = [
  { key: 'fisic', name: 'Físic', short: 'Fís' },
  { key: 'fortalesa', name: 'Fortalesa', short: 'For' },
  { key: 'coneixement', name: 'Coneixement', short: 'Con' },
  { key: 'comunicacio', name: 'Comunicació', short: 'Com' },
];

// "Aura" es desagrega en factors concrets en comptes d'un sol número
// invent (els altres factors originals — físic, disciplina, comunicació —
// ja es mesuren als seus propis pilars, així que aquí només hi ha el que
// no es cobreix enlloc més).
const AURA_FACTORS = [
  { key: 'aura_grooming', name: 'Grooming / cura de la imatge', short: 'Gro' },
  { key: 'aura_roba', name: 'Roba / estil', short: 'Rob' },
  { key: 'aura_confianca', name: 'Confiança / seguretat', short: 'Cnf' },
];

/* ---------------- State ---------------- */

function defaultState() {
  return {
    meta: { startDate: todayISO() }, // per calcular "Dia N" — es fixa un sol cop
    daily: {},        // { 'YYYY-MM-DD': { <habitKey>: bool..., sonOk, bedtime } }
    focusSessions: [], // [{ id, date, subject, objective, plannedMinutes, actualMinutes, completed, comprehension, interruptions }]
    weeks: {},         // { 'YYYY-MM-DD' (monday) : { weight, ratings:{}, social, phone:{util,oci,automatic}, notes } }
    habits: [          // hàbits de check manual — editables des de l'app; "Son" és apart perquè es calcula sol
      { key: 'entrenament', name: 'Entrenament' },
      { key: 'cura', name: 'Cura personal (pell / postura)' },
      { key: 'social', name: 'Interacció social intencionada' },
    ],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = defaultState();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch (e) { /* no bloquegem l'arrencada si falla */ }
      return fresh;
    }
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    console.error('No s\'ha pogut carregar l\'estat, es comença de nou.', e);
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('No s\'ha pogut guardar l\'estat', e);
    alert('No s\'han pogut guardar les dades (emmagatzematge ple o bloquejat).');
  }
}

let state = loadState();
window.state = state; // útil per inspeccionar/depurar des de la consola del navegador

/* ---------------- Date helpers ---------------- */

function pad(n) { return String(n).padStart(2, '0'); }

function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayISO() { return toISODate(new Date()); }

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

function mondayOfISO(iso) {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay(); // 0 = diumenge
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

function daysBetween(iso1, iso2) {
  const a = new Date(iso1 + 'T00:00:00');
  const b = new Date(iso2 + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

function daysUntilSept1() {
  const n = daysBetween(todayISO(), SPRINT_END);
  return n;
}

function fmtDateShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/* ---------------- Navigation ---------------- */

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.screen === name);
  });
  if (name === 'avui') renderAvui();
  if (name === 'focus') renderFocus();
  if (name === 'setmana') renderSetmana();
}

function bindNav() {
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => showScreen(t.dataset.screen));
  });
}

/* ---------------- Header: clock + comptador de dia + tram inicial ---------------- */

function renderHeader() {
  const clock = document.getElementById('clock');
  const now = new Date();
  clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // "Dia N" — compta des del primer dia que es va obrir l'app, sense caducitat.
  const dayN = Math.max(1, daysBetween(state.meta.startDate, todayISO()) + 1);
  document.getElementById('dayCounter').textContent = dayN;
  document.getElementById('dayCounterLabel').textContent = dayN === 1 ? 'primer dia del sistema' : 'dies des que vas començar';

  // Insígnia del primer tram (fins l'1/9) — només es mostra mentre encara té sentit.
  const daysLeft = daysUntilSept1();
  const sprintBadge = document.getElementById('sprintBadge');
  if (daysLeft >= 0) {
    sprintBadge.hidden = false;
    document.getElementById('sprintBadgeText').textContent =
      daysLeft === 0 ? 'avui és el dia — 1 de setembre' : `${daysLeft} dies fins l'1 de set.`;
    const totalSprint = Math.max(daysBetween(SPRINT_START, SPRINT_END), 1);
    const elapsed = Math.min(Math.max(daysBetween(SPRINT_START, todayISO()), 0), totalSprint);
    document.getElementById('sprintFill').style.width = `${Math.round((elapsed / totalSprint) * 100)}%`;
  } else {
    sprintBadge.hidden = true;
  }
}

/* ---------------- AVUI ---------------- */

function blankDailyRecord() {
  // Els hàbits manuals es guarden com a claus soltes (rec[habitKey]) — no cal predefinir-les aquí.
  return { sonOk: false, bedtime: null };
}

function peekDaily(dateIso) {
  return state.daily[dateIso] || blankDailyRecord();
}

function getDaily(dateIso) {
  if (!state.daily[dateIso]) {
    state.daily[dateIso] = blankDailyRecord();
  }
  return state.daily[dateIso];
}

function consistencyWindow(key) {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const iso = isoDaysAgo(i);
    const rec = state.daily[iso];
    if (rec && rec[key]) count++;
  }
  return count;
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // treu accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'habit';
}

function makeHabitKey(name) {
  return `${slugify(name)}_${Date.now().toString(36).slice(-4)}`;
}

function renderAvui() {
  const today = todayISO();
  const rec = peekDaily(today); // només per mostrar — no crea res a l'estat fins que l'usuari interactua

  const list = document.getElementById('habitList');
  if (state.habits.length === 0) {
    list.innerHTML = `<li class="history-empty">Encara no tens cap hàbit — afegeix-ne un a "Gestionar hàbits".</li>`;
  } else {
    list.innerHTML = state.habits.map(h => {
      const checked = !!rec[h.key];
      const window7 = consistencyWindow(h.key);
      return `
        <li class="habit-item ${checked ? 'checked' : ''}" data-key="${h.key}">
          <div class="habit-main">
            <button class="habit-check" data-toggle="${h.key}" aria-label="${escapeHtml(h.name)}">${checked ? '✓' : ''}</button>
            <span class="habit-name">${escapeHtml(h.name)}</span>
          </div>
          <span class="habit-window mono">${window7}/7</span>
        </li>`;
    }).join('');
  }

  list.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => toggleHabit(btn.dataset.toggle));
  });

  const bedtimeInput = document.getElementById('bedtimeInput');
  bedtimeInput.value = rec.bedtime || '';
  bedtimeInput.onchange = () => {
    const liveRec = getDaily(today); // aquí sí que volem crear/persistir de veritat
    liveRec.bedtime = bedtimeInput.value || null;
    liveRec.sonOk = isBedtimeOk(liveRec.bedtime);
    saveState();
    renderAvui();
  };
  document.getElementById('sonWindow').textContent = `${consistencyWindow('sonOk')}/7`;

  const focusToday = state.focusSessions.filter(s => s.date === today).length;
  document.getElementById('focusTodayCount').textContent = focusToday;

  renderHabitManager();
}

function renderHabitManager() {
  const ul = document.getElementById('habitManageList');
  if (state.habits.length === 0) {
    ul.innerHTML = `<li class="manage-empty">Cap hàbit configurat encara.</li>`;
  } else {
    ul.innerHTML = state.habits.map(h => `
      <li class="manage-item">
        <span>${escapeHtml(h.name)}</span>
        <button class="remove-btn" data-remove="${h.key}" aria-label="Eliminar ${escapeHtml(h.name)}">✕</button>
      </li>`).join('');
  }
  ul.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeHabit(btn.dataset.remove));
  });
}

function removeHabit(key) {
  const habit = state.habits.find(h => h.key === key);
  const ok = confirm(`Eliminar "${habit ? habit.name : key}"? L'historial ja registrat es queda igual, però deixa de comptar-se a partir d'ara.`);
  if (!ok) return;
  state.habits = state.habits.filter(h => h.key !== key);
  saveState();
  renderAvui();
}

document.getElementById('addHabitBtn')?.addEventListener('click', () => {
  const input = document.getElementById('newHabitName');
  const name = input.value.trim();
  if (!name) return;
  state.habits.push({ key: makeHabitKey(name), name });
  saveState();
  input.value = '';
  renderAvui();
});

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function isBedtimeOk(time) {
  if (!time) return false;
  const minutes = toMinutes(time);
  const start = toMinutes(BEDTIME_WINDOW_START);
  const end = toMinutes(BEDTIME_WINDOW_END);
  if (minutes >= start) return true; // p. ex. 23:30–23:59
  if (minutes <= end) return true;   // p. ex. 00:00–00:30
  return false;
}

function toggleHabit(key) {
  const rec = getDaily(todayISO());
  rec[key] = !rec[key];
  saveState();
  renderAvui();
}

document.getElementById('goFocusBtn')?.addEventListener('click', () => showScreen('focus'));

/* ---------------- FOCUS ---------------- */

let focusTimer = {
  running: false,
  paused: false,
  remainingSeconds: 0,
  plannedMinutes: 0,
  subject: '',
  objective: '',
  interruptions: 0,
  intervalId: null,
};

function renderFocus() {
  const hasActive = focusTimer.running || focusTimer.pendingLog;
  document.getElementById('focusSetup').hidden = hasActive;
  document.getElementById('focusRunning').hidden = !focusTimer.running;
  document.getElementById('focusLog').hidden = !focusTimer.pendingLog;

  renderSubjectSummary();
  renderFocusHistory();
}

const DIFFICULTY_LABEL = { easy: 'Fàcil', normal: 'Normal', hard: 'Difícil' };
const COMPREHENSION_DOT = { green: '🟢', yellow: '🟡', red: '🔴' };

function renderSubjectSummary() {
  const ul = document.getElementById('subjectSummary');
  const bySubject = {};
  state.focusSessions.forEach(s => {
    const key = (s.subject || '').trim() || '(sense assignatura)';
    if (!bySubject[key]) bySubject[key] = { minutes: 0, count: 0, lastComprehension: null, lastDifficulty: null, lastDate: null };
    const agg = bySubject[key];
    agg.minutes += s.actualMinutes || 0;
    agg.count += 1;
    if (!agg.lastDate || s.date >= agg.lastDate) {
      agg.lastDate = s.date;
      agg.lastComprehension = s.comprehension;
      agg.lastDifficulty = s.difficulty;
    }
  });

  const entries = Object.entries(bySubject).sort((a, b) => b[1].minutes - a[1].minutes);
  if (entries.length === 0) {
    ul.innerHTML = `<li class="history-empty">Encara no hi ha sessions per agrupar per assignatura.</li>`;
    return;
  }
  ul.innerHTML = entries.map(([subject, agg]) => `
    <li class="history-item">
      <div class="h-top"><span>${escapeHtml(subject)}</span><span>${agg.count} sessions · ${agg.minutes} min</span></div>
      <div class="h-main mono">Últim cop: ${COMPREHENSION_DOT[agg.lastComprehension] || '–'} · ${agg.lastDifficulty ? DIFFICULTY_LABEL[agg.lastDifficulty] : '–'}</div>
    </li>`).join('');
}

function renderFocusHistory() {
  const ul = document.getElementById('focusHistory');
  const recent = [...state.focusSessions].reverse().slice(0, 8);
  if (recent.length === 0) {
    ul.innerHTML = `<li class="history-empty">Encara no hi ha sessions registrades.</li>`;
    return;
  }
  ul.innerHTML = recent.map(s => `
    <li class="history-item">
      <div class="h-top"><span>${fmtDateShort(s.date)}</span><span>${s.actualMinutes} min · ${COMPREHENSION_DOT[s.comprehension] || ''} · ${s.difficulty ? DIFFICULTY_LABEL[s.difficulty] : '–'} · ${s.interruptions} interr.</span></div>
      <div class="h-main">${escapeHtml(s.subject || '—')}${s.objective ? ' — ' + escapeHtml(s.objective) : ''}</div>
    </li>`).join('');
}

document.getElementById('startFocusBtn')?.addEventListener('click', () => {
  const subject = document.getElementById('focusSubject').value.trim();
  const objective = document.getElementById('focusObjective').value.trim();
  const durationInput = document.getElementById('focusDuration');
  const duration = parseInt(durationInput.value, 10);

  if (!durationInput.value || isNaN(duration) || duration <= 0) {
    alert('Posa una durada en minuts abans de començar.');
    durationInput.focus();
    return;
  }

  focusTimer = {
    running: true,
    paused: false,
    remainingSeconds: duration * 60,
    plannedMinutes: duration,
    subject, objective,
    interruptions: 0,
    startedAt: Date.now(),
    intervalId: null,
    pendingLog: false,
  };

  document.getElementById('focusRunningSubject').textContent = subject || 'Sessió de focus';
  document.getElementById('focusRunningObjective').textContent = objective || '';
  document.getElementById('interruptionCount').textContent = '(0)';
  updateTimerDisplay();

  focusTimer.intervalId = setInterval(tickFocus, 1000);
  renderFocus();
});

function tickFocus() {
  if (focusTimer.paused) return;
  focusTimer.remainingSeconds--;
  if (focusTimer.remainingSeconds <= 0) {
    focusTimer.remainingSeconds = 0;
    updateTimerDisplay();
    finishFocusTimer(true);
    return;
  }
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(focusTimer.remainingSeconds / 60);
  const s = focusTimer.remainingSeconds % 60;
  document.getElementById('timerDisplay').textContent = `${pad(m)}:${pad(s)}`;
}

document.getElementById('lostFocusBtn')?.addEventListener('click', () => {
  focusTimer.interruptions++;
  document.getElementById('interruptionCount').textContent = `(${focusTimer.interruptions})`;
});

document.getElementById('pauseFocusBtn')?.addEventListener('click', (e) => {
  focusTimer.paused = !focusTimer.paused;
  e.target.textContent = focusTimer.paused ? 'Reprendre' : 'Pausa';
});

document.getElementById('endFocusBtn')?.addEventListener('click', () => finishFocusTimer(false));

function finishFocusTimer(completedByTimer) {
  clearInterval(focusTimer.intervalId);
  focusTimer.running = false;
  focusTimer.pendingLog = true;

  if (navigator.vibrate) navigator.vibrate(completedByTimer ? [120, 60, 120] : 80);

  const elapsedSeconds = focusTimer.plannedMinutes * 60 - focusTimer.remainingSeconds;
  const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

  document.getElementById('logMinutes').value = elapsedMinutes;
  document.getElementById('logInterruptions').value = focusTimer.interruptions;
  setSegmented('completedSeg', completedByTimer ? 'true' : null);
  setSegmented('comprehensionSeg', null);
  setSegmented('difficultySeg', null);

  renderFocus();
}

function setSegmented(containerId, selectedVal) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.seg-btn').forEach(b => {
    b.classList.toggle('selected', selectedVal !== null && b.dataset.val === selectedVal);
  });
}

document.querySelectorAll('#completedSeg .seg-btn, #comprehensionSeg .seg-btn, #difficultySeg .seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.parentElement;
    parent.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

document.getElementById('saveFocusLogBtn')?.addEventListener('click', () => {
  const minutes = Math.max(0, parseInt(document.getElementById('logMinutes').value, 10) || 0);
  const interruptions = Math.max(0, parseInt(document.getElementById('logInterruptions').value, 10) || 0);
  const completedBtn = document.querySelector('#completedSeg .seg-btn.selected');
  const comprehensionBtn = document.querySelector('#comprehensionSeg .seg-btn.selected');
  const difficultyBtn = document.querySelector('#difficultySeg .seg-btn.selected');

  state.focusSessions.push({
    id: Date.now(),
    date: todayISO(),
    subject: focusTimer.subject,
    objective: focusTimer.objective,
    plannedMinutes: focusTimer.plannedMinutes,
    actualMinutes: minutes,
    completed: completedBtn ? completedBtn.dataset.val === 'true' : null,
    comprehension: comprehensionBtn ? comprehensionBtn.dataset.val : null,
    difficulty: difficultyBtn ? difficultyBtn.dataset.val : null,
    interruptions,
  });
  saveState();

  focusTimer = { running: false, paused: false, remainingSeconds: 0, plannedMinutes: 0, subject: '', objective: '', interruptions: 0, intervalId: null, pendingLog: false };
  document.getElementById('focusSubject').value = '';
  document.getElementById('focusObjective').value = '';
  document.getElementById('focusDuration').value = '';

  showScreen('avui');
});

/* ---------------- SETMANA ---------------- */

function blankWeekRecord() {
  return {
    weight: null,
    ratings: {},
    social: null,
    phone: { util: null, oci: null, automatic: null },
    comms: { newPeople: null, spokeUp: null },
    notes: '',
  };
}

function peekWeekRecord(weekKey) {
  return state.weeks[weekKey] || blankWeekRecord();
}

function getWeekRecord(weekKey) {
  if (!state.weeks[weekKey]) {
    state.weeks[weekKey] = blankWeekRecord();
  }
  return state.weeks[weekKey];
}

function renderSliderGroup(containerId, items, ratings) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(p => {
    const val = ratings[p.key] ?? 5;
    return `
      <div class="pillar-row">
        <div class="field-top">
          <label>${p.name}</label>
          <span class="pillar-val mono" id="pval-${p.key}">${val}</span>
        </div>
        <input type="range" min="1" max="10" value="${val}" data-pillar="${p.key}">
      </div>`;
  }).join('');
  container.querySelectorAll('input[type="range"]').forEach(input => {
    input.addEventListener('input', () => {
      document.getElementById(`pval-${input.dataset.pillar}`).textContent = input.value;
    });
  });
}

function renderSetmana() {
  const weekKey = mondayOfISO(todayISO());
  const rec = peekWeekRecord(weekKey); // només per mostrar — no crea res fins que es prem "Guardar"
  document.getElementById('weekLabel').textContent = `Setmana del ${fmtDateShort(weekKey)}`;

  document.getElementById('weightInput').value = rec.weight ?? '';
  document.getElementById('socialInput').value = rec.social ?? '';
  document.getElementById('phoneUtil').value = rec.phone.util ?? '';
  document.getElementById('phoneOci').value = rec.phone.oci ?? '';
  document.getElementById('phoneAuto').value = rec.phone.automatic ?? '';
  document.getElementById('commsNewPeople').value = (rec.comms && rec.comms.newPeople) ?? '';
  document.getElementById('commsSpokeUp').value = (rec.comms && rec.comms.spokeUp) ?? '';
  document.getElementById('weekNotes').value = rec.notes ?? '';

  renderSliderGroup('pillarRatings', PILLARS, rec.ratings);
  renderSliderGroup('auraRatings', AURA_FACTORS, rec.ratings);

  renderWeekHistory(weekKey);
}

function renderWeekHistory(currentWeekKey) {
  const ul = document.getElementById('weekHistory');
  const keys = Object.keys(state.weeks).filter(k => k !== currentWeekKey).sort().reverse();
  if (keys.length === 0) {
    ul.innerHTML = `<li class="history-empty">Encara no hi ha setmanes anteriors.</li>`;
    return;
  }
  const allItems = [...PILLARS, ...AURA_FACTORS];
  ul.innerHTML = keys.map(k => {
    const w = state.weeks[k];
    const ratingsStr = allItems.map(p => `${p.short} ${w.ratings[p.key] ?? '–'}`).join(' · ');
    return `
      <li class="history-item">
        <div class="h-top"><span>Setmana ${fmtDateShort(k)}</span><span>${w.weight ? w.weight + ' kg' : ''}</span></div>
        <div class="h-main mono">${ratingsStr}</div>
      </li>`;
  }).join('');
}

document.getElementById('saveWeekBtn')?.addEventListener('click', () => {
  const weekKey = mondayOfISO(todayISO());
  const rec = getWeekRecord(weekKey);

  rec.weight = parseFloat(document.getElementById('weightInput').value) || null;
  rec.social = parseInt(document.getElementById('socialInput').value, 10) || 0;
  rec.phone.util = parseFloat(document.getElementById('phoneUtil').value) || 0;
  rec.phone.oci = parseFloat(document.getElementById('phoneOci').value) || 0;
  rec.phone.automatic = parseFloat(document.getElementById('phoneAuto').value) || 0;
  rec.comms = rec.comms || { newPeople: null, spokeUp: null };
  rec.comms.newPeople = parseInt(document.getElementById('commsNewPeople').value, 10) || 0;
  rec.comms.spokeUp = parseInt(document.getElementById('commsSpokeUp').value, 10) || 0;
  rec.notes = document.getElementById('weekNotes').value;

  document.querySelectorAll('.pillar-ratings input[type="range"]').forEach(input => {
    rec.ratings[input.dataset.pillar] = parseInt(input.value, 10);
  });

  saveState();
  renderSetmana();
  const btn = document.getElementById('saveWeekBtn');
  const original = btn.textContent;
  btn.textContent = 'Guardat ✓';
  setTimeout(() => { btn.textContent = original; }, 1200);
});

/* ---------------- Còpia de seguretat (exportar / importar) ---------------- */


document.getElementById('exportBtn')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `september-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('importFile')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || typeof parsed !== 'object') throw new Error('format invàlid');
      const ok = confirm('Això substituirà TOTES les dades actuals per les del fitxer importat. Vols continuar?');
      if (!ok) return;
      state = Object.assign(defaultState(), parsed);
      window.state = state;
      saveState();
      renderAvui();
      renderSetmana();
      alert('Dades importades correctament.');
    } catch (err) {
      alert('El fitxer no és una còpia vàlida de September.');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
});

/* ---------------- Utils ---------------- */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------- Init ---------------- */

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW no registrat:', err));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindNav();
  registerServiceWorker();
  renderHeader();
  setInterval(renderHeader, 30000);
  renderAvui();
});
