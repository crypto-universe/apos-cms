// import Swiper JS
import Swiper from 'swiper/bundle';
// import PhotoSwipeLightbox from 'photoswipe/lightbox';
// import PhotoSwipe from 'photoswipe';

export default () => {
  apos.util.widgetPlayers['image-gallery'] = {
    selector: '[data-image-gallery]',
    player: function (el) {
      const slides = el.dataset.slides || 1;

      // Adjusting Swiper.js initialization for responsive breakpoints
      const swiper = new Swiper(el, {
        slidesPerView: 1, // Default to 1 slide per view for mobile
        spaceBetween: 10, // Reduced space for mobile
        loop: true, // Enable loop mode
        autoplay: {
          delay: 2500, // Delay in ms between auto transitions (e.g., 2500ms)
          disableOnInteraction: true // Continue autoplay on swipe
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

      // Commented out the PhotoSwipe lightbox and gallery initialization
      /*
      const photoSwipeOptions = {
        mainClass: 'imageGallery--pswp',
        gallery: '#imageGallery',
        pswpModule: PhotoSwipe,
        // set background opacity
        bgOpacity: 1,
        showHideOpacity: true,
        children: 'a',
        loop: true,
        showHideAnimationType: 'fade',

        // Click on image moves to the next slide
        imageClickAction: 'next',
        tapAction: 'next',

        // Hiding a specific UI element
        zoom: false,
        close: true,
        counter: true,
        arrowKeys: true
      };

      const lightbox = new PhotoSwipeLightbox(photoSwipeOptions);

      lightbox.init();

      lightbox.on('change', () => {
        const { pswp } = lightbox;
        swiper.slideTo(pswp.currIndex, 0, false);
      });

      lightbox.on('afterInit', () => {
        if (swiper.params.autoplay.enabled) {
          swiper.autoplay.stop();
        }
      });

      lightbox.on('closingAnimationStart', () => {
        const { pswp } = lightbox;
        swiper.slideTo(pswp.currIndex, 0, false);
        // if autoplay enabled == true -> autoplay.start() when close lightbox
        if (swiper.params.autoplay.enabled) {
          swiper.autoplay.start();
        }
      });
      */
    }
  };
};
