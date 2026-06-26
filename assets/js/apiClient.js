const API_BASE_URL = 'https://billingsystem-net10pg.onrender.com/api'; // Ajustar según puerto de .NET
//const API_BASE_URL = 'https://localhost:7145/api'; // Ajustar según puerto de .NET

const ApiClient = {
    getToken: () => localStorage.getItem('jwt_token'),
    setToken: (token) => localStorage.setItem('jwt_token', token),
    clearToken: () => localStorage.removeItem('jwt_token'),

    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            if (response.status === 401) {
                // Unauthorized, redirect to login
                //window.location.href = '/pages/login.html';
                console.log(JSON.stringify(response));
                return null;
            }
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Error de red' }));
                throw new Error(error.message || 'Error en la petición');
            }
            // Retorna null si es 204 No Content
            if (response.status === 204) return null;
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
