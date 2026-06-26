document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await ApiClient.request('/Reports/dashboard');
        if (response) {
            renderStats(response.stats);
            renderTopProducts(response.topProducts);
        }
    } catch (e) {
        console.error("Error loading dashboard", e);
    }
});

function renderStats(stats) {
    const container = document.getElementById('stats-cards');
    container.innerHTML = `
        <div class="col-md-3">
            <div class="card text-center shadow-sm h-100 border-primary border-bottom border-3">
                <div class="card-body">
                    <h6 class="text-muted">Ventas Hoy</h6>
                    <h3 class="fw-bold text-primary">$${stats.todaySales.toFixed(2)}</h3>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center shadow-sm h-100 border-danger border-bottom border-3">
                <div class="card-body">
                    <h6 class="text-muted">Compras Hoy</h6>
                    <h3 class="fw-bold text-danger">$${stats.todayPurchases.toFixed(2)}</h3>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center shadow-sm h-100 border-success border-bottom border-3">
                <div class="card-body">
                    <h6 class="text-muted">Total Productos</h6>
                    <h3 class="fw-bold text-success">${stats.totalProducts}</h3>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center shadow-sm h-100 border-info border-bottom border-3">
                <div class="card-body">
                    <h6 class="text-muted">Total Clientes</h6>
                    <h3 class="fw-bold text-info">${stats.totalCustomers}</h3>
                </div>
            </div>
        </div>
    `;
}

function renderTopProducts(products) {
    const tbody = document.getElementById('top-products-body');
    tbody.innerHTML = '';
    products.forEach(p => {
        tbody.innerHTML += `<tr><td>${p.name}</td><td><span class="badge bg-success rounded-pill">${p.totalSold}</span></td></tr>`;
    });
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
