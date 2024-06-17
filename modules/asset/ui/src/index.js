export default () => {
  // Your own project level JS may go here
  console.log('Нужна работа? Пиши нам 💎');

  function navFunc() {
    var context = document.querySelector("#headernav")
    var headerCoreHeight, deviceWidth

    context.querySelector(".nav__hmb").addEventListener("click", function(e) {
      e.preventDefault()
      this.classList.toggle("active")
      context.querySelector(".nav__core").classList.toggle("active")

      if(context.querySelector(".nav__core:not(.active)")) {
        if(context.querySelector(".nav__sub__item.active") && context.querySelector(".nav__core__link--sub.active")) {
          context.querySelector(".nav__sub.active").classList.remove("active");
          context.querySelector(".nav__sub__item.active").classList.remove("active");
          context.querySelector(".nav__core__link--sub.active").classList.remove("active");
          context.querySelector('.nav__sub').style.minHeight = 0+'px'
        }
      }
    })

    context.querySelectorAll(".nav__core__link--sub").forEach(element => {
      element.addEventListener("click", function(e) {
        e.preventDefault()

        let elementNum = element.dataset.presub
        deviceWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width

        if(element.classList.contains("active")) {
          context.querySelector(".nav__sub").classList.remove("active")
          context.querySelector('.nav__sub__item[data-sub="'+elementNum+'"]').classList.remove("active")
          context.querySelector('.nav__core__link--sub[data-presub="'+elementNum+'"]').classList.remove("active")
          context.querySelector('.nav__sub').style.minHeight = 0+'px'
        } else {
          if(context.querySelector(".nav__sub__item.active") && context.querySelector(".nav__core__link--sub.active")) {
            context.querySelector(".nav__sub.active").classList.remove("active")
            context.querySelector(".nav__sub__item.active").classList.remove("active")
            context.querySelector(".nav__core__link--sub.active").classList.remove("active")
            context.querySelector('.nav__sub').style.minHeight = 0+'px'
          }

          element.classList.add("active")
          context.querySelector(".nav__sub").classList.add("active")
          context.querySelector('.nav__sub__item[data-sub="'+elementNum+'"]').classList.add("active")

          if(deviceWidth < 769) {
            headerCoreHeight = context.querySelector(".nav__core").clientHeight
            context.querySelector('.nav__sub').style.minHeight = headerCoreHeight+"px"
            context.querySelector('.nav__sub').style.left = "0px"
          }
          if(deviceWidth >= 769) {
            let subActiveXoffset = context.querySelector(".nav__core__link--sub.active").getBoundingClientRect().left
            let subActiveWidth = context.querySelector(".nav__core__link--sub.active").getBoundingClientRect().width
            let subActiveFinalLeft = parseInt(subActiveXoffset - 105 + subActiveWidth)
            context.querySelector(".nav__sub.active").style.left = subActiveFinalLeft+"px"
          }
        }
      })
    })

    context.querySelector(".nav__sub__exit").addEventListener("click", () => {
      context.querySelector(".nav__sub.active").classList.remove("active")
      context.querySelector(".nav__sub__item.active").classList.remove("active")
      context.querySelector(".nav__core__link--sub.active").classList.remove("active")
      context.querySelector('.nav__sub').style.minHeight = 0+'px'
    })

    window.addEventListener('resize', () =>
    {
      headerCoreHeight = context.querySelector(".nav__core").clientHeight
      deviceWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width
    })

    function closeMenus(e) {
      if (!context.contains(e.target)) {
        if (context.querySelector(".nav__sub__item.active") && context.querySelector(".nav__core__link--sub.active")) {
          context.querySelector(".nav__sub.active").classList.remove("active");
          context.querySelector(".nav__sub__item.active").classList.remove("active");
          context.querySelector(".nav__core__link--sub.active").classList.remove("active");
          context.querySelector('.nav__sub').style.minHeight = 0+'px';
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




  console.clear()
  if (!CSS.supports('anchor-name: --anchor')) {

    /**
     * Run an event listener on the list.
     * Set the bounding properties based on closest element
     */
    const LIST = document.querySelector('ul')
    LIST.dataset.enhanced = true
    let current
    const sync = () => {
      if (current) {
        const BOUNDS = current.getBoundingClientRect()
        LIST.style.setProperty('--top', BOUNDS.top)
        LIST.style.setProperty('--right', BOUNDS.right)
        LIST.style.setProperty('--bottom', BOUNDS.bottom)
        LIST.style.setProperty('--left', BOUNDS.left)
        LIST.style.setProperty('--height', BOUNDS.height)
        LIST.style.setProperty('--width', BOUNDS.width)
      }
    }
    const UPDATE = ({ x, y }) => {
      const ARTICLE = document.elementFromPoint(x, y).closest('li').querySelector('article')
      if (ARTICLE !== current) {
        current = ARTICLE
        // Set the bounds
        sync()
      }
    }
    LIST.addEventListener('pointermove', UPDATE)
    window.addEventListener('resize', sync)
  }



};
