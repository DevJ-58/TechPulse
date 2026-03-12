// Mobile Menu Burger Toggle
document.addEventListener('DOMContentLoaded', function() {
  const burger = document.querySelector('.nav-burger');
  const drawer = document.querySelector('.nav-drawer');
  const closeBtn = document.querySelector('.nav-drawer-close');
  const drawerLinks = document.querySelectorAll('.nav-drawer-links a, .nav-drawer-cta a');

  if (!burger || !drawer) return;

  // Open menu
  burger.addEventListener('click', function() {
    drawer.classList.add('open');
    burger.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  // Close menu
  function closeMenu() {
    drawer.classList.remove('open');
    burger.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // Close on link click
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on outside click
  document.addEventListener('click', function(e) {
    if (!drawer.contains(e.target) && !burger.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });
});
