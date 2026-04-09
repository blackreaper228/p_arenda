document.addEventListener("DOMContentLoaded", () => {
  const offersContainer = document.querySelector(".W_Offers");
  const offers = document.querySelectorAll(".W_Offer");
  const totalOffers = offers.length;
  let currentIndex = 0;

  const leftArrow = document.querySelector(".U_LeftOffer");
  const rightArrow = document.querySelector(".U_RightOffer");

  // Update the mobile counter
  const currentCountElement = document.querySelector(
    ".A_Mobilecount.U_Dynamic"
  );
  const totalCountElement = document.querySelector(".A_Mobilecount:last-child");
  totalCountElement.textContent = totalOffers;

  // Function to get the width of a slide including gap
  const getSlideWidth = () => {
    const slide = offers[0];
    const slideWidth = slide.getBoundingClientRect().width;
    const containerStyles = window.getComputedStyle(offersContainer);
    const gapWidth = parseFloat(
      containerStyles.columnGap || containerStyles.gap || 0
    );
    return slideWidth + gapWidth;
  };

  const updateSliderPosition = () => {
    const slideWidth = getSlideWidth();
    const translateX = -(currentIndex * slideWidth);
    offersContainer.style.transform = `translateX(${translateX}px)`;
    currentCountElement.textContent = currentIndex + 1;
  };

  rightArrow.addEventListener("click", () => {
    if (currentIndex < totalOffers - 1) {
      currentIndex++;
      updateSliderPosition();
    }
  });

  leftArrow.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSliderPosition();
    }
  });

  // Optional: Update slide width on window resize
  window.addEventListener("resize", updateSliderPosition);
});
