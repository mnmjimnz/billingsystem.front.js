document.addEventListener('DOMContentLoaded', async () => {
    await loadProductsForFilter();
    await loadKardex();
});

async function loadProductsForFilter() {
    try {
        const products = await ApiClient.request('/Products');
        const select = document.getElementById('kardex-product-filter');
        products.forEach(p => {
            select.innerHTML += `<option value="${p.id}">${p.barcode ? `[${p.barcode}] ` : ''}${p.name}</option>`;
        });
    } catch (e) {
        console.error("Error loading products for filter", e);
    }
}

async function loadKardex() {
    try {
        const productId = document.getElementById('kardex-product-filter').value;
        const url = productId ? `/Kardex?productId=${productId}` : '/Kardex';
        const data = await ApiClient.request(url);
        
        const tbody = document.getElementById('kardex-table-body');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary py-4">No hay movimientos registrados.</td></tr>';
            return;
        }

        data.forEach(item => {
            const isEntry = item.movementType === 'IN';
            const moveBadge = isEntry ? '<span class="badge bg-success-subtle text-success border border-success-subtle">ENTRADA</span>' 
                                      : '<span class="badge bg-danger-subtle text-danger border border-danger-subtle">SALIDA</span>';
            
            const qtyClass = isEntry ? 'text-success fw-bold' : 'text-danger fw-bold';
            const qtySign = isEntry ? '+' : '-';

            tbody.innerHTML += `
                <tr>
                    <td><small class="text-muted">${new Date(item.createdAt).toLocaleString()}</small></td>
                    <td>
                        <div class="fw-semibold">${item.productName}</div>
                        ${item.barcode ? `<small class="text-muted">${item.barcode}</small>` : ''}
                    </td>
                    <td>${moveBadge}</td>
                    <td><span class="badge bg-light text-dark border">${item.referenceType} #${item.referenceId || ''}</span></td>
                    <td><span class="text-muted small">${item.description || ''}</span></td>
                    <td class="text-center">${item.previousStock}</td>
                    <td class="text-center ${qtyClass}">${qtySign}${item.quantity}</td>
                    <td class="text-center fw-bold text-primary">${item.newStock}</td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error loading kardex", e);
        showToast('Error al cargar el Kardex', 'error');
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
