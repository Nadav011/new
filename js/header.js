// Header mobile menu functionality
function initHeader() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mainNav = document.querySelector('.main-nav');
  
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      mainNav.classList.toggle('mobile-open');
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        mainNav.classList.remove('mobile-open');
      });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!mainNav.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
        mainNav.classList.remove('mobile-open');
      }
    });
  } else {
    // Retry if elements aren't found yet
    setTimeout(initHeader, 100);
  }
  
  // Set active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}

// Also try to initialize after a short delay as a fallback
setTimeout(initHeader, 500); 

document.addEventListener('mousedown', function(e) {
  const tag = e.target.tagName.toLowerCase();
  if (!['input', 'textarea', 'select', 'button'].includes(tag)) {
    e.preventDefault();
    if (typeof e.target.blur === 'function') e.target.blur();
  }
}); 