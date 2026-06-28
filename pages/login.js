document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Conectando...';
        btn.disabled = true;

        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        
        try {
            // Utilizando la petición centralizada que usa el API_BASE_URL correcto internamente
            const data = await ApiClient.request('/Auth/login', 'POST', { username: u, password: p });
            
            if (data && data.token) {
                ApiClient.setToken(data.token);
                const roleId = data.user.roleId || data.user.role;
                const permissions = data.permissions || [];
                
                localStorage.setItem('userRole', roleId);
                localStorage.setItem('userName', data.user.name || data.user.fullName || data.user.username);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userPermissions', JSON.stringify(permissions));
                
                if (roleId === 1 || roleId === '1' || permissions.includes('ADMIN_ALL')) {
                    window.location.href = 'pos.html';
                } else {
                    const routes = [
                        { url: 'pos.html', perm: 'MANAGE_POS' },
                        { url: 'purchases.html', perm: 'MANAGE_PURCHASES' },
                        { url: 'receivables.html', perm: 'MANAGE_RECEIVABLES' },
                        { url: 'payables.html', perm: 'MANAGE_PAYABLES' },
                        { url: 'reports.html', perm: 'VIEW_REPORTS' },
                        { url: 'products.html', perm: 'MANAGE_PRODUCTS' },
                        { url: 'kardex.html', perm: 'VIEW_KARDEX' },
                        { url: 'categories.html', perm: 'MANAGE_CATEGORIES' },
                        { url: 'customers.html', perm: 'MANAGE_CUSTOMERS' },
                        { url: 'suppliers.html', perm: 'MANAGE_SUPPLIERS' },
                        { url: 'users.html', perm: 'MANAGE_USERS' },
                        { url: 'roles.html', perm: 'MANAGE_ROLES' },
                        { url: 'branches.html', perm: 'MANAGE_BRANCHES' },
                        { url: 'branch-movements.html', perm: 'MANAGE_MOVEMENTS' },
                        { url: 'settings.html', perm: 'MANAGE_SETTINGS' }
                    ];

                    const firstRoute = routes.find(r => permissions.includes(r.perm));
                    
                    if (firstRoute) {
                        window.location.href = firstRoute.url;
                    } else {
                        window.location.href = 'unauthorized.html';
                    }
                }
            } else {
                showError('Respuesta inesperada del servidor.');
                resetButton(btn, originalText);
            }
        } catch(err) {
            showError('Credenciales inválidas o error de conexión con el servidor.');
            resetButton(btn, originalText);
        }
    });
});

function showError(message) {
    const alertBox = document.getElementById('error-alert');
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
}

function resetButton(btn, originalText) {
    btn.innerHTML = originalText;
    btn.disabled = false;
}
