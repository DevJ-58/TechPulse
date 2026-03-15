// JS pour about.html
import { qs } from '../utils/dom.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // Burger menu functionality
  const burger = qs('#burger');
  const mobileNav = qs('#nav-mobile');

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });
  }

  // à compléter selon besoins réels
});
