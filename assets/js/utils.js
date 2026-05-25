/* ============================================================
   Maths2Models — utils.js
   Shared utility functions used across all pages
   ============================================================ */

const M2M = window.M2M || {};

/**
 * Read a URL query parameter by key
 * @param {string} key - parameter name
 * @returns {string|null}
 */
M2M.getParam = function (key) {
  return new URLSearchParams(window.location.search).get(key);
};

/**
 * Fetch a JSON file, return parsed object or null on failure
 * @param {string} path - absolute path from root, e.g. "/data/foundation.json"
 * @returns {Promise<Object|null>}
 */
M2M.fetchJSON = async function (path, useCache = false) {
  try {
    if (useCache) {
      const cachedData = sessionStorage.getItem(path);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const cacheBuster = path.includes('?') ? '&t=' + Date.now() : '?t=' + Date.now();
    const res = await fetch(path + cacheBuster);
    if (!res.ok) return null;
    const data = await res.json();
    
    if (useCache) {
      sessionStorage.setItem(path, JSON.stringify(data));
    }
    
    return data;
  } catch (e) {
    console.warn('M2M.fetchJSON failed for', path, e);
    return null;
  }
};

/**
 * Convert a string to a URL-safe slug
 * @param {string} str
 * @returns {string}
 */
M2M.slugify = function (str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Format an ISO date string to a readable format
 * @param {string} str - e.g. "2025-06-01"
 * @returns {string} - e.g. "June 1, 2025"
 */
M2M.formatDate = function (str) {
  if (!str) return '';
  try {
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return str;
  }
};

/**
 * Truncate a string to n characters and append "..."
 * @param {string} str
 * @param {number} n
 * @returns {string}
 */
M2M.truncate = function (str, n) {
  if (!str) return '';
  if (str.length <= n) return str;
  return str.slice(0, n).trimEnd() + '…';
};

/**
 * Debounce a function — delays execution until ms has passed without calls
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
M2M.debounce = function (fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
};

/**
 * Count total items across all course levels
 * Returns { courses, videos, notes, topics }
 * @param  {...Object} jsons - foundation, diploma, degree JSON objects
 * @returns {Object}
 */
M2M.countItems = async function (...jsons) {
  const counts = { courses: 0, videos: 0, notes: 0, topics: 0 };
  const site = await M2M.fetchJSON('/data/site.json');
  const m = (site && site.maintenance) || {};

  if (m.global || m.courses) return counts;

  let validCourses = [];
  jsons.forEach(json => {
    if (!json || !json.courses) return;
    json.courses.forEach(course => {
      if (course.visibility === false) return;
      if (course.status !== 'active' && course.status !== 'in-progress') return;
      if (json.levels_status && json.levels_status[course.level] === false) return;
      validCourses.push(course);
    });
  });

  counts.courses = validCourses.length;

  const fetchPromises = validCourses.map(c => M2M.fetchJSON(`/data/courses/${c.id}.json`));
  const detailJsons = await Promise.all(fetchPromises);

  detailJsons.forEach(detail => {
    if (!detail) return;
    counts.topics += (detail.topics || []).length;
    if (detail.resources) {
      const vt = detail.resources.videos;
      if (vt && vt.items) counts.videos += vt.items.length;
      const nt = detail.resources.notes;
      if (nt && nt.items) counts.notes += nt.items.length;
    }
  });
  return counts;
};

/**
 * Generate a YouTube thumbnail URL from a video ID
 * @param {string} videoId
 * @returns {string}
 */
M2M.ytThumb = function (videoId) {
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

/**
 * Generate a YouTube playlist thumbnail URL from a playlist ID
 * Uses the first video in the playlist — fallback to gradient placeholder
 * @param {string} playlistId
 * @returns {string}
 */
M2M.playlistThumb = function (playlistId) {
  if (!playlistId) return '';
  return `https://img.youtube.com/vi/${playlistId}/mqdefault.jpg`;
};

/**
 * Get the first letter of a title for placeholder thumbnails
 * @param {string} title
 * @returns {string}
 */
M2M.initial = function (title) {
  return (title || 'M').charAt(0).toUpperCase();
};

/**
 * Animate a number counter from 0 to target value
 * @param {HTMLElement} el - element to update
 * @param {number} target - target number
 * @param {number} duration - animation duration in ms
 */
M2M.animateCounter = function (el, target, duration) {
  if (!el) return;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

/**
 * Get all recent videos across all course JSONs, sorted by id
 * @param {...Object} jsons
 * @returns {Array}
 */
M2M.getRecentVideos = function (...jsons) {
  const videos = [];
  jsons.forEach(json => {
    if (!json || !json.courses) return;
    json.courses.forEach(course => {
      if (course.tabs && course.tabs.videos && course.tabs.videos.items) {
        course.tabs.videos.items.forEach(v => {
          videos.push({ ...v, courseName: course.title, courseId: course.id });
        });
      }
    });
  });
  return videos.slice(0, 4);
};

/**
 * Get all recent notes across all course JSONs
 * @param {...Object} jsons
 * @returns {Array}
 */
M2M.getRecentNotes = function (...jsons) {
  const notes = [];
  jsons.forEach(json => {
    if (!json || !json.courses) return;
    json.courses.forEach(course => {
      if (course.tabs && course.tabs.notes && course.tabs.notes.items) {
        course.tabs.notes.items.forEach(n => {
          notes.push({ ...n, courseName: course.title, courseId: course.id });
        });
      }
    });
  });
  return notes.slice(0, 4);
};

/**
 * Escape HTML to prevent XSS when rendering user content
 * @param {string} str
 * @returns {string}
 */
M2M.escapeHTML = function (str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Check if the current page is under maintenance based on site.json config.
 * Redirects to /maintenance.html if blocked.
 * Returns true if blocked, so callers can abort execution.
 */
M2M.checkMaintenance = async function() {
  const siteConfig = await M2M.fetchJSON('/data/site.json');
  if (!siteConfig || !siteConfig.maintenance) return false;
  
  const m = siteConfig.maintenance;
  const path = window.location.pathname;
  let isMaintenance = false;

  let sectionName = '';
  if (m.global) {
    isMaintenance = true;
    sectionName = 'global';
  } else if (path === '/' && m.home) {
    isMaintenance = true;
    sectionName = 'home';
  } else if (path.startsWith('/courses/') && m.courses) {
    isMaintenance = true;
    sectionName = 'courses';
  } else if (path.startsWith('/projects/') && m.projects) {
    isMaintenance = true;
    sectionName = 'projects';
  } else if (path.startsWith('/blog/') && m.blog) {
    isMaintenance = true;
    sectionName = 'blog';
  } else if (path.startsWith('/resources/') && m.resources) {
    isMaintenance = true;
    sectionName = 'resources';
  } else if (path.startsWith('/calculator/') && m.calculator) {
    isMaintenance = true;
    sectionName = 'calculator';
  }

  if (isMaintenance && !path.startsWith('/maintenance.html')) {
    document.body.innerHTML = '';
    window.location.href = `/maintenance.html?section=${sectionName}`;
    return true;
  }
  return false;
};

window.M2M = M2M;
