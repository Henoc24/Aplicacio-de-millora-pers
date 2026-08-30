/* =========================================================
   Project September — Personal OS — V0
   Local-only PWA. All data lives in localStorage on this device.
   ========================================================= */

const STORAGE_KEY = 'ps_v0_state';
const SPRINT_START = '2026-08-13'; // dia en què es va tancar el disseny
const SPRINT_END = '2026-09-01';   // objectiu del primer tram

const BEDTIME_WINDOW_START = '23:30'; // franja objectiu de son: 23:30–00:30
const BEDTIME_WINDOW_END = '00:30';

/* ---------------- State ---------------- */

function defaultState() {
  return {
    meta: { startDate: todayISO() }, // per calcular "Dia N" — es fixa un sol cop
    daily: {},        // { 'YYYY-MM-DD': { <habitKey>: bool..., sonOk, bedtime } }
    focusSessions: [], // [{ id, date, subject, objective, plannedMinutes, actualMinutes, completed, comprehension, interruptions }]
    weeks: {},         // { 'YYYY-MM-DD' (monday) : { weight, ratings:{}, social, phone:{util,oci,automatic}, notes } }
    habits: [          // hàbits de check manual — editables des de l'app; "Son" és apart perquè es calcula sol
      { key: 'entrenament', name: 'Entrenament', time: null }, // "time" opcional: si té hora, apareix a la línia de temps en comptes de la llista sense hora
      { key: 'cura', name: 'Cura personal (pell / postura)', time: null },
      { key: 'social', name: 'Interacció social intencionada', time: null },
    ],
    // Context extern per pilar — de moment només s'usa "fisic" (la rutina).
    // L'estructura és genèrica perquè altres pilars (p. ex. coneixement) hi
    // puguin afegir el seu propi context més endavant sense canviar el format.
    context: { fisic: null },
    horari: null, // blocs de la setmana (classes, EOI, acadèmia, gimnàs...) — separat del context per pilar perquè abraça tot el dia
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
  if (name === 'inici') renderInici();
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

function consistencyPattern(key) {
  // Ordre cronològic: fa 6 dies ... avui (perquè es llegeixi d'esquerra a dreta)
  const pattern = [];
  for (let i = 6; i >= 0; i--) {
    const iso = isoDaysAgo(i);
    const rec = state.daily[iso];
    pattern.push(!!(rec && rec[key]));
  }
  return pattern;
}

function renderDotRow(containerId, key) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const pattern = consistencyPattern(key);
  const count = pattern.filter(Boolean).length;
  const band = count >= 5 ? 'dot-high' : count >= 3 ? 'dot-mid' : 'dot-low';
  el.innerHTML = pattern.map(v => `<span class="dot ${v ? 'dot-filled ' + band : ''}"></span>`).join('');
  el.setAttribute('aria-label', `${count}/7`);
}

function bindHabitToggles(container) {
  container.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => toggleHabit(btn.dataset.toggle));
  });
}

