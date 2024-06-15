export default () => {
  // Your own project level JS may go here
  console.log('Hello World');

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
