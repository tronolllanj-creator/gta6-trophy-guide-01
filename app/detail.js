export function applySpoilerMask(name, description, hidden, earnedBool, spoilerOn) {
  if (spoilerOn && hidden && !earnedBool) {
    return { name: 'Hidden trophy - earn it to reveal', description: 'Hidden trophy - earn it to reveal' };
  }
  return { name, description };
}

export function showDetail(trophy, all, earnedSet, onToggle, onEarned) {
  if (!trophy) return;
  const detail = document.getElementById('detail');
  detail.hidden = false;

  const earned = earnedSet.has(trophy.name);
  const { name, description } = applySpoilerMask(trophy.name, trophy.description, trophy.hidden, earned, true);
  const idx = all.indexOf(trophy);
  detail.innerHTML = '';
  const h2 = document.createElement('h2');
  h2.textContent = name;
  const badge = document.createElement('span');
  badge.className = 'grade ' + trophy.grade;
  badge.textContent = trophy.grade;
  h2.appendChild(badge);
  detail.appendChild(h2);
  const pDesc = document.createElement('p');
  pDesc.textContent = description;
  detail.appendChild(pDesc);
  if (trophy.guide) {
    const pGuide = document.createElement('p');
    pGuide.textContent = trophy.guide;
    detail.appendChild(pGuide);
  }
  if (trophy.steps && trophy.steps.length) {
    const ol = document.createElement('ol');
    trophy.steps.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      ol.appendChild(li);
    });
    detail.appendChild(ol);
  }
  const pSource = document.createElement('p');
  pSource.innerHTML = '<strong>Source:</strong> ' + trophy.source;
  detail.appendChild(pSource);
  if (trophy.missable && trophy.missable_reason) {
    const pMiss = document.createElement('p');
    pMiss.className = 'missable';
    pMiss.innerHTML = '<strong>Missable:</strong> ' + trophy.missable_reason;
    detail.appendChild(pMiss);
  }
  const nav = document.createElement('div');
  nav.className = 'detail-nav';
  const prev = document.createElement('button');
  prev.textContent = 'Prev';
  prev.disabled = idx === 0;
  prev.onclick = () => onToggle(Math.max(0, idx - 1));
  const next = document.createElement('button');
  next.textContent = 'Next';
  next.disabled = idx === all.length - 1;
  next.onclick = () => onToggle(Math.min(all.length - 1, idx + 1));
  nav.appendChild(prev);
  nav.appendChild(next);
  detail.appendChild(nav);
  const label = document.createElement('label');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = earned;
  cb.onchange = () => onEarned(trophy.name, cb.checked);
  label.appendChild(cb);
  label.appendChild(document.createTextNode(' Earned'));
  detail.appendChild(label);
}export function showRoadmap(roadmap, trophies, earnedSet) {
  const panel = document.getElementById('roadmapPanel');
  panel.hidden = false;
  panel.innerHTML = '';

  for (const stage of roadmap.stages) {
    const sec = document.createElement('section');
    sec.innerHTML = `<h3>${stage.title}</h3><p>${stage.summary}</p>${stage.notes ? `<p>${stage.notes}</p>` : ''}`;
    const chipRow = document.createElement('div');
    chipRow.style.display = 'flex';
    chipRow.style.flexWrap = 'wrap';
    chipRow.style.gap = '6px';
    for (const name of stage.trophies) {
      const t = trophies.find(x => x.name === name);
      if (!t) continue;
      const chip = document.createElement('span');
      chip.className = 'chip' + (earnedSet.has(t.name) ? ' earned' : '');
      chip.textContent = t.name;
      chipRow.appendChild(chip);
    }
    sec.appendChild(chipRow);
    panel.appendChild(sec);
  }

  if (roadmap.missable_first?.length) {
    const miss = document.createElement('section');
    miss.innerHTML = '<h3>Do these missables first</h3><ul></ul>';
    const ul = miss.querySelector('ul');
    for (const name of roadmap.missable_first) {
      const li = document.createElement('li');
      li.textContent = name;
      ul.appendChild(li);
    }
    panel.appendChild(miss);
  }
}