// Обработка клика на .plus для мобильных устройств (< 768px)
let projectClickHandlersInitialized = false;

function initProjectClickHandlers() {
  // Инициализируем только один раз
  if (projectClickHandlersInitialized) return;

  const projects = document.querySelectorAll(".project");

  projects.forEach((project) => {
    const plusButton = project.querySelector(".growing");

    if (!plusButton) return;

    plusButton.addEventListener("click", function (e) {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) return; // Работает только на мобильных

      // Предотвращаем переход по ссылке родительского элемента
      e.preventDefault();
      e.stopPropagation();

      // Закрываем все остальные проекты
      projects.forEach((otherProject) => {
        if (otherProject !== project) {
          otherProject.classList.remove("active");
        }
      });

      // Переключаем текущий проект
      project.classList.toggle("active");
    });
  });

  projectClickHandlersInitialized = true;
}

// Инициализация обработчиков кликов для проектов
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectClickHandlers);
} else {
  initProjectClickHandlers();
}

// Переинициализация при изменении размера окна для проектов
window.addEventListener("resize", function () {
  const isMobile = window.innerWidth < 768;

  // Если переключились на десктоп, убираем все активные классы
  if (!isMobile) {
    const projects = document.querySelectorAll(".project.active");
    projects.forEach((project) => {
      project.classList.remove("active");
    });
  }
});
