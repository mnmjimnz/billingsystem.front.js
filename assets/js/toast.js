// assets/js/toast.js
function showToast(message, type = 'info', title = 'Notificación') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    let bgClass = 'bg-primary';
    let icon = 'bi-info-circle';
    
    if (type === 'success') { bgClass = 'bg-success'; icon = 'bi-check-circle'; }
    if (type === 'error' || type === 'danger') { bgClass = 'bg-danger'; icon = 'bi-x-circle'; }
    if (type === 'warning') { bgClass = 'bg-warning'; icon = 'bi-exclamation-triangle'; }
    
    const toastId = 'toast-' + Date.now();
    const html = `
        <div id="${toastId}" class="toast ${bgClass}" role="alert">
          <div class="toast-body">
            <i class="bi ${icon} fs-5"></i>
            <span>${message}</span>
            <button type="button" class="btn-close" style="margin-left:auto" aria-label="Close">&times;</button>
          </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    const toastEl = document.getElementById(toastId);
    
    // Show toast
    setTimeout(() => {
        toastEl.classList.add('show');
    }, 10);
    
    // Close button
    const closeBtn = toastEl.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 300);
    });

    // Auto dismiss after 4s
    setTimeout(() => {
        if (toastEl && toastEl.parentElement) {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.remove(), 300);
        }
    }, 4000);
}

// Override native alert globally
window.alert = function(msg) {
    showToast(msg, 'warning');
};