// Uneix els blocs de l'Horari (informatius) i els hàbits amb hora (marcables)
// en una sola llista cronològica — així Avui mostra el dia sencer d'un cop,
// no dues llistes separades que calia ajuntar mentalment.
function renderTimeline(rec) {
  const section = document.getElementById('timelineSection');
  const list = document.getElementById('timelineList');

  const horariBlocks = (state.horari && state.horari.horari && state.horari.horari[todayDayKey()]) || [];
  const items = horariBlocks.map(b => ({ hora: b.hora, nom: b.nom, kind: 'horari' }));

  state.habits.filter(h => h.time).forEach(h => {
    items.push({ hora: h.time, nom: h.name, kind: 'habit', key: h.key });
  });

  items.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

  if (items.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  list.innerHTML = items.map(it => {
    if (it.kind === 'habit') {
      const checked = !!rec[it.key];
      return `
        <li class="habit-item ${checked ? 'checked' : ''}" data-key="${it.key}">
          <div class="habit-main">
            <button class="habit-check" data-toggle="${it.key}" aria-label="${escapeHtml(it.nom)}">${checked ? '✓' : ''}</button>
            <span class="habit-name">${escapeHtml(it.nom)}</span>
          </div>
          <span class="mono timeline-time">${escapeHtml(it.hora)}</span>
        </li>`;
    }
    return `
      <li class="exercise-item">
        <span>${escapeHtml(it.nom)}</span>
        <span class="ex-detail">${escapeHtml(it.hora)}</span>
      </li>`;
  }).join('');

  bindHabitToggles(list);
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

  const untimedHabits = state.habits.filter(h => !h.time);
  const list = document.getElementById('habitList');
  if (untimedHabits.length === 0) {
    list.innerHTML = `<li class="history-empty">Cap hàbit sense hora fixa — afegeix-ne un a "Gestionar hàbits" o mira la línia de temps.</li>`;
  } else {
    list.innerHTML = untimedHabits.map(h => `
        <li class="habit-item ${rec[h.key] ? 'checked' : ''}" data-key="${h.key}">
          <div class="habit-main">
            <button class="habit-check" data-toggle="${h.key}" aria-label="${escapeHtml(h.name)}">${rec[h.key] ? '✓' : ''}</button>
            <span class="habit-name">${escapeHtml(h.name)}</span>
          </div>
          <span class="dot-row" id="dots-${h.key}"></span>
        </li>`).join('');
    untimedHabits.forEach(h => renderDotRow(`dots-${h.key}`, h.key));
  }
  bindHabitToggles(list);

  renderTimeline(rec);

  const bedtimeInput = document.getElementById('bedtimeInput');
  bedtimeInput.value = rec.bedtime || '';
  bedtimeInput.onchange = () => {
    const liveRec = getDaily(today); // aquí sí que volem crear/persistir de veritat
    liveRec.bedtime = bedtimeInput.value || null;
    liveRec.sonOk = isBedtimeOk(liveRec.bedtime);
    saveState();
    renderAvui();
  };
  renderSleepBar(rec.bedtime);
  renderDotRow('sonWindow', 'sonOk');

  const focusToday = state.focusSessions.filter(s => s.date === today).length;
  document.getElementById('focusTodayCount').textContent = focusToday;
  document.getElementById('focusTodayCountLabel').textContent = focusToday === 1 ? '1 sessió avui' : `${focusToday} sessions avui`;

  renderHabitManager();
  renderRoutineToday();
  renderHorariToday();
}

/* ---------------- Inici (Home) — vista d'estat, no d'acció ---------------- */

const MONTH_NAMES = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];

function formatIniciDate() {
  const now = new Date();
  const weekday = DAY_KEYS[now.getDay()].toUpperCase();
  return `${weekday} · ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`;
}

