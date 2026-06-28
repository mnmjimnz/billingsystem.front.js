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
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('userName', data.user.name);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userPermissions', JSON.stringify(data.permissions || []));
                window.location.href = 'pos.html';
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
