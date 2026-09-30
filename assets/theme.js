/**
 * Tegat Tea Factory — Theme Initializer
 * Locked to crisp brand luxury light theme.
 */

(function () {
  try {
    localStorage.removeItem('tegat_theme');
    localStorage.removeItem('theme');
  } catch (e) {}

  document.documentElement.removeAttribute('data-theme');
  if (document.body) {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  }

  window.getTheme = function () {
    return 'light';
  };
})();