function renderIniciSnapshot() {
  const today = todayISO();
  const rec = peekDaily(today);
  const habitsDone = state.habits.filter(h => rec[h.key]).length;
  const focusToday = state.focusSessions.filter(s => s.date === today);
  const sleepDone = !!rec.bedtime;

  const stats = [
    { value: `${habitsDone}/${state.habits.length}`, label: 'hàbits' },
    { value: `${focusToday.length}`, label: focusToday.length === 1 ? 'sessió focus' : 'sessions focus' },
    { value: sleepDone ? '✓' : '—', label: 'son registrat' },
  ];

  document.getElementById('iniciSnapshot').innerHTML = stats.map(s => `
    <div class="stat-block">
      <div class="stat-value mono">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('');
}

function renderInici() {
  document.getElementById('iniciDateLine').textContent = formatIniciDate();
  renderIniciSnapshot();
  renderNarrative();

  const today = todayISO();
  const currentWeekKey = mondayOfISO(today);
  renderPillarReadouts(currentWeekKey, null, 'iniciPillarReadouts');

  const currentWeekRec = state.weeks[currentWeekKey];
  const decisionCard = document.getElementById('iniciDecisionCard');
  if (currentWeekRec && currentWeekRec.decision) {
    decisionCard.hidden = false;
    document.getElementById('iniciDecisionText').textContent = `"${currentWeekRec.decision}"`;
  } else {
    decisionCard.hidden = true;
  }
}

/* ---------------- Context: rutina d'avui (Físic) ---------------- */

const DAY_KEYS = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];

function todayDayKey() {
  return DAY_KEYS[new Date().getDay()];
}

function isValidRoutine(obj) {
  return !!(obj && typeof obj === 'object' && obj.rutina && typeof obj.rutina === 'object'
    && DAY_KEYS.some(d => obj.rutina[d]));
}

function renderRoutineToday() {
  const empty = document.getElementById('routineEmpty');
  const today = document.getElementById('routineToday');
  const routine = state.context && state.context.fisic;

  if (!routine) {
    empty.hidden = false;
    today.hidden = true;
    return;
  }
  empty.hidden = true;
  today.hidden = false;

  const dayData = routine.rutina[todayDayKey()];
  const label = dayData ? dayData.etiqueta : 'Descans';
  document.getElementById('routineDayLabel').textContent = label;

  const list = document.getElementById('exerciseList');
  const exercicis = (dayData && dayData.exercicis) || [];
  if (exercicis.length === 0) {
    list.innerHTML = `<li class="routine-rest">Dia de descans a la rutina.</li>`;
  } else {
    list.innerHTML = exercicis.map(ex => `
      <li class="exercise-item">
        <span>${escapeHtml(ex.nom || '—')}</span>
        <span class="ex-detail">${ex.series || '–'}×${ex.repeticions || '–'}${ex.ultimPes ? ' · ' + ex.ultimPes + 'kg' : ''}</span>
      </li>`).join('');
  }

  // El botó reutilitza l'hàbit "entrenament" que ja existeix — no calia
  // cap camp nou per marcar la rutina com a feta.
  const markBtn = document.getElementById('markRoutineDoneBtn');
  const hasEntrenamentHabit = state.habits.some(h => h.key === 'entrenament');
  if (exercicis.length > 0 && hasEntrenamentHabit) {
    markBtn.hidden = false;
    const done = !!peekDaily(todayISO()).entrenament;
    markBtn.textContent = done ? 'Entrenament marcat ✓' : 'Marca "Entrenament" com a fet';
  } else {
    markBtn.hidden = true;
  }
}

document.getElementById('markRoutineDoneBtn')?.addEventListener('click', () => {
  toggleHabit('entrenament');
  renderRoutineToday();
});

document.getElementById('routineFile')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!isValidRoutine(parsed)) {
        alert('Aquest fitxer no té el format esperat (calen "rutina" amb almenys un dia). Revisa l\'exemple.');
        return;
      }
      state.context.fisic = parsed;
      saveState();
      renderRoutineToday();
    } catch (err) {
      alert('El fitxer no és un JSON vàlid.');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
});

document.getElementById('removeRoutineBtn')?.addEventListener('click', () => {
  const ok = confirm('Treure la rutina carregada? (Els entrenaments ja registrats no es toquen.)');
  if (!ok) return;
  state.context.fisic = null;
  saveState();
  renderRoutineToday();
});

/* ---------------- Horari (blocs del dia — més enllà del gimnàs) ---------------- */

function isValidHorari(obj) {
  return !!(obj && typeof obj === 'object' && obj.horari && typeof obj.horari === 'object'
    && DAY_KEYS.some(d => Array.isArray(obj.horari[d])));
}

function renderHorariToday() {
  const empty = document.getElementById('horariEmpty');
  const today = document.getElementById('horariToday');
  const horari = state.horari;

  if (!horari) {
    empty.hidden = false;
    today.hidden = true;
    return;
  }
  empty.hidden = true;
  today.hidden = false;

  const blocks = [...((horari.horari && horari.horari[todayDayKey()]) || [])];

  // El detall dels blocs d'avui ja es mostra a "Línia de temps" (Avui) —
  // aquí només confirmem que s'ha carregat correctament, sense duplicar-lo.
  document.getElementById('horariSummary').textContent = blocks.length === 0
    ? 'Horari carregat — cap bloc avui.'
    : `Horari carregat — ${blocks.length} bloc${blocks.length === 1 ? '' : 's'} avui (a "Línia de temps", dalt).`;
}

document.getElementById('horariFile')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!isValidHorari(parsed)) {
        alert('Aquest fitxer no té el format esperat (cal "horari" amb almenys un dia com a llista de blocs). Revisa l\'exemple.');
        return;
      }
      state.horari = parsed;
      saveState();
      renderAvui();
    } catch (err) {
      alert('El fitxer no és un JSON vàlid.');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
});

document.getElementById('removeHorariBtn')?.addEventListener('click', () => {
  const ok = confirm('Treure l\'horari carregat?');
  if (!ok) return;
  state.horari = null;
  saveState();
  renderAvui();
});

/* ---- Exportar a .ics (calendari real amb notificacions fiables del sistema) ---- */

const ICS_DAY_CODE = { dilluns: 'MO', dimarts: 'TU', dimecres: 'WE', dijous: 'TH', divendres: 'FR', dissabte: 'SA', diumenge: 'SU' };

function nextDateForDayKey(dayKey) {
  const targetIdx = DAY_KEYS.indexOf(dayKey); // coincideix amb Date.getDay(): 0=diumenge..6=dissabte
  const now = new Date();
  const diff = (targetIdx - now.getDay() + 7) % 7;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return d;
}

function icsDateTime(date, hh, mm) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(hh)}${pad(mm)}00`;
}

function escapeICSText(str) {
  return String(str).replace(/([,;])/g, '\\$1');
}

function generateICS() {
  if (!state.horari || !state.horari.horari) return null;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//September Personal OS//CA', 'CALSCALE:GREGORIAN'];
  let n = 0;

  DAY_KEYS.forEach(dayKey => {
    const blocks = state.horari.horari[dayKey] || [];
    blocks.forEach(block => {
      if (!block.hora) return;
      const [h, m] = block.hora.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return;
      const durMin = block.durada || 60;
      const startDate = nextDateForDayKey(dayKey);
      const dtstart = icsDateTime(startDate, h, m);
      const endTotalMin = h * 60 + m + durMin;
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + Math.floor(endTotalMin / 1440));
      const dtend = icsDateTime(endDate, Math.floor((endTotalMin % 1440) / 60), endTotalMin % 60);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:sept-${dayKey}-${n++}@personal-os`);
      lines.push(`DTSTART:${dtstart}`);
      lines.push(`DTEND:${dtend}`);
      lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAY_CODE[dayKey]}`);
      lines.push(`SUMMARY:${escapeICSText(block.nom || 'Bloc')}`);
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

document.getElementById('exportIcsBtn')?.addEventListener('click', () => {
  const ics = generateICS();
  if (!ics) {
    alert('No hi ha horari carregat per exportar.');
    return;
  }
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'september-horari.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

/* ---------------- Context narratiu (Avui) — fets honestos, no correlacions ---------------- */
//
// Deliberadament NO és un motor de correlacions/senyals: amb pocs dies d'ús,
// "detectar patrons" seria inventar-se'ls. Això només diu fets reals ja
// registrats, en frases, perquè es llegeixin d'un cop en obrir l'app.

function renderNarrative() {
  const card = document.getElementById('narrativeCard');
  const list = document.getElementById('narrativeList');
  const lines = [];
  const today = todayISO();
  const yesterday = isoDaysAgo(1);

  // Ahir: resum simple (només si "ahir" ja existeix com a dia complet)
  const yRec = state.daily[yesterday];
  if (yRec) {
    const habitsDone = state.habits.filter(h => yRec[h.key]).length;
    const yFocus = state.focusSessions.filter(s => s.date === yesterday);
    const yMinutes = yFocus.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
    lines.push(`Ahir: ${habitsDone}/${state.habits.length} hàbits completats, ${yFocus.length} sessions de focus (${yMinutes} min).`);
  }

  // Dies sense marcar un hàbit concret (només si són ≥2, per no fer soroll cada dia)
  state.habits.forEach(h => {
    let gap = 0;
    for (let i = 0; i < 30; i++) {
      const rec = state.daily[isoDaysAgo(i)];
      if (rec && rec[h.key]) break;
      gap++;
    }
    if (gap >= 2 && gap < 30) {
      lines.push(`Fa ${gap} dies que no marques "${h.name}".`);
    }
  });

  // Motiu d'interrupció més freqüent (només amb prou mostra per no ser soroll)
  const reasonCounts = {};
  let reasonTotal = 0;
  state.focusSessions.forEach(s => (s.interruptionReasons || []).forEach(r => {
    reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    reasonTotal++;
  }));
  if (reasonTotal >= 3) {
    const top = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
    lines.push(`El motiu d'interrupció més freqüent fins ara: ${REASON_LABEL[top[0]] || top[0]} (${top[1]} de ${reasonTotal}).`);
  }

  // Decisió de la setmana en curs, si n'hi ha una guardada
  const currentWeekKey = mondayOfISO(today);
  const currentWeekRec = state.weeks[currentWeekKey];
  if (currentWeekRec && currentWeekRec.decision) {
    lines.push(`Decisió d'aquesta setmana: "${currentWeekRec.decision}".`);
  }

  if (lines.length === 0) {
    card.hidden = true;
    return;
  }
  card.hidden = false;
  list.innerHTML = lines.map(l => `<li>${escapeHtml(l)}</li>`).join('');
}

// Barra visual 21:00–03:00 amb la franja objectiu (23:30–00:30) marcada,
// i un punt a on cau l'hora real d'anar a dormir.
function renderSleepBar(bedtime) {
  const marker = document.getElementById('sleepBarMarker');
  const target = document.getElementById('sleepBarTarget');
  const RANGE_START = 21 * 60;   // 21:00
  const RANGE_END = 27 * 60;     // 03:00 (del dia següent, expressat com a +24h)

  const toRangeMinutes = (t) => {
    const mins = toMinutes(t);
    return mins < RANGE_START ? mins + 24 * 60 : mins; // si és matinada, sumem 24h perquè quedi després de les 21:00
  };
  const pct = (mins) => Math.min(100, Math.max(0, ((mins - RANGE_START) / (RANGE_END - RANGE_START)) * 100));

  const targetStart = pct(toRangeMinutes(BEDTIME_WINDOW_START));
  const targetEnd = pct(toRangeMinutes('24:30')); // 00:30 expressat en el mateix eix +24h
  target.style.left = `${targetStart}%`;
  target.style.width = `${targetEnd - targetStart}%`;

  if (bedtime) {
    marker.hidden = false;
    marker.style.left = `${pct(toRangeMinutes(bedtime))}%`;
    marker.classList.toggle('sleep-bar-marker-ok', isBedtimeOk(bedtime));
  } else {
    marker.hidden = true;
  }
}


function renderHabitManager() {
  const ul = document.getElementById('habitManageList');
  if (state.habits.length === 0) {
    ul.innerHTML = `<li class="manage-empty">Cap hàbit configurat encara.</li>`;
  } else {
    ul.innerHTML = state.habits.map(h => `
      <li class="manage-item">
        <span>${escapeHtml(h.name)}</span>
        <span class="manage-item-controls">
          <input type="time" class="habit-time-input" data-habit-time="${h.key}" value="${h.time || ''}" title="Hora opcional" aria-label="Hora opcional per a ${escapeHtml(h.name)}">
          <button class="remove-btn" data-remove="${h.key}" aria-label="Eliminar ${escapeHtml(h.name)}">✕</button>
        </span>
      </li>`).join('');
  }
  ul.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeHabit(btn.dataset.remove));
  });
  ul.querySelectorAll('[data-habit-time]').forEach(input => {
    input.addEventListener('change', () => {
      const habit = state.habits.find(h => h.key === input.dataset.habitTime);
      if (!habit) return;
      habit.time = input.value || null;
      saveState();
      renderAvui();
    });
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
  const timeInput = document.getElementById('newHabitTime');
  const name = input.value.trim();
  if (!name) return;
  state.habits.push({ key: makeHabitKey(name), name, time: timeInput.value || null });
  saveState();
  input.value = '';
  timeInput.value = '';
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
  interruptionReasons: [],
  intervalId: null,
};

function renderFocus() {
  const hasActive = focusTimer.running || focusTimer.pendingLog;
  document.getElementById('focusSetup').hidden = hasActive;
  document.getElementById('focusRunning').hidden = !focusTimer.running;
  document.getElementById('focusLog').hidden = !focusTimer.pendingLog;

  renderSubjectSummary();
  renderReasonSummary();
  renderFocusHistory();
}

const DIFFICULTY_LABEL = { easy: 'Fàcil', normal: 'Normal', hard: 'Difícil' };
const COMPREHENSION_DOT = { green: '🟢', yellow: '🟡', red: '🔴' };
const REASON_LABEL = { mobil: 'Mòbil', soroll: 'Soroll', cansament: 'Cansament', tasca_poc_clara: 'Tasca poc clara', altra: 'Altra' };

function renderReasonSummary() {
  const ul = document.getElementById('reasonSummary');
  const counts = {};
  let total = 0;
  state.focusSessions.forEach(s => {
    (s.interruptionReasons || []).forEach(r => {
      counts[r] = (counts[r] || 0) + 1;
      total++;
    });
  });
  if (total === 0) {
    ul.innerHTML = `<li class="history-empty">Encara no hi ha motius registrats — apareixen quan tapes un motiu just després de prémer "he perdut el focus".</li>`;
    return;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  ul.innerHTML = entries.map(([reason, count]) => `
    <li class="history-item">
      <div class="h-top"><span>${REASON_LABEL[reason] || reason}</span><span>${count} · ${Math.round((count / total) * 100)}%</span></div>
    </li>`).join('');
}

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
    interruptionReasons: [],
    startedAt: Date.now(),
    intervalId: null,
    pendingLog: false,
  };

  document.getElementById('focusRunningSubject').textContent = subject || 'Sessió de focus';
  document.getElementById('focusRunningObjective').textContent = objective || '';
  document.getElementById('interruptionCount').textContent = '(0)';
  document.getElementById('reasonChips').hidden = true;
  document.querySelectorAll('#reasonChips .chip').forEach(c => c.classList.remove('chip-tapped'));
  updateTimerDisplay();

  focusTimer.intervalId = setInterval(tickFocus, 1000);
  renderFocus();
});

document.getElementById('quickStart2Btn')?.addEventListener('click', () => {
  // "Només 2 minuts": cap decisió prèvia, comença ja. Reutilitza el mateix
  // flux/validació que el botó normal — només fixem la durada abans.
  document.getElementById('focusDuration').value = '2';
  document.getElementById('startFocusBtn').click();
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

const TIMER_RING_CIRCUMFERENCE = 2 * Math.PI * 54;

function updateTimerDisplay() {
  const m = Math.floor(focusTimer.remainingSeconds / 60);
  const s = focusTimer.remainingSeconds % 60;
  document.getElementById('timerDisplay').textContent = `${pad(m)}:${pad(s)}`;

  const totalSeconds = focusTimer.plannedMinutes * 60;
  const fraction = totalSeconds > 0 ? Math.max(0, Math.min(1, focusTimer.remainingSeconds / totalSeconds)) : 0;
  const ring = document.getElementById('timerRingProgress');
  if (ring) {
    ring.style.strokeDasharray = `${TIMER_RING_CIRCUMFERENCE}`;
    ring.style.strokeDashoffset = `${TIMER_RING_CIRCUMFERENCE * (1 - fraction)}`;
  }
}

document.getElementById('lostFocusBtn')?.addEventListener('click', () => {
  focusTimer.interruptions++;
  document.getElementById('interruptionCount').textContent = `(${focusTimer.interruptions})`;
  document.getElementById('reasonChips').hidden = false;
});

document.querySelectorAll('#reasonChips .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    focusTimer.interruptionReasons.push(chip.dataset.reason);
    chip.classList.add('chip-tapped');
    setTimeout(() => chip.classList.remove('chip-tapped'), 400);
  });
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
  document.getElementById('logMinutesDisplay').textContent = elapsedMinutes;
  document.getElementById('logMinutes').hidden = true;
  document.getElementById('editMinutesToggle').textContent = 'editar';
  document.getElementById('logInterruptions').value = focusTimer.interruptions;
  setSegmented('completedSeg', completedByTimer ? 'true' : null);
  setSegmented('comprehensionSeg', null);
  setSegmented('difficultySeg', null);

  renderFocus();
}

document.getElementById('editMinutesToggle')?.addEventListener('click', (e) => {
  const input = document.getElementById('logMinutes');
  const showing = input.hidden;
  input.hidden = !showing;
  e.target.textContent = showing ? 'fet' : 'editar';
  if (showing) input.focus();
});

document.getElementById('logMinutes')?.addEventListener('input', (e) => {
  document.getElementById('logMinutesDisplay').textContent = e.target.value || '0';
});

function setSegmented(containerId, selectedVal) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.seg-btn').forEach(b => {
    b.classList.toggle('selected', selectedVal !== null && b.dataset.val === selectedVal);
  });
}

