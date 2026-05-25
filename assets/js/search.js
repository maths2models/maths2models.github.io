/* ============================================================
   Maths2Models — search.js
   Global search engine — indexes all JSON data
   ============================================================ */

M2M.search = (function () {

  let index = [];
  let built = false;

  /**
   * Build the search index from all JSON data files
   */
  async function buildIndex() {
    if (built) return;

    const [courses, blog, projects, resources, site] = await Promise.all([
      M2M.fetchJSON('/data/courses-index.json'),
      M2M.fetchJSON('/data/blog-index.json'),
      M2M.fetchJSON('/data/projects-index.json'),
      M2M.fetchJSON('/data/resources-index.json'),
      M2M.fetchJSON('/data/site.json')
    ]);

    const m = (site && site.maintenance) || {};

    // Index courses
    if (!m.global && !m.courses && courses && courses.courses) {
      let validCourses = [];
      courses.courses.forEach(course => {
        if (course.visibility === false) return;
        if (course.status !== 'active' && course.status !== 'in-progress') return;
        if (courses.levels_status && courses.levels_status[course.level] === false) return;
        
        index.push({
          type: 'course',
          section: 'Courses',
          title: course.title,
          description: course.description || '',
          id: course.id,
          href: `/courses/${course.id}/`,
          status: course.status,
          icon: '📚'
        });
        
        validCourses.push(course);
      });

      // Fetch detailed data to index subtopics
      const fetchPromises = validCourses.map(c => M2M.fetchJSON(`/data/courses/${c.id}.json`));
      const detailJsons = await Promise.all(fetchPromises);

      detailJsons.forEach((detail, idx) => {
        if (!detail || !detail.topics) return;
        const parentCourse = validCourses[idx];
        
        detail.topics.forEach(topic => {
          if (!topic.subtopics) return;
          topic.subtopics.forEach((subtopic, subIdx) => {
            index.push({
              type: 'course',
              section: parentCourse.title,
              title: subtopic,
              description: `Week ${topic.week}: ${topic.title}`,
              id: `${parentCourse.id}-w${topic.week}-s${subIdx}`,
              href: `/courses/${parentCourse.id}/?tab=videos&week=${topic.week}`,
              status: parentCourse.status,
              icon: '📘'
            });
          });
        });
      });
    }

    // Index blog posts
    if (!m.global && !m.blog && blog && blog.posts) {
      blog.posts.forEach(post => {
        if (post.visibility === false) return;
        if (blog.categories_status && blog.categories_status[post.category] === false) return;
        index.push({
          type: 'blog',
          section: 'Blog',
          title: post.title,
          description: post.summary || '',
          id: post.id,
          href: `/blog/${post.id}/`,
          status: post.status,
          icon: '📝'
        });
      });
    }

    // Index projects
    if (!m.global && !m.projects && projects && projects.projects) {
      projects.projects.forEach(project => {
        if (project.visibility === false) return;
        if (projects.categories_status && projects.categories_status[project.category] === false) return;
        index.push({
          type: 'project',
          section: 'Projects',
          title: project.title,
          description: project.description || '',
          id: project.id,
          href: `/projects/${project.id}/`,
          status: project.status,
          icon: '🚀'
        });
      });
    }

    // Index resources
    if (!m.global && !m.resources && resources && resources.resources) {
      resources.resources.forEach(resource => {
        if (resource.visibility === false) return;
        if (resources.categories_status && resources.categories_status[resource.category] === false) return;
        index.push({
          type: 'resource',
          section: 'Resources',
          title: resource.title,
          description: resource.subject || '',
          id: resource.id,
          href: resource.file_url || '#',
          status: resource.status,
          icon: '📦'
        });
      });
    }

    built = true;
  }

  /**
   * Search the index for a query term
   * @param {string} term
   * @returns {Array} - matching results
   */
  function query(term) {
    if (!term || !term.trim()) return [];
    const q = term.toLowerCase().trim();

    return index.filter(item => {
      return (
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.section && item.section.toLowerCase().includes(q))
      );
    });
  }

  /**
   * Group results by type
   * @param {Array} results
   * @returns {Object} - { course: [...], blog: [...], ... }
   */
  function groupResults(results) {
    const groups = {};
    results.forEach(r => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }

  /**
   * Render search results into a container
   * @param {Array} results
   * @param {HTMLElement} container
   * @param {string} term - the search term (for highlighting)
   */
  function renderResults(results, container, term) {
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `
        <div class="coming-soon" style="padding:var(--space-16) 0">
          <div class="coming-soon-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try searching for courses, topics, or blog posts.</p>
        </div>
      `;
      return;
    }

    const groups = groupResults(results);
    const groupLabels = {
      course: '📚 Courses',
      blog: '📝 Blog Posts',
      project: '🚀 Projects',
      resource: '📦 Resources'
    };

    let html = '';
    Object.keys(groups).forEach(type => {
      html += `
        <div class="search-group">
          <div class="search-group-title">${groupLabels[type] || type}</div>
          ${groups[type].map(item => `
            <a href="${item.href}" class="search-result-item">
              <span style="font-size:var(--font-size-lg)">${item.icon}</span>
              <div>
                <div class="search-result-title">${highlightMatch(item.title, term)}</div>
                <div class="search-result-meta">
                  ${item.section}${item.description ? ' · ' + M2M.truncate(item.description, 60) : ''}
                </div>
              </div>
              ${item.status === 'coming-soon' ? '<span class="badge badge--coming-soon" style="margin-left:auto">Coming Soon</span>' : ''}
            </a>
          `).join('')}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Highlight matching text in a string
   * @param {string} text
   * @param {string} term
   * @returns {string} - HTML with <mark> tags
   */
  function highlightMatch(text, term) {
    if (!term || !text) return M2M.escapeHTML(text || '');
    const escaped = M2M.escapeHTML(text);
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<mark style="background:rgba(37,99,235,0.3);color:var(--color-text-primary);padding:0 2px;border-radius:2px">$1</mark>');
  }

  /**
   * Initialize search page functionality
   * Called from search/index.html
   */
  async function initSearchPage() {
    await buildIndex();

    const input = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    if (!input || !resultsContainer) return;

    // Auto-focus
    input.focus();

    // Check URL for initial query
    const urlQuery = M2M.getParam('q');
    if (urlQuery) {
      input.value = urlQuery;
      const results = query(urlQuery);
      renderResults(results, resultsContainer, urlQuery);
    }

    // Listen for input
    const onInput = M2M.debounce(function () {
      const term = input.value;
      const results = query(term);
      renderResults(results, resultsContainer, term);

      // Update URL without reload
      const url = new URL(window.location);
      if (term) {
        url.searchParams.set('q', term);
      } else {
        url.searchParams.delete('q');
      }
      history.replaceState(null, '', url);
    }, 250);

    input.addEventListener('input', onInput);
  }

  return {
    buildIndex,
    query,
    renderResults,
    initSearchPage
  };
})();
