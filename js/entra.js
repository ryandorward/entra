const body = document.querySelector('body')
const logo = document.getElementById('entra-logo')
const toggle_container = document.querySelector('.toggle-container')
const nav_container = document.querySelector('.nav-outer')
const down_arrow = document.querySelector('.arrow-down')
const first_section = document.querySelector('article section:first-child')

let height = window.innerHeight

window.scroll()
scrollHandler()

// Initialize things
window.onLoad = function() {
  window.scrollTo(0,1)
  calculateVh()
  scrollHandler() // initialize scroll state, in case the page loads part way down (mobile seems to override the window.scrollTo(0,1) above)
}

// Listen to the resize event
window.addEventListener('resize', () => {
  calculateVh()
})

// Listen to scroll event
window.onscroll = scrollHandler

function scrollHandler() {
  const scrollTop = window.scrollY
  const fromTop = height - (scrollTop*2)

  if (fromTop <= 0)
    logo.style.width = "0%";
  else  {
    const percent = 50*fromTop/height;
    logo.style.width = percent + "%";
  }

  if (scrollTop <= 5 ) {
    down_arrow.classList.add('active')
    //toggle_container.classList.remove('hide')
    nav_container.classList.remove('hide')
    body.classList.add('show-picture')
  }
  else {
    down_arrow.classList.remove('active')
    // toggle_container.classList.add('hide')
    nav_container.classList.add('hide')
    body.classList.remove('show-picture')
  }

}

down_arrow.addEventListener('click', function () {
  if (this.classList.contains('active')) {
    window.scrollTo({
      top: getTop(first_section) - 10,
      behavior: 'smooth'
    })
  }
}, false);

function calculateVh() {
  height = window.innerHeight // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
  const vh = height * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`) // Then we set the value in the --vh custom property to the root of the document
}

/* Background toggler */
const toggler = document.querySelector('.toggle-container input')
toggler.addEventListener('change', (event) => {
  event.currentTarget.checked ? body.classList.add('with-picture') : body.classList.remove('with-picture')
  window.localStorage.setItem('background-toggle-state', event.currentTarget.checked);
})
const toggleState = window.localStorage.getItem('background-toggle-state')
if (toggleState === 'false') {
  toggler.checked = false
  body.classList.remove('with-picture')
}

function getTop(element) {
  const rect = element.getBoundingClientRect()
  return rect.top
}
