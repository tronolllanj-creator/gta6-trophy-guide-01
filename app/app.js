import { showDetail, showRoadmap, applySpoilerMask } from './detail.js';
const STORAGE_KEY = 'gta6-trophy-guide-01-progress-v1';
let trophies = [];
let roadmapData = null;
const earned = new Set();
let spoilerOn = false;
let currentView = 'checklist';
let currentTrophy = 0;
const $ = (id) => document.getElementById(id.startsWith('#') ? id.slice(1) : id);

async function loadData() {
  const [trophyRes, roadmapRes] = await Promise.all([
    fetch('data/trophies.json'),
    fetch('data/roadmap.json')
  ]);
  const trophyData = await trophyRes.json();
  const roadmapParsed = await roadmapRes.json();
  trophies = trophyData.trophies;
  roadmapData = roadmapParsed.roadmap;
}

function loadProgress() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    parsed.earned?.forEach(name => earned.add(name));
    spoilerOn = !!parsed.spoiler;
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: Array.from(earned),
    spoiler: spoilerOn
  }));
}

function toggleEarned(name, on) {
  if (on) earned.add(name); else earned.delete(name);
  saveProgress();
  renderProgress();
  renderList();
}

function renderProgress() {
  const total = trophies.length;
  const count = earned.size;
  $('#progress').textContent = `${count} of ${total} earned`;
  const pct = total ? (count / total) * 100 : 0;
const fill = document.querySelector('#progressBar .fill'); if (fill) fill.style.width = `${pct}%`;
}

function renderList() {
  const q = $('#search').value.toLowerCase();
  const kindFilter = $('#kind').value;
  const gradeFilter = $('#grade').value;
  const hide = $('#hideEarned').checked;
  $('#list').innerHTML = '';
  trophies.forEach((t, idx) => {
    if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q) && !t.guide.toLowerCase().includes(q)) return;
    if (kindFilter !== 'all') {
      if (kindFilter === 'missable' && !t.missable) return;
      if (kindFilter === 'online') return;
    if (kindFilter !== 'missable' && t.kind !== kindFilter) return;
    }
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return;
    const isEarned = earned.has(t.name);
    if (hide && isEarned) return;
    const card = document.createElement('article');
    card.className = 'trophy';
    card.innerHTML = `
      <span class="badge grade-${t.grade.toLowerCase()}">${t.grade}</span>
      <h3>${applySpoilerMask(t.name, t.description, t.hidden, isEarned, spoilerOn).name}</h3>
      <p>${applySpoilerMask(t.name, t.description, t.hidden, isEarned, spoilerOn).description}</p>
      <div class="chips">
        <span class="chip">${t.kind}</span>
        ${t.missable ? '<span class="chip missable">Missable</span>' : ''}
      </div>
      <div class="guide">${t.guide}</div>
      ${t.steps && t.steps.length ? '<ol>' + t.steps.map(s => `<li>${s}</li>`).join('') + '</ol>' : ''}
      <div class="source">Source: ${t.source}</div>
      <label class="earned-wrap"><input type="checkbox" ${isEarned ? 'checked' : ''}> Earned</label>
    `;
    card.querySelector('input').addEventListener('change', e => toggleEarned(t.name, e.target.checked));
    card.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT') return;
      currentTrophy = idx;
      currentView = 'guide';
      render();
    });
    $('#list').appendChild(card);
  });
}
function render() {
  const listEl = $('#list');
  const roadmapEl = $('#roadmapPanel');
  const detailEl = $('#detail');
  listEl.style.display = currentView === 'checklist' ? '' : 'none';
  roadmapEl.style.display = currentView === 'roadmap' ? '' : 'none';
  detailEl.style.display = currentView === 'guide' ? '' : 'none';
  if (currentView === 'checklist') {
    renderList();
    renderProgress();
  } else if (currentView === 'roadmap') {
    showRoadmap(roadmapData, trophies, earned);
  } else if (currentView === 'guide') {
    showDetail(trophies[currentTrophy], trophies, earned,
      (i) => { currentTrophy = Math.max(0, Math.min(trophies.length - 1, i)); render(); },
      (n, c) => toggleEarned(n, c)
    );
  }
}
$('search').addEventListener('input', render);
$('kind').addEventListener('change', render);
$('grade').addEventListener('change', render);
$('hideEarned').addEventListener('change', render);
$('spoilerBtn').addEventListener('click', () => {
  spoilerOn = !spoilerOn;
  $('spoilerBtn').textContent = spoilerOn ? 'Show spoilers' : 'Hide spoilers';
  saveProgress();
  render();
});
$('roadmapBtn').addEventListener('click', () => { currentView = 'roadmap'; render(); });
$('checklistBtn').addEventListener('click', () => { currentView = 'checklist'; render(); });
$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({earned: [...earned], spoiler: spoilerOn}, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
});

$('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      earned.clear();
      (data.earned || []).forEach(n => earned.add(n));
      spoilerOn = !!data.spoiler;
      saveProgress();
      render();
    } catch {}
    e.target.value = '';
  };
  reader.readAsText(file);
});

async function boot() {
  await loadData();
  loadProgress();
  const params = new URLSearchParams(location.search);
  if (params.get('search')) $('search').value = params.get('search');
  if (params.get('kind')) $('kind').value = params.get('kind');
  if (params.get('grade')) $('grade').value = params.get('grade');
  if (params.get('spoilers') === '1') { spoilerOn = true; $('spoilerBtn').textContent = 'Hide spoilers'; }
  if (params.get('view')) currentView = params.get('view');
const trophyParam = params.get('trophy');
let startIndex = 0;
if (trophyParam !== null) {
  const asInt = parseInt(trophyParam, 10);
  if (!isNaN(asInt) && asInt >= 0 && asInt < trophies.length) {
    startIndex = asInt;
  } else {
    const found = trophies.findIndex(t => t.name.toLowerCase().includes(trophyParam.toLowerCase()));
    startIndex = found >= 0 ? found : 0;
  }
}
startIndex = Math.max(0, Math.min(startIndex, trophies.length - 1));
currentTrophy = startIndex;
  if (params.get('demo') === '1') {
    trophies.filter(t => t.kind === 'story').slice(0, 6).forEach(t => earned.add(t.name));
    saveProgress();
  }
  render();
  window.__shotReady = true;
}

window.onerror = (msg, src, lineno, colno, err) => { window.__shotError = String(msg); };

boot();