document.querySelectorAll('#completedSeg .seg-btn, #comprehensionSeg .seg-btn, #difficultySeg .seg-btn, #decisionOutcomeSeg .seg-btn').forEach(btn => {
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
    interruptionReasons: [...focusTimer.interruptionReasons],
  });
  saveState();

  focusTimer = { running: false, paused: false, remainingSeconds: 0, plannedMinutes: 0, subject: '', objective: '', interruptions: 0, interruptionReasons: [], intervalId: null, pendingLog: false };
  document.getElementById('focusSubject').value = '';
  document.getElementById('focusObjective').value = '';
  document.getElementById('focusDuration').value = '';
  document.getElementById('reasonChips').hidden = true;

  showScreen('avui');
});

/* ---------------- SETMANA ---------------- */

function blankWeekRecord() {
  return {
    weight: null,
    social: null,
    comms: { newPeople: null, spokeUp: null },
    phoneUsage: null,
    decision: '',            // el que decideixes fer diferent la setmana vinent
    decisionOutcome: null,   // 'kept' | 'modified' | 'dropped' — com ha anat la decisió de la setmana ANTERIOR
    notes: '',
  };
}

function findPreviousDecision(weekKey) {
  const priorKeys = Object.keys(state.weeks)
    .filter(k => k < weekKey && state.weeks[k].decision)
    .sort()
    .reverse();
  return priorKeys.length ? state.weeks[priorKeys[0]].decision : null;
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

/* ---- Lectures derivades dels pilars (a partir de dades ja registrades, no de sliders) ---- */

function weekDateRange(weekKey) {
  const start = new Date(weekKey + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: weekKey, end: toISODate(end) };
}

function focusStatsForWeek(weekKey) {
  const { start, end } = weekDateRange(weekKey);
  const sessions = state.focusSessions.filter(s => s.date >= start && s.date <= end);
  const minutes = sessions.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
  return { count: sessions.length, minutes };
}

function habitConsistencyByKey(key) {
  if (!state.habits.some(h => h.key === key)) return null;
  return consistencyWindow(key);
}

function averageHabitsConsistency() {
  if (state.habits.length === 0) return null;
  const total = state.habits.reduce((sum, h) => sum + consistencyWindow(h.key), 0);
  return total / state.habits.length;
}

function weightTrendFor(weekKey, liveWeight) {
  if (!liveWeight) return null;
  const priorKeys = Object.keys(state.weeks)
    .filter(k => k < weekKey && state.weeks[k].weight != null)
    .sort()
    .reverse();
  if (priorKeys.length === 0) return null;
  const priorWeight = state.weeks[priorKeys[0]].weight;
  const diff = liveWeight - priorWeight;
  if (diff > 0.2) return 'up';
  if (diff < -0.2) return 'down';
  return 'flat';
}

function renderPillarReadouts(weekKey, liveWeight, containerId) {
  const container = document.getElementById(containerId || 'pillarReadouts');
  const trendArrow = { up: '↑', down: '↓', flat: '→' };

  const entrenamentCount = habitConsistencyByKey('entrenament');
  const trend = weightTrendFor(weekKey, liveWeight);
  const avgHabits = averageHabitsConsistency();
  const focusStats = focusStatsForWeek(weekKey);

  const items = [
    {
      label: 'Físic',
      value: entrenamentCount !== null
        ? `Entrenaments ${entrenamentCount}/7${trend ? ' · pes ' + trendArrow[trend] : ''}`
        : (trend ? `Pes ${trendArrow[trend]}` : '—'),
    },
    {
      label: 'Fortalesa',
      value: avgHabits !== null ? `Consistència hàbits ${avgHabits.toFixed(1)}/7` : '—',
    },
    {
      label: 'Coneixement',
      value: `${focusStats.count} sessions · ${focusStats.minutes} min`,
    },
  ];

  container.innerHTML = items.map(it => `
    <div class="readout-item">
      <div class="readout-label">${it.label}</div>
      <div class="readout-value mono">${it.value}</div>
    </div>`).join('');
}

function renderSetmana() {
  const weekKey = mondayOfISO(todayISO());
  const rec = peekWeekRecord(weekKey); // només per mostrar — no crea res fins que es prem "Guardar"
  document.getElementById('weekLabel').textContent = `Setmana del ${fmtDateShort(weekKey)}`;

  document.getElementById('weightInput').value = rec.weight ?? '';
  document.getElementById('socialInput').value = rec.social ?? '';
  document.getElementById('commsNewPeople').value = (rec.comms && rec.comms.newPeople) ?? '';
  document.getElementById('commsSpokeUp').value = (rec.comms && rec.comms.spokeUp) ?? '';
  document.getElementById('nextDecision').value = rec.decision ?? '';
  document.getElementById('weekNotes').value = rec.notes ?? '';
  setSegmented('phoneUsageSeg', rec.phoneUsage || null);

  const previousDecision = findPreviousDecision(weekKey);
  const reviewCard = document.getElementById('decisionReviewCard');
  if (previousDecision) {
    reviewCard.hidden = false;
    document.getElementById('previousDecisionText').textContent = `"${previousDecision}"`;
    setSegmented('decisionOutcomeSeg', rec.decisionOutcome || null);
  } else {
    reviewCard.hidden = true;
  }

  const weightInput = document.getElementById('weightInput');
  renderPillarReadouts(weekKey, parseFloat(weightInput.value) || null);
  weightInput.oninput = () => renderPillarReadouts(weekKey, parseFloat(weightInput.value) || null);

  renderDotRow('auraGroomingDots', 'cura');

  renderWeekHistory(weekKey);
}

function renderWeekHistory(currentWeekKey) {
  const ul = document.getElementById('weekHistory');
  const keys = Object.keys(state.weeks).filter(k => k !== currentWeekKey).sort().reverse();
  if (keys.length === 0) {
    ul.innerHTML = `<li class="history-empty">Encara no hi ha setmanes anteriors.</li>`;
    return;
  }
  const outcomeLabel = { kept: 'mantinguda', modified: 'modificada', dropped: 'eliminada' };
  ul.innerHTML = keys.map(k => {
    const w = state.weeks[k];
    const parts = [];
    if (w.weight) parts.push(`${w.weight} kg`);
    if (w.comms) parts.push(`${w.comms.newPeople ?? 0} pers. noves`);
    if (w.social != null) parts.push(`${w.social} interaccions`);
    if (w.phoneUsage) parts.push(`mòbil: ${w.phoneUsage}`);
    if (w.decisionOutcome) parts.push(`decisió anterior: ${outcomeLabel[w.decisionOutcome]}`);
    const decisionLine = w.decision ? `<div class="h-main" style="margin-top:4px;">→ ${escapeHtml(w.decision)}</div>` : '';
    return `
      <li class="history-item">
        <div class="h-top"><span>Setmana ${fmtDateShort(k)}</span></div>
        <div class="h-main mono">${parts.length ? parts.join(' · ') : '—'}</div>
        ${decisionLine}
      </li>`;
  }).join('');
}

document.querySelectorAll('#phoneUsageSeg .seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#phoneUsageSeg .seg-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

document.getElementById('saveWeekBtn')?.addEventListener('click', () => {
  const weekKey = mondayOfISO(todayISO());
  const rec = getWeekRecord(weekKey);

  rec.weight = parseFloat(document.getElementById('weightInput').value) || null;
  rec.social = parseInt(document.getElementById('socialInput').value, 10) || 0;
  rec.comms = rec.comms || { newPeople: null, spokeUp: null };
  rec.comms.newPeople = parseInt(document.getElementById('commsNewPeople').value, 10) || 0;
  rec.comms.spokeUp = parseInt(document.getElementById('commsSpokeUp').value, 10) || 0;
  const phoneBtn = document.querySelector('#phoneUsageSeg .seg-btn.selected');
  rec.phoneUsage = phoneBtn ? phoneBtn.dataset.val : null;
  rec.decision = document.getElementById('nextDecision').value.trim();
  const outcomeBtn = document.querySelector('#decisionOutcomeSeg .seg-btn.selected');
  rec.decisionOutcome = outcomeBtn ? outcomeBtn.dataset.val : null;
  rec.notes = document.getElementById('weekNotes').value;

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
  renderInici();
});
