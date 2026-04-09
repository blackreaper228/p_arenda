document.addEventListener("DOMContentLoaded", () => {
  const accordions = [
    document.getElementById("secondAccordion"),
    document.getElementById("lastAccordion"),
  ];

  function closeAll() {
    accordions.forEach((acc) => {
      const card = acc.querySelector(".accordionCard");
      if (!card) return;

      card.style.maxHeight = "0px";
      card.classList.remove("is-open");
    });
  }

  function openCard(card) {
    card.classList.add("is-open");
    card.style.maxHeight = card.scrollHeight + "px";
  }

  // начальное состояние
  closeAll();
  const firstCard = accordions[0].querySelector(".accordionCard");
  if (firstCard) openCard(firstCard);

  // клики
  accordions.forEach((acc) => {
    acc.addEventListener("click", () => {
      const card = acc.querySelector(".accordionCard");
      if (!card) return;

      closeAll();
      openCard(card);
    });
  });
});
