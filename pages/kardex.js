let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadKardex();
});

async function loadKardex(page = 1) {
    try {
        currentPage = page;
        const result = await ApiClient.request(`/Kardex/paged?page=${page}&pageSize=10&search=${encodeURIComponent(currentSearch)}`);
        
        const tbody = document.getElementById('kardex-table-body');
        tbody.innerHTML = '';

        const data = result.items || [];
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary py-4">No hay movimientos registrados.</td></tr>';
            document.getElementById('pagination-container').innerHTML = '';
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
        
        renderPagination('pagination-container', result, 'loadKardex');
    } catch (e) {
        console.error("Error loading kardex", e);
        showToast('Error al cargar el Kardex', 'error');
    }
}

function handleSearch(event) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = event.target.value;
        loadKardex(1);
    }, 500);
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
