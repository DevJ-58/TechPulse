/**
 * QuerySelector avec parent optionnel
 * @param {string} selector
 * @param {Element|Document} [parent]
 * @returns {Element|null}
 */
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * QuerySelectorAll en array
 * @param {string} selector
 * @param {Element|Document} [parent]
 * @returns {Element[]}
 */
export function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Affiche un élément
 * @param {Element} el
 */
export function show(el) {
  if (el) el.style.display = '';
}

/**
 * Cache un élément
 * @param {Element} el
 */
export function hide(el) {
  if (el) el.style.display = 'none';
}

/**
 * Toggle affichage
 * @param {Element} el
 */
export function toggle(el) {
  if (el) el.style.display = (el.style.display === 'none' ? '' : 'none');
}

/**
 * Met un bouton en loading
 * @param {HTMLButtonElement} btn
 * @param {boolean} isLoading
 */
export function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = !!isLoading;
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = '...';
  } else if (btn.dataset.originalText) {
    btn.textContent = btn.dataset.originalText;
    delete btn.dataset.originalText;
  }
}

/**
 * Vide tous les champs d'un formulaire
 * @param {HTMLFormElement} formEl
 */
export function clearForm(formEl) {
  if (!formEl) return;
  qsa('input, select, textarea', formEl).forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = false;
    } else {
      el.value = '';
    }
  });
}
