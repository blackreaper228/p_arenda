document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-scroll-top]').forEach((el) => {
    el.addEventListener('click', () => {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, 0);
      }
    });
  });
});
