export default () => {
  // Your own project level JS may go here
  console.log('Нужна работа? Пиши нам 💎');


  window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');

    if (preloader) {
      const minTime = 1; // 1 second
      const maxTime = 1.5; // 1.5 seconds
      const loadTime = Math.random() * (maxTime - minTime) + minTime; // Random time between 1 and 1.5 seconds

      setTimeout(() => {
        preloader.classList.add('hidden');
      }, loadTime);
    } else {
    }
  });


  document.addEventListener("DOMContentLoaded", function () {

    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const mainElement = document.querySelector(".main"); // Targeting the main element


    sidebarToggle.addEventListener("click", function () {
      mainElement.classList.toggle("sidebar-visible"); // Toggle class on the main element
    }, { passive: true });

    document.addEventListener("click", function (event) {
      if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
        mainElement.classList.remove("sidebar-visible"); // Remove class from the main element
      }
    }, { passive: true });
  });


  function navFunc() {
    var context = document.querySelector("#headernav");
    if (!context) {
      console.error("Element with ID 'headernav' not found.");
      return;
    }

    var headerCoreHeight, deviceWidth;

    context.querySelector(".nav__hmb").addEventListener("click", function(e) {
      e.preventDefault();
      this.classList.toggle("active");
      context.querySelector(".nav__core").classList.toggle("active");

      if (context.querySelector(".nav__core:not(.active)")) {
        if (context.querySelector(".nav__sub__item.active") && context.querySelector(".nav__core__link--sub.active")) {
          context.querySelector(".nav__sub.active").classList.remove("active");
          context.querySelector(".nav__sub__item.active").classList.remove("active");
          context.querySelector(".nav__core__link--sub.active").classList.remove("active");
          context.querySelector('.nav__sub').style.minHeight = 0 + 'px';
        }
      }
    });

    context.querySelectorAll(".nav__core__link--sub").forEach(element => {
      element.addEventListener("click", function(e) {
        e.preventDefault();

        let elementNum = element.dataset.presub;
        deviceWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;

        if (element.classList.contains("active")) {
          context.querySelector(".nav__sub").classList.remove("active");
          context.querySelector('.nav__sub__item[data-sub="' + elementNum + '"]').classList.remove("active");
          context.querySelector('.nav__core__link--sub[data-presub="' + elementNum + '"]').classList.remove("active");
          context.querySelector('.nav__sub').style.minHeight = 0 + 'px';
        } else {
          if (context.querySelector(".nav__sub__item.active") && context.querySelector(".nav__core__link--sub.active")) {
            context.querySelector(".nav__sub.active").classList.remove("active");
            context.querySelector(".nav__sub__item.active").classList.remove("active");
            context.querySelector(".nav__core__link--sub.active").classList.remove("active");
            context.querySelector('.nav__sub').style.minHeight = 0 + 'px';
          }

          element.classList.add("active");
          context.querySelector(".nav__sub").classList.add("active");
          context.querySelector('.nav__sub__item[data-sub="' + elementNum + '"]').classList.add("active");

          if (deviceWidth < 769) {
            headerCoreHeight = context.querySelector(".nav__core").clientHeight;
            context.querySelector('.nav__sub').style.minHeight = headerCoreHeight + "px";
            context.querySelector('.nav__sub').style.left = "0px";
          }
          if (deviceWidth >= 769) {
            let subActiveXoffset = context.querySelector(".nav__core__link--sub.active").getBoundingClientRect().left;
            let subActiveWidth = context.querySelector(".nav__core__link--sub.active").getBoundingClientRect().width;
            let subActiveFinalLeft = parseInt(subActiveXoffset - 105 + subActiveWidth);
            context.querySelector(".nav__sub.active").style.left = subActiveFinalLeft + "px";
          }
        }
      });
    });

    context.querySelector(".nav__sub__exit").addEventListener("click", () => {
      context.querySelector(".nav__sub.active").classList.remove("active");
      context.querySelector(".nav__sub__item.active").classList.remove("active");
      context.querySelector(".nav__core__link--sub.active").classList.remove("active");
      context.querySelector('.nav__sub').style.minHeight = 0 + 'px';
    });

    window.addEventListener('resize', () => {
      headerCoreHeight = context.querySelector(".nav__core").clientHeight;
      deviceWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    });

    function closeMenus(e) {
      if (!context.contains(e.target)) {
        if (context.querySelector(".nav__sub__item.active") && context.querySelector(".nav__core__link--sub.active")) {
          context.querySelector(".nav__sub.active").classList.remove("active");
          context.querySelector(".nav__sub__item.active").classList.remove("active");
          context.querySelector(".nav__core__link--sub.active").classList.remove("active");
          context.querySelector('.nav__sub').style.minHeight = 0 + 'px';
        }

        if (context.querySelector(".nav__core.active")) {
          context.querySelector(".nav__core").classList.remove("active");
          context.querySelector(".nav__hmb.active").classList.remove("active");
        }
      }
    }

    document.addEventListener("click", closeMenus);
    document.addEventListener("touchstart", closeMenus);
  }

  navFunc();





};
