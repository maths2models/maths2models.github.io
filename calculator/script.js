/**
 * Advanced CGPA Calculator Logic
 * Handles state, formula calculations, UI updates, and exports.
 */

// --- CONFIGURATION ---
const MAX_COURSES = 4;

const COURSES = {
  "Math1": { level: "Foundation", title: "Mathematics for Data Science 1", type: "foundation", maxBonus: 5, credits: 4 },
  "Math2": { level: "Foundation", title: "Mathematics for Data Science 2", type: "foundation", maxBonus: 6, credits: 4 },
  "Stats1": { level: "Foundation", title: "Statistics for Data Science 1", type: "foundation", maxBonus: 5, credits: 4 },
  "Stats2": { level: "Foundation", title: "Statistics for Data Science 2", type: "foundation", maxBonus: 5, credits: 4 },
  "English1": { level: "Foundation", title: "English 1", type: "foundation", maxBonus: 5, credits: 4 },
  "English2": { level: "Foundation", title: "English 2", type: "foundation", maxBonus: 5, credits: 4 },
  "CT": { level: "Foundation", title: "Computational Thinking", type: "foundation", maxBonus: 5, credits: 4 },
  "Python": { level: "Foundation", title: "Intro to Python Programming", type: "python", maxBonus: 5, credits: 4 },
  
  "MLF": { level: "Diploma", title: "Machine Learning Foundations", type: "mlf", maxBonus: 5, credits: 4 },
  "MLT": { level: "Diploma", title: "Machine Learning Techniques", type: "mlf", maxBonus: 5, credits: 4 },
  "MLP": { level: "Diploma", title: "Machine Learning Practice", type: "mlp", maxBonus: 5, credits: 4 },
  "BDM": { level: "Diploma", title: "Business Data Management", type: "bdm", maxBonus: 5, credits: 4 },
  "BA": { level: "Diploma", title: "Business Analytics", type: "ba", maxBonus: 5, credits: 4 },
  "TDS": { level: "Diploma", title: "Tools in Data Science", type: "tds", maxBonus: 5, credits: 4 },
  "PDSA": { level: "Diploma", title: "PDSA (Python DSA)", type: "pdsa", maxBonus: 5, credits: 4 },
  "DBMS": { level: "Diploma", title: "DBMS", type: "dbms", maxBonus: 5, credits: 4 },
  "AppDev1": { level: "Diploma", title: "Application Development 1", type: "appdev", maxBonus: 5, credits: 4 },
  "AppDev2": { level: "Diploma", title: "Application Development 2", type: "appdev", maxBonus: 5, credits: 4 },
  "Java": { level: "Diploma", title: "Programming Concepts using Java", type: "java", maxBonus: 5, credits: 4 },
  "SysCmd": { level: "Diploma", title: "System Commands", type: "syscmd", maxBonus: 5, credits: 4 },
  "DeepLearning": { level: "Diploma", title: "Intro to DL and Gen AI", type: "dl", maxBonus: 5, credits: 4 }
};

const INPUT_CONFIG = {
  "foundation": ["Q1", "Q2", "F", "Bonus"],
  "python": ["Q1", "OPPE1", "OPPE2", "F", "Bonus"],
  "mlf": ["GAA", "Q1", "Q2", "F", "Bonus"],
  "mlp": ["GAA", "OPPE1", "OPPE2", "KA", "F", "Bonus"],
  "bdm": ["GA", "Q1", "Q2", "F", "Bonus"],
  "ba": ["Q1", "Q2", "Assignment", "F", "Bonus"],
  "tds": ["GAA", "ROE", "P1", "P2", "F", "Bonus"],
  "pdsa": ["GAA", "OPPE", "Q1", "Q2", "F", "Bonus"],
  "dbms": ["GAA2", "GAA3", "OPPE", "Q1", "Q2", "F", "Bonus"],
  "appdev": ["GLA", "Q1", "Q2", "F", "Bonus"],
  "java": ["GAA", "Q1", "Q2", "OPPE1", "OPPE2", "F", "Bonus"],
  "syscmd": ["BPT", "OPPE", "Q1", "F", "Bonus"],
  "dl": ["GAA", "Q1", "Q2", "NPPE1", "NPPE2", "F", "Bonus"]
};

// --- STATE MANAGEMENT ---
let state = {
  level: "Foundation",
  prevCGPA: 0,
  prevCredits: 0,
  courses: {} // { "Math1": { Q1: 100, F: 90, ... } }
};

