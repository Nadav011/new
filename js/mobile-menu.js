// Sidebar toggle removed: sidebar is hidden on mobile by CSS, no JS needed.

document.addEventListener("DOMContentLoaded", function() {
  var sidebar = document.querySelector('.sidebar');
  var menuBtn = document.getElementById('mobile-menu-btn');
  var closeBtn = document.querySelector('.sidebar-close-btn');
  var backdrop = document.querySelector('.sidebar-backdrop');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.style.display = 'block';
  }
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.style.display = 'none';
  }

  // Toggle button
  if (menuBtn) {
    menuBtn.addEventListener('click', function(e) {
      openSidebar();
    });
  }
  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      closeSidebar();
    });
  }
  // Backdrop
  if (backdrop) {
    backdrop.addEventListener('click', function(e) {
      closeSidebar();
    });
  }

  // Hide sidebar and toggle button on desktop
  function handleResize() {
    if (window.innerWidth > 900) {
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.style.display = 'none';
      if (menuBtn) menuBtn.style.display = 'none';
      if (closeBtn) closeBtn.style.display = 'none';
    } else {
      if (menuBtn) menuBtn.style.display = 'flex';
      if (closeBtn) closeBtn.style.display = 'flex';
    }
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // Expose for inline close button
  window.closeSidebar = closeSidebar;
}); 