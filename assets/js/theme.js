(function() {
  try {
    const savedTheme = localStorage.getItem('m2m-theme') || localStorage.getItem('m2m-calc-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      // Migrate old calc theme if necessary
      if (!localStorage.getItem('m2m-theme')) {
        localStorage.setItem('m2m-theme', savedTheme);
      }
    } else {
      // Default to dark
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {
    console.warn("localStorage not available for theme.");
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
