// Minimal JS to replace Bootstrap's Modal and Dropdown functionality

document.addEventListener('DOMContentLoaded', () => {
    // Load Company Name from localStorage immediately for quick UI update
    const savedName = localStorage.getItem('companyName');
    if (savedName) {
        document.querySelectorAll('#brand-name').forEach(el => el.innerText = savedName);
    }
    
    // Fetch latest from API asynchronously
    if (typeof ApiClient !== 'undefined') {
        ApiClient.request('/Settings', 'GET')
            .then(settings => {
                if (settings && settings.companyName) {
                    localStorage.setItem('companyName', settings.companyName);
                    document.querySelectorAll('#brand-name').forEach(el => el.innerText = settings.companyName);
                }
            })
            .catch(e => console.log('Settings not available or not logged in'));
    }

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

    // 3. Tabs and List Groups
    const tabToggles = document.querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="list"]');
    tabToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active from all tabs in this nav
            const nav = toggle.closest('.nav-tabs, .list-group');
            if (nav) {
                nav.querySelectorAll('.nav-link, .list-group-item').forEach(t => t.classList.remove('active'));
            }
            // Add active to clicked
            toggle.classList.add('active');

            // Hide all tab panes
            let targetSelector = toggle.getAttribute('data-bs-target') || toggle.getAttribute('href');
            // We need to find the container. Usually tab panes have class tab-pane
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
                pane.classList.add('d-none');
            });
            // Show target
            if (targetSelector) {
                const targetPane = document.querySelector(targetSelector);
                if (targetPane) {
                    targetPane.classList.remove('d-none');
                    targetPane.classList.add('show', 'active');
                }
            }
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


window.updateAddressFromCoords = async function(lat, lng, inputId) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'es' }
        });
        const data = await response.json();
        if (data && data.display_name) {
            const el = document.getElementById(inputId);
            if (el) el.value = data.display_name;
        }
    } catch (e) {
        console.error("Geocoding error:", e);
    }
};
