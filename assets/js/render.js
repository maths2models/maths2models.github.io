/* ============================================================
   Maths2Models — render.js
   HTML rendering functions — all return HTML strings
   ============================================================ */

M2M.render = (function () {

  /* ── Badge ────────────────────────────────────────────── */
  function badge(text, type) {
    type = type || 'primary';
    return `<span class="badge badge--${type}">${M2M.escapeHTML(text)}</span>`;
  }

  /* ── Status badge (auto-maps status to type) ─────────── */
  function statusBadge(status) {
    const map = {
      'active': { label: 'Active', type: 'active' },
      'coming-soon': { label: 'Coming Soon', type: 'coming-soon' },
      'in-progress': { label: 'In Progress', type: 'in-progress' },
      'archived': { label: 'Archived', type: 'coming-soon' }
    };
    const m = map[status] || map['coming-soon'];
    return badge(m.label, m.type);
  }

  /* ── Coming Soon (3 levels) ──────────────────────────── */
  function comingSoon(level, message) {
    const msg = message || 'Content is being prepared.';
    const ytLink = 'https://youtube.com/@maths2models';

    if (level === 1) {
      // Tab level
      return `
        <div class="coming-soon coming-soon--tab">
          <div class="coming-soon-icon">🚧</div>
          <h3>Coming Soon</h3>
          <p>${M2M.escapeHTML(msg)}</p>
          <div class="coming-soon-actions">
            <a href="${ytLink}" target="_blank" rel="noopener" class="btn btn--primary btn--sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><use href="/assets/svg/sprite.svg#icon-youtube"></use></svg>
              Subscribe on YouTube
            </a>
          </div>
        </div>
      `;
    }

    if (level === 3) {
      // Section level
      return `
        <div class="coming-soon coming-soon--section">
          <div class="coming-soon-icon">🚧</div>
          <h3>Coming Soon</h3>
          <p>${M2M.escapeHTML(msg)}</p>
          <div class="coming-soon-actions">
            <a href="/" class="btn btn--secondary">← Back Home</a>
            <a href="${ytLink}" target="_blank" rel="noopener" class="btn btn--primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><use href="/assets/svg/sprite.svg#icon-youtube"></use></svg>
              Subscribe on YouTube
            </a>
          </div>
        </div>
      `;
    }

    // Level 2 — card level (returns a badge, used inside cards)
    return badge('Coming Soon', 'coming-soon');
  }

  /* ── Page Header ─────────────────────────────────────── */
  function pageHeader(title, description, countLabel) {
    return `
      <div class="page-header">
        <h1>${M2M.escapeHTML(title)}</h1>
        <p>${M2M.escapeHTML(description)}</p>
        ${countLabel ? `<div style="margin-top: var(--space-4)">${badge(countLabel, 'primary')}</div>` : ''}
      </div>
    `;
  }

  /* ── Course Card ─────────────────────────────────────── */
  function courseCard(course, basePath) {
    basePath = basePath || './';
    const isActive = course.status === 'active' || course.status === 'in-progress';
    const thumbSrc = course.thumbnail || (course.playlist_id ? M2M.playlistThumb(course.playlist_id) : '');
    const topicTags = (course.topics || []).slice(0, 3).map(t => {
      const topicStr = typeof t === 'string' ? t : t.title;
      return `<span class="card-tag">${M2M.escapeHTML(topicStr)}</span>`;
    }).join('');

    const thumbnail = thumbSrc
      ? `<img class="card-thumbnail" src="${thumbSrc}" alt="${M2M.escapeHTML(course.title)}" loading="lazy">`
      : `<div class="card-thumbnail-placeholder">${M2M.initial(course.title)}</div>`;

    const formatReqs = (reqs) => {
      if (!reqs || !Array.isArray(reqs) || reqs.length === 0) return 'None';
      return reqs.map(code => `<a href="${basePath}${code}/" class="req-link">${code}</a>`).join(', ');
    };

    const officialUrl = course.official_url || `https://study.iitm.ac.in/ds/course_pages/${course.id}.html`;
    const officialLink = `<a href="${officialUrl}" target="_blank" rel="noopener" class="btn btn--outline-primary btn--sm">Official Site ↗</a>`;

    const rightBtnText = isActive ? 'View ↗' : 'Coming Soon ↗';
    const rightBtnClass = isActive ? 'btn--primary' : 'btn--outline-warning';
    const rightBtn = `<a href="${basePath}${course.id}/" class="btn ${rightBtnClass} btn--sm">${rightBtnText}</a>`;

    return `
      <div class="card card--course observe-fade">
        ${thumbnail}
        <div class="card-body" style="display:flex; flex-direction:column; flex-grow:1;">
          <div class="card-meta" style="display:flex; flex-wrap:nowrap; overflow-x:auto; overflow-y:hidden; gap:var(--space-2); align-items:center; padding-bottom:4px; margin-bottom:var(--space-2);">
            ${course.id ? badge(course.id, 'primary') : ''}
            ${course.track ? badge('Option ' + course.track, 'secondary') : ''}
            ${badge(course.category || 'Theory', 'accent')}
            ${badge(course.credits + ' Credits', 'secondary')}
            ${statusBadge(course.status)}
          </div>
          <h3 class="card-title" style="color:var(--color-text-primary); font-weight:800; line-height:1.3; font-size:1.1rem; margin-bottom:var(--space-2);">${M2M.escapeHTML(course.title)}</h3>
          <div style="display:flex;justify-content:space-between;font-size:var(--font-size-xs);color:var(--color-text-primary);margin-bottom:var(--space-3);font-family:var(--font-mono); font-weight:600; padding:var(--space-2); background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
            <span>Pre: ${formatReqs(course.prerequisites)}</span>
            <span>Co: ${formatReqs(course.corequisites)}</span>
          </div>
          ${topicTags ? `<div class="card-tags">${topicTags}</div>` : ''}
          <div class="card-footer mt-auto" style="display:flex; justify-content:space-between; align-items:center;">
            ${officialLink}
            ${rightBtn}
          </div>
        </div>
      </div>
    `;
  }

  /* ── Video Card ──────────────────────────────────────── */
  function videoCard(video) {
    const thumb = video.youtube_id ? M2M.ytThumb(video.youtube_id) : '';
    const ytUrl = video.url ? video.url : (video.youtube_id ? `https://www.youtube.com/watch?v=${video.youtube_id}` : '#');

    return `
      <a href="${ytUrl}" target="_blank" rel="noopener" class="card card--video" data-week="${video.week || ''}">
        <div class="card-thumbnail" style="position:relative">
          ${thumb
            ? `<img src="${thumb}" alt="${M2M.escapeHTML(video.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover">`
            : `<div class="card-thumbnail-placeholder">▶</div>`
          }
          <div class="play-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><use href="/assets/svg/sprite.svg#icon-play"></use></svg>
          </div>
          ${video.duration ? `<span class="duration-badge">${M2M.escapeHTML(video.duration)}</span>` : ''}
        </div>
        <div class="card-body">
          <h3 class="card-title" style="font-size:var(--font-size-sm)">${M2M.escapeHTML(video.title)}</h3>
          <div class="card-meta">
            ${video.week ? badge('Week ' + video.week, 'primary') : ''}
            ${video.courseName ? `<span class="text-xs text-secondary">${M2M.escapeHTML(video.courseName)}</span>` : ''}
          </div>
        </div>
      </a>
    `;
  }

  /* ── Note Row (table) ────────────────────────────────── */
  function noteRow(note) {
    return `
      <tr data-week="${note.week || ''}">
        <td>
          <div class="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/assets/svg/sprite.svg#icon-document"></use></svg>
            ${M2M.escapeHTML(note.title)}
          </div>
        </td>
        <td>${note.week ? 'Week ' + note.week : '–'}</td>
        <td>${badge((note.type || 'pdf').toUpperCase(), 'primary')}</td>
        <td>
          ${note.file_url
            ? `<a href="${note.file_url}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">Download ↗</a>`
            : `<span class="text-muted text-sm">Not available</span>`
          }
        </td>
      </tr>
    `;
  }

  /* ── Practice / MCQ Card ─────────────────────────────── */
  function practiceCard(q, index) {
    const options = (q.options || []).map((opt, i) => `
      <button class="mcq-option" data-index="${i}" data-correct="${opt === q.answer}" onclick="M2M.revealAnswer(this)">
        <span class="mcq-option-letter">${String.fromCharCode(65 + i)}.</span>
        ${M2M.escapeHTML(opt)}
      </button>
    `).join('');

    return `
      <div class="mcq-card" id="mcq-${index}">
        <div class="card-meta" style="margin-bottom:var(--space-3)">
          ${q.difficulty ? badge(q.difficulty, q.difficulty === 'easy' ? 'active' : q.difficulty === 'hard' ? 'coming-soon' : 'primary') : ''}
          ${q.topic ? badge(q.topic, 'primary') : ''}
        </div>
        <div class="mcq-question">${M2M.escapeHTML(q.question)}</div>
        <div class="mcq-options">${options}</div>
        <div class="mcq-answer" id="mcq-answer-${index}">
          <strong>Answer:</strong> ${M2M.escapeHTML(q.answer || '')}
        </div>
      </div>
    `;
  }

  /* ── Blog Card ───────────────────────────────────────── */
  function blogCard(post) {
    const isActive = post.status !== 'coming-soon';

    return `
      <div class="card card--blog observe-fade">
        <div class="card-body">
          <div class="card-meta">
            ${post.category ? badge(post.category, 'primary') : ''}
            ${post.published_date ? `<span class="text-xs text-muted">${M2M.formatDate(post.published_date)}</span>` : ''}
          </div>
          <h3 class="card-title">${M2M.escapeHTML(post.title)}</h3>
          <p class="card-description">${M2M.escapeHTML(M2M.truncate(post.description || '', 120))}</p>
          <div class="card-footer">
            <span class="text-xs text-muted">${post.author ? M2M.escapeHTML(post.author) : ''}</span>
            ${isActive
              ? `<a href="/blog/${post.id}/" class="btn btn--ghost btn--sm">Read More →</a>`
              : `<span class="text-xs text-muted">Coming Soon</span>`
            }
          </div>
        </div>
      </div>
    `;
  }

  /* ── Project Card ────────────────────────────────────── */
  function projectCard(project) {
    const isActive = project.status !== 'coming-soon';
    const techBadges = (project.tags || []).map(t =>
      `<span class="card-tag">${M2M.escapeHTML(t)}</span>`
    ).join('');

    const thumbnail = project.thumbnail
      ? `<img class="card-thumbnail" src="${project.thumbnail}" alt="${M2M.escapeHTML(project.title)}" loading="lazy">`
      : `<div class="card-thumbnail-placeholder">${M2M.initial(project.title)}</div>`;

    const links = project.links || {};

    return `
      <div class="card card--project observe-fade">
        ${thumbnail}
        <div class="card-body">
          <div class="card-meta">
            ${project.category ? badge(project.category, 'primary') : ''}
            ${statusBadge(project.status)}
          </div>
          <h3 class="card-title">${M2M.escapeHTML(project.title)}</h3>
          <p class="card-description">${M2M.escapeHTML(M2M.truncate(project.description || '', 100))}</p>
          ${techBadges ? `<div class="card-tags">${techBadges}</div>` : ''}
          <div class="card-footer">
            ${links.github_url && isActive && links.github_url !== '#'
              ? `<a href="${links.github_url}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><use href="/assets/svg/sprite.svg#icon-github"></use></svg>
                  GitHub
                </a>`
              : ''
            }
            ${links.live_demo_url && isActive && links.live_demo_url !== '#'
              ? `<a href="${links.live_demo_url}" target="_blank" rel="noopener" class="btn btn--primary btn--sm">Live Demo ↗</a>`
              : ''
            }
            ${isActive
              ? `<a href="/projects/${project.id}/" class="btn btn--secondary btn--sm">Details</a>`
              : ''
            }
            ${!isActive
              ? `<a href="https://youtube.com/@maths2models" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">Notify Me →</a>`
              : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  /* ── Resource Row (table) ────────────────────────────── */
  function resourceRow(resource) {
    const url = resource.download_url !== '#' ? resource.download_url : (resource.external_url !== '#' ? resource.external_url : null);
    
    return `
      <tr>
        <td>${M2M.escapeHTML(resource.title)}</td>
        <td>${badge(resource.category || 'General', 'primary')}</td>
        <td>${badge((resource.type || 'link').toUpperCase(), 'secondary')}</td>
        <td>
          ${url
            ? `<a href="${url}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">Access ↗</a>`
            : `<span class="text-muted text-sm">Coming Soon</span>`
          }
        </td>
      </tr>
    `;
  }

  /* ── Tab Panel System ────────────────────────────────── */
  function tabPanel(resourcesConfig, courseData) {
    if (!resourcesConfig) return '';
    const tabNames = Object.keys(resourcesConfig).filter(name => {
      if (!resourcesConfig[name] || !resourcesConfig[name].enabled) return false;
      if (name === 'pyqs' && window.M2M?.siteConfig?.feature_flags && !window.M2M.siteConfig.feature_flags.show_pyqs_tab) return false;
      return true;
    });
    if (tabNames.length === 0) return comingSoon(1, 'Course content is being prepared.');

    const tabLabels = {
      videos: '🎬 Videos',
      notes: '📝 Notes',
      practice: '🧪 Practice',
      pyqs: '📋 PYQs',
      codes: '💻 Codes'
    };

    const tabButtons = tabNames.map((name, i) => `
      <button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${name}" onclick="M2M.switchTab('${name}')">${tabLabels[name] || name}</button>
    `).join('');

    const tabPanels = tabNames.map((name, i) => {
      const tab = resourcesConfig[name];
      let content = '';

      const items = (tab.items || []).filter(item => item.enabled);

      if (items.length === 0) {
        content = comingSoon(1, 'Content is being prepared.');
      } else {
        switch (name) {
          case 'videos':
            content = `<div class="grid grid--3">${items.map(v => videoCard(v)).join('')}</div>`;
            break;
          case 'notes':
            content = `
              <div class="table-wrapper">
                <table class="data-table">
                  <thead><tr><th>Title</th><th>Week</th><th>Type</th><th>Download</th></tr></thead>
                  <tbody>${items.map(n => noteRow(n)).join('')}</tbody>
                </table>
              </div>
            `;
            break;
          case 'practice':
            content = items.map((q, i) => practiceCard(q, i)).join('');
            break;
          case 'pyqs':
            content = `<div class="grid grid--3">${items.map(p => pyqCard(p)).join('')}</div>`;
            break;
          case 'codes':
            content = `<div class="grid grid--3">${items.map(c => codeCard(c)).join('')}</div>`;
            break;
        }
      }

      return `<div class="tab-panel${i === 0 ? ' active' : ''}" id="tab-${name}">${content}</div>`;
    }).join('');

    return `
      <div class="tab-nav">${tabButtons}</div>
      <div class="tab-content">${tabPanels}</div>
    `;
  }

  /* ── PYQ Card ────────────────────────────────────────── */
  function pyqCard(p) {
    return `
      <div class="card observe-fade">
        <div class="card-body">
          <div class="card-meta">${p.year ? badge(p.year.toString(), 'primary') : ''}</div>
          <h3 class="card-title" style="font-size:var(--font-size-base)">${M2M.escapeHTML(p.title)}</h3>
          <div class="card-footer">
            ${p.file_url
              ? `<a href="${p.file_url}" target="_blank" rel="noopener" class="btn btn--primary btn--sm">Download ↗</a>`
              : `<span class="text-muted text-sm">Coming Soon</span>`
            }
          </div>
        </div>
      </div>
    `;
  }

  /* ── Code Card ───────────────────────────────────────── */
  function codeCard(c) {
    return `
      <div class="card observe-fade">
        <div class="card-body">
          <div class="card-meta">${c.language ? badge(c.language, 'primary') : ''}</div>
          <h3 class="card-title" style="font-size:var(--font-size-base)">${M2M.escapeHTML(c.title)}</h3>
          <div class="card-footer">
            ${c.github_url
              ? `<a href="${c.github_url}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><use href="/assets/svg/sprite.svg#icon-github"></use></svg>
                  View Code
                </a>`
              : `<span class="text-muted text-sm">Coming Soon</span>`
            }
          </div>
        </div>
      </div>
    `;
  }

  /* ── Stats Bar ───────────────────────────────────────── */
  function statsBar(counts) {
    const items = [
      { label: 'Courses', value: counts.courses || 0 },
      { label: 'Videos', value: counts.videos || 0 },
      { label: 'Notes', value: counts.notes || 0 },
      { label: 'Topics', value: counts.topics || 0 }
    ];

    return `
      <section class="stats-bar">
        <div class="container">
          ${items.map(item => `
            <div class="stat-item observe-fade">
              <div class="stat-number" data-target="${item.value}">0</div>
              <div class="stat-label">${item.label}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  /* ── Learning Path Card (homepage) ───────────────────── */
  function pathCard(icon, title, description, stats, tags, href) {
    const tagsHtml = (tags || []).map(t => `<span class="card-tag">${M2M.escapeHTML(t)}</span>`).join('');
    return `
      <div class="path-card observe-fade" style="text-decoration:none;color:inherit">
        <div class="path-card-icon">${icon}</div>
        <h3 style="font-size:var(--font-size-xl);margin-bottom:var(--space-3)">${M2M.escapeHTML(title)}</h3>
        <p style="font-size:var(--font-size-sm);color:var(--color-text-secondary);line-height:var(--line-height-relaxed);margin-bottom:var(--space-4)">${M2M.escapeHTML(description)}</p>
        <div class="course-count" style="margin-bottom:var(--space-4);color:var(--color-primary);font-size:var(--font-size-sm);font-weight:var(--font-weight-semibold)">${M2M.escapeHTML(stats)}</div>
        ${tagsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:var(--space-2);justify-content:center;margin-bottom:var(--space-4)">${tagsHtml}</div>` : ''}
      </div>
    `;
  }

  /* ── Section Top (heading + view all link) ───────────── */
  function sectionTop(title, viewAllHref, viewAllLabel) {
    return `
      <div class="section-top">
        <h2 class="section-title">${M2M.escapeHTML(title)}</h2>
        ${viewAllHref ? `<a href="${viewAllHref}" class="view-all-link">${viewAllLabel || 'View All'} →</a>` : ''}
      </div>
    `;
  }

  /* ── Course Detail Header ────────────────────────────── */
  function courseDetailHeader(course) {
    const thumbSrc = course.thumbnail || (course.playlist_id ? M2M.playlistThumb(course.playlist_id) : '');
    const topicTags = (course.topics || []).map(t => {
      const topicStr = typeof t === 'string' ? t : t.title;
      return `<span class="card-tag">${M2M.escapeHTML(topicStr)}</span>`;
    }).join('');

    const basePath = '/courses/';
    const formatReqs = (reqs) => {
      if (!reqs || !Array.isArray(reqs) || reqs.length === 0) return 'None';
      return reqs.map(code => `<a href="${basePath}${code}/" class="req-link">${code}</a>`).join(', ');
    };

    return `
      <div class="course-header">
        ${thumbSrc
          ? `<img class="course-header-img" src="${thumbSrc}" alt="${M2M.escapeHTML(course.title)}" loading="lazy">`
          : `<div class="course-header-img" style="display:flex;align-items:center;justify-content:center;font-size:var(--font-size-5xl);font-weight:bold;color:rgba(255,255,255,0.2)">${M2M.initial(course.title)}</div>`
        }
        <div class="course-header-info">
          <h1>${M2M.escapeHTML(course.title)}</h1>
          <p style="color:var(--color-text-secondary); font-size:var(--font-size-lg); margin-top:var(--space-2); margin-bottom:var(--space-4); max-width:800px; line-height:1.5;">${M2M.escapeHTML(course.description || '')}</p>
          <div class="course-header-meta">
            ${course.id ? badge(course.id, 'primary') : ''}
            ${course.track ? badge('Option ' + course.track, 'secondary') : ''}
            ${badge(course.category || 'Theory', 'accent')}
            ${badge(course.credits + ' Credits', 'secondary')}
            ${course.code ? badge(course.code, 'primary') : ''}
            ${statusBadge(course.status)}
          </div>
          ${topicTags ? `<div class="course-header-topics">${topicTags}</div>` : ''}
          <div style="margin:var(--space-4) 0">
            <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-bottom:var(--space-1)"><strong>Prerequisites:</strong> ${formatReqs(course.prerequisites)}</div>
            <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)"><strong>Corequisites:</strong> ${formatReqs(course.corequisites)}</div>
          </div>
          ${course.playlist_url
            ? `<a href="${course.playlist_url}" target="_blank" rel="noopener" class="btn btn--primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><use href="/assets/svg/sprite.svg#icon-youtube"></use></svg>
                Watch Playlist →
              </a>`
            : ''
          }
        </div>
      </div>
    `;
  }

  return {
    badge,
    statusBadge,
    comingSoon,
    pageHeader,
    courseCard,
    videoCard,
    noteRow,
    practiceCard,
    blogCard,
    projectCard,
    resourceRow,
    tabPanel,
    pyqCard,
    codeCard,
    statsBar,
    pathCard,
    sectionTop,
    courseDetailHeader
  };
})();

/* ── Global Tab Switcher ────────────────────────────────── */
M2M.switchTab = function (tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === 'tab-' + tabName);
  });
};

/* ── Global MCQ Answer Reveal ───────────────────────────── */
M2M.revealAnswer = function (optionEl) {
  const card = optionEl.closest('.mcq-card');
  if (!card || card.dataset.answered) return;
  card.dataset.answered = 'true';

  const isCorrect = optionEl.dataset.correct === 'true';
  optionEl.classList.add(isCorrect ? 'correct' : 'incorrect');

  // Highlight the correct one
  if (!isCorrect) {
    card.querySelectorAll('.mcq-option').forEach(opt => {
      if (opt.dataset.correct === 'true') opt.classList.add('correct');
    });
  }

  // Show answer explanation
  const answerId = card.id.replace('mcq-', 'mcq-answer-');
  const answerEl = document.getElementById(answerId);
  if (answerEl) answerEl.classList.add('show');
};
