// Minimal JS to replace Bootstrap's Modal and Dropdown functionality

document.addEventListener('DOMContentLoaded', () => {
    // 1. Modals
    const modalToggles = document.querySelectorAll('[data-bs-toggle="modal"]');
    const modalDismisses = document.querySelectorAll('[data-bs-dismiss="modal"]');

    modalToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSelector = toggle.getAttribute('data-bs-target');
            if (targetSelector) {
                const targetModal = document.querySelector(targetSelector);
                if (targetModal) {
                    targetModal.classList.add('show');
                }
            }
        });
    });

    modalDismisses.forEach(dismiss => {
        dismiss.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = dismiss.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Close modal on click outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // 2. Dropdowns
    const dropdownToggles = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dropdown = toggle.closest('.dropdown');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            // Close other dropdowns
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });

            if (menu) {
                menu.classList.toggle('show');
            }
        });
    });

    // Close dropdowns on click outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    });
});

// Polyfill for legacy scripts that expect bootstrap.Modal
window.bootstrap = {
    Modal: class {
        constructor(element) {
            this.element = typeof element === 'string' ? document.querySelector(element) : element;
            if (this.element) {
                this.element._modalInstance = this;
            }
        }
        show() {
            if (this.element) {
                this.element.classList.add('show');
            }
        }
        hide() {
            if (this.element) {
                this.element.classList.remove('show');
            }
        }
        static getInstance(element) {
            return element ? (element._modalInstance || new window.bootstrap.Modal(element)) : null;
        }
    }
};
