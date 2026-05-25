/* ============================================================
   Maths2Models — router.js
   Client-side routing: listing vs detail view based on ?id=
   ============================================================ */

/**
 * Router module — handles listing/detail view switching
 * 
 * Usage from a page script:
 *   M2M.router.renderPage({
 *     jsonPath: '/data/foundation.json',
 *     itemsKey: 'courses',
 *     renderListing: myListingFn,
 *     renderDetail: myDetailFn,
 *     breadcrumbSection: 'Foundation'
 *   });
 */

M2M.router = (function () {

  /**
   * Determine current view type based on URL params or folder path
   * @returns {'listing'|'detail'}
   */
  function getView() {
    return getItemId() ? 'detail' : 'listing';
  }

  /**
   * Get the current item ID from URL
   * @returns {string|null}
   */
  function getItemId() {
    const paramId = M2M.getParam('id');
    if (paramId) return paramId;

    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    let lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.toLowerCase().endsWith('.html')) {
      if (parts.length > 1) {
        lastPart = parts[parts.length - 2];
      } else {
        lastPart = null;
      }
    }
    
    // Define listing folder names that shouldn't be treated as IDs
    const listingFolders = ['courses', 'projects', 'blog', 'resources', 'search'];
    if (lastPart && !listingFolders.includes(lastPart.toLowerCase())) {
      return lastPart;
    }
    return null;
  }

  /**
   * Render a page using the provided config
   * @param {Object} config
   * @param {string} config.jsonPath - path to the index JSON
   * @param {boolean} [config.useSplitJson] - whether to fetch detail JSON separately
   * @param {string} [config.detailJsonPrefix] - e.g. '/data/courses/'
   * @param {string} config.itemsKey - key in JSON that holds the items array
   * @param {Function} config.renderListing - function(data, container)
   * @param {Function} config.renderDetail - function(item, data, container)
   * @param {string} config.breadcrumbSection - section name for breadcrumbs
   * @param {string} [config.sectionHref] - href for breadcrumb section link
   */
  async function renderPage(config) {
    if (await M2M.checkMaintenance()) return;

    const container = document.getElementById('main-content');
    if (!container) return;

    // We must have a jsonPath, but for App Shells that didn't pass it, fallback
    const jsonPath = config.jsonPath || (window.location.pathname.includes('/courses/') ? '/data/courses-index.json' : '');
    
    const indexData = await M2M.fetchJSON(jsonPath);

    if (!indexData) {
      container.innerHTML = M2M.render.comingSoon(3, 'Unable to load content.');
      return;
    }

    // Filter out items explicitly marked as invisible in index
    if (indexData[config.itemsKey]) {
      indexData[config.itemsKey] = indexData[config.itemsKey].filter(item => item.visibility !== false);
    }

    const view = getView();

    if (view === 'detail') {
      const rawId = getItemId();
      const idMap = indexData.id_alias || {};
      const searchId = (rawId && idMap[rawId.toLowerCase()]) ? idMap[rawId.toLowerCase()] : rawId;
      
      let item = null;
      if (config.useSplitJson !== false && jsonPath.includes('-index')) {
        // Automatically determine prefix if useSplitJson is true or implied by '-index.json'
        const detailPath = config.detailJsonPrefix || jsonPath.replace('-index.json', '/');
        const indexItems = indexData[config.itemsKey] || [];
        const indexMetaData = indexItems.find(i => i.id === searchId || i.alias_id === searchId || (i.code && i.code === searchId));
        
        if (!indexMetaData) {
          item = null;
        } else {
          const heavyData = await M2M.fetchJSON(`${detailPath}${searchId}.json`);
          item = { ...indexMetaData, ...(heavyData || {}) };
        }
      } else {
        const items = indexData[config.itemsKey] || [];
        item = items.find(i => i.id === searchId || i.alias_id === searchId || (i.code && i.code === searchId));
      }

      if (!item) {
        // Inline 404 state
        container.innerHTML = `
          <div class="section">
            <div class="container">
              <div class="coming-soon coming-soon--section">
                <div class="coming-soon-icon">🔍</div>
                <h3>Item Not Found</h3>
                <p>The item "${M2M.escapeHTML(rawId)}" doesn't exist in this section.</p>
                <div class="coming-soon-actions">
                  <a href="${config.sectionHref || './'}" class="btn btn--secondary">← Back to ${config.breadcrumbSection || 'Listing'}</a>
                  <a href="/" class="btn btn--ghost">Home</a>
                </div>
              </div>
            </div>
          </div>
        `;
        return;
      }
      
      // Block access to sensitive content if coming-soon
      if (item.status === 'coming-soon') {
        item.resources = null;
        item.tabs = null;
        item.content_url = null;
        item.links = null;
      }

      // Block access if the level is disabled
      if (item.level && indexData.levels_status && indexData.levels_status[item.level] === false) {
        container.innerHTML = `
          <div class="section">
            <div class="container">
              <div class="coming-soon coming-soon--section">
                <div class="coming-soon-icon">🔒</div>
                <h3>Content Locked</h3>
                <p>The ${M2M.escapeHTML(item.level)} level is currently disabled or unavailable.</p>
                <div class="coming-soon-actions">
                  <a href="${config.sectionHref || './'}" class="btn btn--primary">← View Available Content</a>
                </div>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Block access if the category is disabled
      if (item.category && indexData.categories_status && indexData.categories_status[item.category] === false) {
        container.innerHTML = `
          <div class="section">
            <div class="container">
              <div class="coming-soon coming-soon--section">
                <div class="coming-soon-icon">🔒</div>
                <h3>Content Locked</h3>
                <p>The ${M2M.escapeHTML(item.category)} category is currently disabled or unavailable.</p>
                <div class="coming-soon-actions">
                  <a href="${config.sectionHref || './'}" class="btn btn--primary">← View Available Content</a>
                </div>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Update page title
      document.title = `${item.title} | Maths2Models`;

      // Update breadcrumb
      M2M.setBreadcrumb([
        { label: 'Home', href: '/' },
        { label: config.breadcrumbSection, href: config.sectionHref || './' },
        { label: item.title }
      ]);

      if (config.renderDetail) {
        config.renderDetail(item, indexData, container);
      }
    } else {
      // Listing view
      const items = indexData[config.itemsKey] || [];

      if (items.length === 0) {
        container.innerHTML = `
          <div class="section">
            <div class="container">
              ${M2M.render.pageHeader(
                config.breadcrumbSection + ' Courses',
                indexData.description || 'Explore our catalog.'
              )}
              ${M2M.render.comingSoon(3, 'This section is under construction.')}
            </div>
          </div>
        `;
      } else {
        if (config.renderListing) {
          config.renderListing(indexData, container);
        }
      }

      // Update breadcrumb
      M2M.setBreadcrumb([
        { label: 'Home', href: '/' },
        { label: config.breadcrumbSection }
      ]);
    }
  }

  return {
    getView,
    getItemId,
    renderPage
  };
})();
