export default () => {
  // Your own project level JS may go here
  console.log('Нужна работа? Пиши нам 💎');
  document.addEventListener("DOMContentLoaded", function () {
    function throttle(func, limit) {
      let lastCall = 0;
      return function() {
        const now = Date.now();
        if (now - lastCall >= limit) {
          lastCall = now;
          func.apply(this, arguments);
        }
      };
    }

    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const readingProgressContainer = document.querySelector(".reading-progress-container");

    sidebarToggle.addEventListener("click", function () {
      document.body.classList.toggle("sidebar-visible");
    }, { passive: true });

    const headers = document.querySelectorAll(".post-content :is(h1, h2, h3)");

    const fragment = document.createDocumentFragment();
    headers.forEach((header, index) => {
      const headerId = header.id || `header${index + 1}`;
      header.id = headerId;
      header.setAttribute("tabindex", "0");

      // Check if the link already exists
      if (!sidebar.querySelector(`[href="#${headerId}"]`)) {
        const link = document.createElement("a");
        link.href = `#${headerId}`;
        link.textContent = header.textContent;
        link.className = "sidebar-link";
        link.dataset.headerId = headerId;

        fragment.appendChild(link);
      }
    });
    sidebar.insertBefore(fragment, readingProgressContainer);

    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    sidebarLinks.forEach((link) => {
      link.addEventListener("click", function (event) {
        event.preventDefault();

        const targetId = this.getAttribute("href").substring(1);
        const targetHeader = document.getElementById(targetId);

        if (targetHeader) {
          const headerOffset =
              targetHeader.getBoundingClientRect().top +
              window.pageYOffset -
              window.innerHeight / 2 +
              targetHeader.offsetHeight / 2;
          window.scrollTo({ top: headerOffset, behavior: "smooth" });
        }
      });
    });

    function handleScroll() {
      let lastPassedHeaderId = null;

      headers.forEach((header) => {
        if (header.getBoundingClientRect().top < window.innerHeight / 2) {
          lastPassedHeaderId = header.id;
        }
      });

      sidebarLinks.forEach((link) => {
        if (lastPassedHeaderId === link.dataset.headerId) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });

      const firstHeader = headers[0];
      const paragraphs = document.querySelectorAll(".post-content p");
      const lastParagraph = paragraphs[paragraphs.length - 1];

      const startOffset =
          firstHeader.getBoundingClientRect().top +
          window.pageYOffset -
          window.innerHeight / 2;
      const endOffset =
          lastParagraph.getBoundingClientRect().bottom +
          window.pageYOffset -
          window.innerHeight / 2;

      const scrollTop = window.pageYOffset;
      const scrollRange = endOffset - startOffset;
      const scrollPosition = scrollTop - startOffset;

      let progress = scrollPosition / scrollRange;
      progress = Math.max(0, Math.min(1, progress));

      document.querySelector(".reading-progress-bar").style.width =
          progress * 100 + "%";
    }

    document.addEventListener("scroll", throttle(handleScroll, 25), { passive: true });

    document.addEventListener("click", function (event) {
      if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
        document.body.classList.remove("sidebar-visible");
      }
    }, { passive: true });
  });
  console.clear()
};