// --- CORE LOGIC ---
function calculateCourse(id, vals) {
  const c = COURSES[id];
  const get = (k) => parseFloat(vals[k]) || 0;
  
  let T = 0;
  let passed = true;
  
  const Q1 = get("Q1"), Q2 = get("Q2"), F = get("F"), Bonus = get("Bonus");
  
  switch(c.type) {
    case 'foundation':
      T = Math.max(0.6*F + 0.3*Math.max(Q1,Q2), 0.45*F + 0.25*Q1 + 0.3*Q2);
      if (T >= 40) T += Bonus;
      break;
    case 'python':
      const PE1 = get("OPPE1"), PE2 = get("OPPE2");
      T = 0.15*Q1 + 0.4*F + 0.25*Math.max(PE1,PE2) + 0.2*Math.min(PE1,PE2);
      if (T >= 40) T += Bonus;
      break;
    case 'mlf':
    case 'appdev':
      const A1 = c.type === 'mlf' ? get("GAA") : get("GLA");
      T = 0.05*A1 + Math.max(0.6*F + 0.25*Math.max(Q1,Q2), 0.4*F + 0.25*Q1 + 0.3*Q2);
      if (T >= 40) T += Bonus;
      break;
    case 'mlp':
      T = 0.1*get("GAA") + 0.3*F + 0.2*get("OPPE1") + 0.2*get("OPPE2") + 0.2*get("KA");
      if (T >= 40) T += Bonus;
      break;
    case 'bdm':
      // Scaled to assume inputs are out of 100
      T = 0.1*get("GA") + 0.2*Q1 + 0.2*Q2 + 0.5*F;
      break;
    case 'ba':
      // Scaled to assume inputs are out of 100
      const Qz = 0.4 * (0.7*Math.max(Q1,Q2) + 0.3*Math.min(Q1,Q2));
      T = Qz + 0.2*get("Assignment") + 0.4*F;
      if (T >= 40) T += Bonus;
      passed = (F >= 25); // Original pass condition F >= 10 out of 40 => 25% out of 100
      break;
    case 'tds':
      T = 0.2*get("GAA") + 0.2*get("ROE") + 0.2*get("P1") + 0.2*get("P2") + 0.2*F;
      if (T >= 40) T += Bonus;
      break;
    case 'pdsa':
      T = 0.05*get("GAA") + 0.2*get("OPPE") + 0.45*F + Math.max(0.2*Math.max(Q1,Q2), 0.1*Q1 + 0.2*Q2);
      if (T >= 40) T += Bonus;
      break;
    case 'dbms':
      T = 0.03*get("GAA2") + 0.02*get("GAA3") + 0.2*get("OPPE") + 0.45*F + Math.max(0.2*Math.max(Q1,Q2), 0.1*Q1 + 0.2*Q2);
      if (T >= 40) T += Bonus;
      break;
    case 'java':
      const JPE1 = get("OPPE1"), JPE2 = get("OPPE2");
      T = 0.05*get("GAA") + 0.2*Math.max(JPE1,JPE2) + 0.45*F + Math.max(0.2*Math.max(Q1,Q2), 0.1*Q1 + 0.2*Q2) + 0.1*Math.min(JPE1,JPE2);
      if (T >= 40) T += Bonus;
      break;
    case 'syscmd':
      // Placeholder SC logic
      T = 0.1*get("BPT") + 0.3*get("OPPE") + 0.25*Q1 + 0.35*F;
      if (T >= 40) T += Bonus;
      break;
    case 'dl':
      T = 0.1*get("GAA") + 0.2*Q1 + 0.2*Q2 + 0.25*F + 0.1*get("NPPE1") + 0.15*get("NPPE2");
      break;
  }
  
  T = Math.min(100, Math.max(0, T));
  T = Math.round(T);
  
  let grade = 'U', points = 0;
  if (passed && T >= 40) {
    if (T >= 90) { grade = 'S'; points = 10; }
    else if (T >= 80) { grade = 'A'; points = 9; }
    else if (T >= 70) { grade = 'B'; points = 8; }
    else if (T >= 60) { grade = 'C'; points = 7; }
    else if (T >= 50) { grade = 'D'; points = 6; }
    else if (T >= 40) { grade = 'E'; points = 5; }
  }
  
  return { T, grade, points, passed };
}

function computeGlobals() {
  let termPoints = 0, termCredits = 0, passedCount = 0, failedCount = 0;
  
  Object.keys(state.courses).forEach(id => {
    const res = calculateCourse(id, state.courses[id]);
    termCredits += COURSES[id].credits;
    termPoints += res.points * COURSES[id].credits;
    if (res.points > 0) passedCount++;
    else failedCount++;
  });
  
  const sgpa = termCredits > 0 ? (termPoints / termCredits) : 0;
  
  const totalCredits = state.prevCredits + termCredits;
  const cgpa = totalCredits > 0 ? ((state.prevCGPA * state.prevCredits) + termPoints) / totalCredits : 0;
  
  return { sgpa, cgpa, termCredits, totalCredits, passedCount, failedCount };
}

