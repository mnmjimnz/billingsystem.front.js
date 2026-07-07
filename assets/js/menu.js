document.addEventListener('DOMContentLoaded', () => {
    generateMenu();
    checkRouteAccess();
});

const MENU_ITEMS = [
    { url: 'pos.html', icon: 'bi-shop', text: 'Punto de Venta', permission: 'MANAGE_POS' },
    { url: 'purchases.html', icon: 'bi-cart-plus', text: 'Compras', permission: 'MANAGE_PURCHASES' },
    { url: 'purchase-history.html', icon: 'bi-clock-history', text: 'Historial de Compras', permission: 'MANAGE_PURCHASES' },
    { url: 'receivables.html', icon: 'bi-cash-coin', text: 'Cuentas por Cobrar', permission: 'MANAGE_RECEIVABLES' },
    { url: 'payables.html', icon: 'bi-wallet2', text: 'Cuentas por Pagar', permission: 'MANAGE_PAYABLES' },
    { url: 'reports.html', icon: 'bi-bar-chart-fill', text: 'Reportes', permission: 'VIEW_REPORTS' },
    { url: 'products.html', icon: 'bi-box-seam', text: 'Productos', permission: 'MANAGE_PRODUCTS' },
    { url: 'kardex.html', icon: 'bi-card-list', text: 'Kardex de Inventario', permission: 'VIEW_KARDEX' },
    { url: 'orders.html', icon: 'bi-signpost-split', text: 'Pedidos y Entregas', permission: 'MANAGE_ORDERS' },
    { url: 'stock-transfers.html', icon: 'bi-truck', text: 'Traslados de Sucursal', permission: 'MANAGE_TRANSFERS' },
    { url: 'categories.html', icon: 'bi-tags', text: 'Categorías', permission: 'MANAGE_CATEGORIES' },
    { url: 'customers.html', icon: 'bi-people', text: 'Clientes', permission: 'MANAGE_CUSTOMERS' },
    { url: 'suppliers.html', icon: 'bi-truck', text: 'Proveedores', permission: 'MANAGE_SUPPLIERS' },
    { url: 'users.html', icon: 'bi-person-badge', text: 'Usuarios', permission: 'MANAGE_USERS' },
    { url: 'roles.html', icon: 'bi-shield-lock', text: 'Roles y Permisos', permission: 'MANAGE_ROLES' },
    { url: 'branches.html', icon: 'bi-buildings', text: 'Sucursales', permission: 'MANAGE_BRANCHES' },
    { url: 'branch-movements.html', icon: 'bi-arrow-left-right', text: 'Movimientos', permission: 'MANAGE_MOVEMENTS' },
    { url: 'settings.html', icon: 'bi-gear', text: 'Configuración', permission: 'MANAGE_SETTINGS' }
];

function generateMenu() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;

    let userPermissions = [];
    try {
        const stored = localStorage.getItem('userPermissions');
        if (stored) {
            userPermissions = JSON.parse(stored);
        }
    } catch(e) {
        console.error("Error parseando permisos:", e);
    }

    const currentUrl = window.location.pathname.split('/').pop() || 'pos.html';
    nav.innerHTML = '';

    MENU_ITEMS.forEach(item => {
        if (userPermissions.includes(item.permission) || localStorage.getItem('userRole') === '1') {
            const a = document.createElement('a');
            a.href = item.url;
            a.className = `nav-link ${currentUrl === item.url ? 'active' : ''}`;
            a.innerHTML = `<i class="bi ${item.icon}"></i> ${item.text}`;
            nav.appendChild(a);
        }
    });
}

function checkRouteAccess() {
    const currentUrl = window.location.pathname.split('/').pop() || 'pos.html';
    
    // Ignore access control for login page and unauthorized page
    if (currentUrl === 'login.html' || currentUrl === 'unauthorized.html') return;

    let userPermissions = [];
    try {
        const stored = localStorage.getItem('userPermissions');
        if (stored) {
            userPermissions = JSON.parse(stored);
        }
    } catch(e) {}

    const menuItem = MENU_ITEMS.find(item => item.url === currentUrl);
    
    if (menuItem) {
        if (!userPermissions.includes(menuItem.permission) && localStorage.getItem('userRole') !== '1') {
            // Usuario no tiene permiso
            window.location.href = 'unauthorized.html';
        }
    }
}
