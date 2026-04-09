let toastContainer = null;

/**
 * Affiche un toast animé
 * @param {string} message
 * @param {"default"|"success"|"error"|"warning"} type
 */
export function showToast(message, type = "default") {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '30px';
    toastContainer.style.right = '30px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.transition = 'opacity 0.2s';
  toast.style.opacity = '0';
  toast.style.marginTop = '8px';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '6px';
  toast.style.color = '#fff';
  toast.style.fontWeight = 'bold';
  toast.style.background = {
    success: '#2ecc40',
    error: '#e74c3c',
    warning: '#f39c12',
    default: '#222'
  }[type] || '#222';
  toastContainer.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '1'; }, 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

