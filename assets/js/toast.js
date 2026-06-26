// assets/js/toast.js
function showToast(message, type = 'info', title = 'Notificación') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    let bgClass = 'bg-primary text-white';
    let icon = 'bi-info-circle';
    
    if (type === 'success') { bgClass = 'bg-success text-white'; icon = 'bi-check-circle'; }
    if (type === 'error' || type === 'danger') { bgClass = 'bg-danger text-white'; icon = 'bi-x-circle'; }
    if (type === 'warning') { bgClass = 'bg-warning text-dark'; icon = 'bi-exclamation-triangle'; }
    
    // Override alert to use this
    const toastId = 'toast-' + Date.now();
    const html = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
          <div class="d-flex">
            <div class="toast-body fw-semibold">
              <i class="bi ${icon} me-2 fs-5 align-middle"></i>
              ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Override native alert globally
window.alert = function(msg) {
    showToast(msg, 'warning');
};
