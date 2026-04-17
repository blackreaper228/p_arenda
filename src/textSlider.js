// слайдер текста
document.addEventListener('DOMContentLoaded', function() {
  // Находим основной контейнер слайдера
  const mainSlider = document.querySelector('.main-slider');
  
  if (!mainSlider) return;
  
  // Находим элементы внутри этого контейнера
  const textSlides = mainSlider.querySelectorAll('[data-text-slide]');
  const nextBtn = mainSlider.querySelector('[data-next]');
  const prevBtn = mainSlider.querySelector('[data-prev]');
  const currentCounter = mainSlider.querySelector('[data-current]');
  const totalCounter = mainSlider.querySelector('[data-total]');
  
  if (!textSlides.length) return;
  
  let currentSlide = 0;
  
  // Функция обновления слайдов
  function updateTextSlides() {
    // Обновляем видимость слайдов
    textSlides.forEach((slide, index) => {
      if (index === currentSlide) {
        slide.classList.remove('hidden');
      } else {
        slide.classList.add('hidden');
      }
    });
    
    // Обновляем счетчик, если он есть
    if (currentCounter) {
      currentCounter.textContent = currentSlide + 1;
    }
    
    if (totalCounter) {
      totalCounter.textContent = textSlides.length;
    }
  }
  
  // Функция для перехода к следующему слайду
  function goToNextSlide() {
    currentSlide = (currentSlide + 1) % textSlides.length;
    updateTextSlides();
  }
  
  // Функция для перехода к предыдущему слайду
  function goToPrevSlide() {
    currentSlide = (currentSlide - 1 + textSlides.length) % textSlides.length;
    updateTextSlides();
  }
  
  // Вешаем обработчики на кнопки
  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // Останавливаем всплытие
      goToNextSlide();
    });
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // Останавливаем всплытие
      goToPrevSlide();
    });
  }
  
  // Добавляем тач-свайп поддержку для мобильных
  let touchStartX = 0;
  let touchEndX = 0;
  
  const textSliderContainer = mainSlider.querySelector('.text-slider-container');
  if (textSliderContainer) {
    textSliderContainer.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    textSliderContainer.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }
  
  function handleSwipe() {
    const swipeThreshold = 50; // Минимальное расстояние свайпа
    
    if (touchEndX < touchStartX - swipeThreshold) {
      // Свайп влево = следующий слайд
      goToNextSlide();
    }
    
    if (touchEndX > touchStartX + swipeThreshold) {
      // Свайп вправо = предыдущий слайд
      goToPrevSlide();
    }
  }
  
  // Инициализация
  updateTextSlides();
});