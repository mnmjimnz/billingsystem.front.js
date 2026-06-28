
document.addEventListener('DOMContentLoaded', async () => {
    if (!ApiClient.getToken()) {
        window.location.href = '../index.html';
        return;
    }

    initSidebar();
    await loadBranches();
    await loadProducts();
    await loadTransfers();
});

let branches = [];
let products = [];
let transferModalInstance;

function initSidebar() {
    try {
        
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('show');
        });
        
        const path = window.location.pathname;
        const links = document.querySelectorAll('.sidebar .nav-link');
        links.forEach(link => {
            if (path.includes(link.getAttribute('href'))) {
                link.classList.add('active');
            }
        });
        
        initUserProfile();
    } catch (e) {
        console.error("Error loading layout components", e);
    }
}

async function loadBranches() {
    try {
        branches = await ApiClient.request('/Branches') || [];
        const fromSelect = document.getElementById('fromBranchSelect');
        const toSelect = document.getElementById('toBranchSelect');
        
        const options = branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        fromSelect.innerHTML = '<option value="">Seleccione origen...</option>' + options;
        toSelect.innerHTML = '<option value="">Seleccione destino...</option>' + options;
    } catch (e) {
        console.error("Error loading branches", e);
    }
}

async function loadProducts() {
    try {
        products = await ApiClient.request('/Products') || [];
        const select = document.getElementById('productSelect');
        const options = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        select.innerHTML = '<option value="">Seleccione un producto...</option>' + options;
    } catch (e) {
        console.error("Error loading products", e);
    }
}

async function loadTransfers() {
    try {
        const transfers = await ApiClient.request('/StockTransfers') || [];
        const tbody = document.getElementById('transfersList');
        
        if (transfers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No se han realizado traslados.</td></tr>';
            return;
        }

        tbody.innerHTML = transfers.map(t => `
            <tr>
                <td>${new Date(t.createdAt).toLocaleString()}</td>
                <td class="fw-semibold">${t.productName}</td>
                <td><span class="badge bg-light text-dark border">${t.fromBranchName}</span></td>
                <td><span class="badge bg-info text-white">${t.toBranchName}</span></td>
                <td class="fw-bold">${t.quantity}</td>
                <td>${t.userName}</td>
                <td class="small text-muted">${t.notes || ''}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error("Error loading transfers", e);
        document.getElementById('transfersList').innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error al cargar traslados</td></tr>';
    }
}

function openTransferModal() {
    if (!transferModalInstance) {
        transferModalInstance = new bootstrap.Modal(document.getElementById('transferModal'));
    }
    document.getElementById('transferForm').reset();
    document.getElementById('stockAlert').style.display = 'none';
    transferModalInstance.show();
}

async function loadProductStock() {
    const productId = document.getElementById('productSelect').value;
    const branchId = document.getElementById('fromBranchSelect').value;
    const alert = document.getElementById('stockAlert');
    const stockLabel = document.getElementById('availableStock');
    const qtyInput = document.getElementById('transferQuantity');

    if (productId && branchId) {
        try {
            // Need to get specific stock for this branch
            const stock = await ApiClient.request(`/Products/${productId}/stock`);
            const branchStock = stock.find(s => s.branchId == branchId);
            const currentStock = branchStock ? branchStock.stock : 0;
            
            stockLabel.innerText = currentStock;
            alert.style.display = 'block';
            qtyInput.max = currentStock;
        } catch (e) {
            console.error("Error fetching stock", e);
        }
    } else {
        alert.style.display = 'none';
    }
}

async function processTransfer() {
    const productId = document.getElementById('productSelect').value;
    const fromBranchId = document.getElementById('fromBranchSelect').value;
    const toBranchId = document.getElementById('toBranchSelect').value;
    const quantity = document.getElementById('transferQuantity').value;
    const notes = document.getElementById('transferNotes').value;

    if (!productId || !fromBranchId || !toBranchId || !quantity) {
        showToast("Complete todos los campos requeridos.", "error");
        return;
    }

    if (fromBranchId === toBranchId) {
        showToast("La sucursal de origen y destino deben ser diferentes.", "error");
        return;
    }

    const availableStock = parseInt(document.getElementById('availableStock').innerText);
    if (parseInt(quantity) > availableStock) {
        showToast("La cantidad a trasladar supera el stock disponible en la sucursal de origen.", "error");
        return;
    }

    const btn = document.getElementById('btnProcessTransfer');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

    try {
        await ApiClient.request('/StockTransfers', 'POST', {
            productId: parseInt(productId),
            fromBranchId: parseInt(fromBranchId),
            toBranchId: parseInt(toBranchId),
            quantity: parseInt(quantity),
            notes: notes
        });

        showToast("Traslado procesado exitosamente.", "success");
        transferModalInstance.hide();
        loadTransfers();
    } catch (e) {
        showToast(e.message || "Error al procesar el traslado.", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Procesar Traslado';
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast' + Date.now();
    const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
}
function initUserProfile() {
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    const userName = localStorage.getItem('userName');
    const roleName = localStorage.getItem('roleName');
    if (userName) {
        document.getElementById('userProfileName').innerText = userName;
        document.getElementById('userProfileRole').innerText = roleName;
    }
}
function logout() {
    ApiClient.clearToken();
    window.location.href = '../index.html';
}
