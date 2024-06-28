// import Swiper JS
import Swiper from 'swiper/bundle';


export default () => {
  apos.util.widgetPlayers['image-gallery'] = {
    selector: '[data-image-gallery]',
    player: function (el) {
      const slides = el.dataset.slides || 1;

      const swiper = new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 10,
        loop: true,
        autoplay: {
          delay: 2500,
          disableOnInteraction: true
        },
        navigation: {
          nextEl: '.button-arrow--next',
          prevEl: '.button-arrow--prev',
        },
        breakpoints: {
          640: {
            slidesPerView: slides,
            spaceBetween: 0
          }
        }
      });

    }
  };
};
