document.addEventListener("DOMContentLoaded", function() {
  function getSidebar() {
    return document.querySelector('.sidebar');
  }
  function getBackdrop() {
    return document.querySelector('.sidebar-backdrop');
  }
  function openSidebar() {
    const sidebar = getSidebar();
    if (!sidebar) return;
    sidebar.classList.add('mobile-open');
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
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'mobile-menu-btn') {
      const sidebar = getSidebar();
      if (sidebar && sidebar.classList.contains('mobile-open')) closeSidebar();
      else openSidebar();
    }
  });
  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSidebar();
  });
}); 