// --- UI UPDATES ---
function renderUI() {
  // Update Header Count
  const courseCount = Object.keys(state.courses).length;
  document.getElementById('course-counter').textContent = `${courseCount} / ${MAX_COURSES}`;
  
  // Render Checkboxes
  const cList = document.getElementById('course-list');
  cList.innerHTML = '';
  Object.keys(COURSES).forEach(id => {
    const c = COURSES[id];
    if (c.level !== state.level) return;
    const isChecked = !!state.courses[id];
    const isDisabled = !isChecked && courseCount >= MAX_COURSES;
    
    cList.innerHTML += `
      <label class="course-checkbox">
        <input type="checkbox" value="${id}" onchange="toggleCourse('${id}')" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
        <span style="font-size:0.875rem; font-weight:500; ${isDisabled ? 'opacity:0.5;' : ''}">${c.title}</span>
      </label>
    `;
  });

  // Render Workspace
  const workspace = document.getElementById('active-courses');
  if (courseCount === 0) {
    workspace.innerHTML = `
      <div class="workspace-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:1rem; color:var(--c-text-muted);"><use href="/assets/svg/sprite.svg#icon-document-text"></use></svg>
        <h3>No Courses Selected</h3>
        <p style="font-size:0.875rem;">Select up to 4 courses from the sidebar to begin.</p>
      </div>`;
  } else {
    workspace.innerHTML = Object.keys(state.courses).map(id => {
      const c = COURSES[id];
      const res = calculateCourse(id, state.courses[id]);
      const inputsHTML = INPUT_CONFIG[c.type].map(field => {
        const val = state.courses[id][field] || '';
        const max = field === "Bonus" ? c.maxBonus : 100;
        return `
          <div class="input-group" style="margin-bottom:0;">
            <label class="input-label">${field} (Max ${max})</label>
            <input type="number" class="input-field" min="0" max="${max}" step="1" value="${val}" data-id="${id}" data-field="${field}" onkeydown="if(event.key.length === 1 && !/[0-9.]/.test(event.key)) event.preventDefault()" oninput="handleInput(this)">
          </div>
        `;
      }).join('');
      
      return `
        <div class="course-card glass glass-panel">
          <div class="course-card-header">
            <div>
              <h3 class="course-card-title">${c.title}</h3>
              <span class="course-card-level">${c.level} • ${c.credits} Credits</span>
            </div>
            <button class="btn btn-icon" onclick="toggleCourse('${id}')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="/assets/svg/sprite.svg#icon-close"></use></svg>
            </button>
          </div>
          <div class="marks-grid">${inputsHTML}</div>
          <div class="result-row">
            <div style="color:var(--c-text-secondary); font-size:0.875rem;">
              Total Score (T): <strong id="res-t-${id}" style="color:var(--c-text-primary); font-size:1.125rem;">${res.T}</strong>
              <div id="res-fail-${id}">
                ${!res.passed && res.T >= 40 ? '<span style="color:#f87171; display:block; font-size:0.75rem; margin-top:0.25rem;">Failed conditional requirement (F < 25)</span>' : ''}
              </div>
            </div>
            <div id="res-grade-${id}" class="badge grade-${res.grade}">Grade: ${res.grade} (${res.points} pts)</div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  renderCalculations();
}

function renderCalculations() {
  // Update Course Specific Results
  Object.keys(state.courses).forEach(id => {
    const res = calculateCourse(id, state.courses[id]);
    
    const elT = document.getElementById(`res-t-${id}`);
    const elFail = document.getElementById(`res-fail-${id}`);
    const elGrade = document.getElementById(`res-grade-${id}`);
    
    if (elT) elT.textContent = res.T;
    if (elFail) {
      elFail.innerHTML = !res.passed && res.T >= 40 ? '<span style="color:#f87171; display:block; font-size:0.75rem; margin-top:0.25rem;">Failed conditional requirement (F < 25)</span>' : '';
    }
    if (elGrade) {
      elGrade.className = `badge grade-${res.grade}`;
      elGrade.textContent = `Grade: ${res.grade} (${res.points} pts)`;
    }
  });

  // Render Summary
  const globals = computeGlobals();
  document.getElementById('res-cgpa').textContent = globals.cgpa.toFixed(2);
  document.getElementById('res-sgpa').textContent = globals.sgpa.toFixed(2);
  document.getElementById('res-term-credits').textContent = globals.termCredits;
  document.getElementById('res-total-credits').textContent = globals.totalCredits;
  document.getElementById('res-passed').textContent = globals.passedCount;
  document.getElementById('res-failed').textContent = globals.failedCount;
  
  saveState();
}

// --- EVENT HANDLERS ---
function toggleCourse(id) {
  if (state.courses[id]) {
    delete state.courses[id];
  } else {
    if (Object.keys(state.courses).length >= MAX_COURSES) {
      showToast('Maximum 4 courses allowed.', 'error');
      return;
    }
    state.courses[id] = {};
  }
  renderUI();
}

function handleInput(el) {
  const id = el.dataset.id;
  const field = el.dataset.field;
  let val = parseFloat(el.value);
  
  if (isNaN(val)) {
    delete state.courses[id][field];
  } else {
    const max = field === "Bonus" ? COURSES[id].maxBonus : 100;
    if (val < 0) val = 0;
    if (val > max) {
      val = max;
      el.value = max;
      showToast(`${field} cannot exceed ${max}`, 'error');
    }
    state.courses[id][field] = val;
  }
  renderCalculations();
}

function handleGlobalInput(e) {
  const id = e.target.id;
  let rawVal = e.target.value;
  
  if (id === 'prev-cgpa') {
    rawVal = rawVal.replace(/[^0-9.]/g, '');
    const parts = rawVal.split('.');
    if (parts.length > 2) rawVal = parts[0] + '.' + parts.slice(1).join('');
    if (rawVal !== e.target.value) e.target.value = rawVal;
    
    let val = parseFloat(rawVal);
    if (isNaN(val)) val = 0;
    if (val > 10) { val = 10; e.target.value = 10; }
    state.prevCGPA = val;
  } else {
    rawVal = rawVal.replace(/[^0-9]/g, '');
    if (rawVal !== e.target.value) e.target.value = rawVal;
    
    let val = parseInt(rawVal);
    if (isNaN(val)) val = 0;
    state.prevCredits = val;
  }
  renderCalculations();
}

// --- TOAST NOTIFICATIONS ---
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="/assets/svg/sprite.svg#${type === 'error' ? 'icon-error' : 'icon-success'}"></use></svg>
    <span style="font-size:0.875rem; font-weight:500;">${msg}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}



function exportJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const el = document.createElement('a');
  el.setAttribute("href", dataStr);
  el.setAttribute("download", "cgpa-calculator-export.json");
  el.click();
  showToast('JSON Exported Successfully!');
}

function exportPDF() {
  window.print();
}

// --- PERSISTENCE ---
function saveState() {
  localStorage.setItem('m2m-calc-state', JSON.stringify(state));
  const encoded = btoa(JSON.stringify(state));
  window.history.replaceState(null, null, `#${encoded}`);
}

function loadState() {
  try {
    // 1. Try URL Hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      state = JSON.parse(atob(hash));
      return;
    }
    // 2. Try LocalStorage
    const stored = localStorage.getItem('m2m-calc-state');
    if (stored) {
      state = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }
}

// --- INIT ---
function init() {
  // Load & Render
  loadState();
  if (state.level === 'Diploma') {
    document.getElementById('level-diploma').checked = true;
  } else {
    document.getElementById('level-foundation').checked = true;
  }
  
  document.querySelectorAll('input[name="course-level"]').forEach(el => {
    el.addEventListener('change', (e) => {
      if (state.level !== e.target.value) {
        if (Object.keys(state.courses).length > 0) {
          showToast(`Switched to ${e.target.value}. Courses cleared.`, 'success');
        }
        state.level = e.target.value;
        state.courses = {};
        renderUI();
      }
    });
  });

  // Attach Global Listeners
  const prevCgpaInput = document.getElementById('prev-cgpa');
  const prevCreditsInput = document.getElementById('prev-credits');

  prevCgpaInput.addEventListener('input', handleGlobalInput);
  prevCgpaInput.addEventListener('keydown', (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  });

  prevCreditsInput.addEventListener('input', handleGlobalInput);
  prevCreditsInput.addEventListener('keydown', (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
  });
  
  document.getElementById('btn-export-json').addEventListener('click', exportJSON);
  document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);
  document.getElementById('btn-reset').addEventListener('click', () => {
    state.courses = {};
    state.prevCGPA = 0;
    state.prevCredits = 0;
    document.getElementById('prev-cgpa').value = 0;
    document.getElementById('prev-credits').value = 0;
    window.location.hash = '';
    renderUI();
    showToast('Calculator Reset');
  });

  document.getElementById('prev-cgpa').value = state.prevCGPA || 0;
  document.getElementById('prev-credits').value = state.prevCredits || 0;
  renderUI();
}

document.addEventListener('DOMContentLoaded', init);
