document.addEventListener("DOMContentLoaded", function() {
  function getSidebar() {
    return document.querySelector('.sidebar');
  }
  function getBackdrop() {
    return document.querySelector('.sidebar-backdrop');
  }
  function openSidebar() {
    console.log('openSidebar called'); // Debug
    const sidebar = getSidebar();
    if (!sidebar) {
      console.error('Sidebar not found!'); // Debug
      return;
    }
    sidebar.classList.add('mobile-open');
    sidebar.style.border = '3px solid #1976d2'; // Debug: make visible
    let backdrop = getBackdrop();
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      sidebar.parentNode.insertBefore(backdrop, sidebar.nextSibling);
    }
    backdrop.style.display = 'block';
    setTimeout(() => { backdrop.style.opacity = 1; }, 10);
    backdrop.onclick = closeSidebar;
    document.body.style.overflow = 'hidden';
    // Trap focus
    sidebar.setAttribute('tabindex', '-1');
    sidebar.focus();
  }
  function closeSidebar() {
    const sidebar = getSidebar();
    if (!sidebar) return;
    sidebar.classList.remove('mobile-open');
    const backdrop = getBackdrop();
    if (backdrop) {
      backdrop.style.opacity = 0;
      setTimeout(() => { backdrop.style.display = 'none'; }, 200);
    }
    document.body.style.overflow = '';
    // Remove focus trap
    sidebar.removeAttribute('tabindex');
  }
  // Toggle on button click
  function handleMenuToggle(e) {
    console.log('Menu button tapped:', e.type); // Debug
    const sidebar = getSidebar();
    if (!sidebar) {
      console.error('Sidebar not found in handler!'); // Debug
      return;
    }
    if (sidebar.classList.contains('mobile-open')) closeSidebar();
    else openSidebar();
  }
  var menuBtn = document.getElementById('mobile-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', handleMenuToggle);
    menuBtn.addEventListener('touchstart', handleMenuToggle, { passive: false });
  } else {
    console.log('Menu button not found!'); // Debug
  }
  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSidebar();
  });
  window.closeSidebar = closeSidebar;
}); 