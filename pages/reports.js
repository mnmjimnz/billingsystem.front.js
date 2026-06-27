let currentPaymentType = 'CASH';
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    document.getElementById('filterStartDate').value = start.toISOString().split('T')[0];
    document.getElementById('filterEndDate').value = end.toISOString().split('T')[0];

    // Listeners for filters
    const filterInputs = ['filterStartDate', 'filterEndDate', 'filterBranchId', 'filterUserId'];
    filterInputs.forEach(id => {
        document.getElementById(id).addEventListener('change', reloadCurrentTab);
    });

    await loadFilterOptions();
    loadSalesReport(); // Load first tab by default
});

async function loadFilterOptions() {
    try {
        const branches = await ApiClient.request('/Branches');
        const branchSelect = document.getElementById('filterBranchId');
        branches.forEach(b => {
            branchSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`;
        });

        const users = await ApiClient.request('/Users');
        const userSelect = document.getElementById('filterUserId');
        users.forEach(u => {
            userSelect.innerHTML += `<option value="${u.id}">${u.fullName || u.username}</option>`;
        });
    } catch(e) {
        console.error("Error cargando filtros", e);
    }
}

function getFilterParams() {
    const start = document.getElementById('filterStartDate').value;
    const end = document.getElementById('filterEndDate').value;
    const branch = document.getElementById('filterBranchId').value;
    const user = document.getElementById('filterUserId').value;
    
    let query = `?`;
    if (start) query += `startDate=${start}&`;
    if (end) query += `endDate=${end}T23:59:59&`;
    if (branch) query += `branchId=${branch}&`;
    if (user) query += `userId=${user}&`;
    
    return query;
}

function reloadCurrentTab() {
    const activeTab = document.querySelector('#reportTabs button.active').id;
    if (activeTab === 'sales-tab') loadSalesReport();
    if (activeTab === 'kardex-tab') loadKardexReport();
    if (activeTab === 'cashflow-tab') loadCashFlowReport();
    if (activeTab === 'stats-tab') loadStats();
}

/* ================= VENTAS ================= */
async function loadSalesReport() {
    try {
        let query = getFilterParams() + `paymentType=${currentPaymentType}`;
        const data = await ApiClient.request(`/Reports/sales${query}`);
        
        const tbody = document.getElementById('salesTableBody');
        tbody.innerHTML = '';
        let totalSum = 0;

        data.forEach(s => {
            totalSum += s.total;
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(s.createdAt).toLocaleString()}</td>
                    <td class="fw-bold">${s.ticketNumber}</td>
                    <td>${s.customerName || 'Consumidor Final'}</td>
                    <td>${s.userName}</td>
                    <td>${s.branchName}</td>
                    <td><span class="badge ${s.paymentType === 'CASH' ? 'bg-success' : 'bg-warning text-dark'}">${s.paymentType}</span></td>
                    <td class="text-end fw-bold">$${s.total.toFixed(2)}</td>
                </tr>
            `;
        });
        
        // Add Total Row
        tbody.innerHTML += `
            <tr class="table-light">
                <td colspan="6" class="text-end fw-bold">TOTAL:</td>
                <td class="text-end fw-bold text-primary fs-5">$${totalSum.toFixed(2)}</td>
            </tr>
        `;
    } catch (e) {
        console.error(e);
    }
}

/* ================= KARDEX ================= */
async function loadKardexReport() {
    try {
        const data = await ApiClient.request(`/Reports/kardex${getFilterParams()}`);
        const tbody = document.getElementById('kardexTableBody');
        tbody.innerHTML = '';

        data.forEach(k => {
            const isEntry = k.movementType === 'IN';
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(k.createdAt).toLocaleString()}</td>
                    <td class="fw-semibold">${k.productName}</td>
                    <td><span class="badge ${isEntry ? 'bg-success' : 'bg-danger'}">${k.movementType}</span></td>
                    <td>${k.description}</td>
                    <td class="text-end ${isEntry ? 'text-success' : 'text-danger'} fw-bold">${isEntry ? '+' : '-'}${k.quantity}</td>
                    <td class="text-end text-secondary">${k.previousStock}</td>
                    <td class="text-end fw-bold">${k.newStock}</td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

/* ================= CASH FLOW ================= */
async function loadCashFlowReport() {
    try {
        const data = await ApiClient.request(`/Reports/cash-flow${getFilterParams()}`);
        const tbody = document.getElementById('cashflowTableBody');
        tbody.innerHTML = '';
        
        let totalIn = 0;
        let totalOut = 0;

        data.forEach(c => {
            const isEntry = c.type === 'IN';
            if (isEntry) totalIn += c.amount;
            else totalOut += c.amount;

            tbody.innerHTML += `
                <tr>
                    <td>${new Date(c.date).toLocaleString()}</td>
                    <td><span class="badge ${isEntry ? 'bg-success' : 'bg-danger'}">${c.category}</span></td>
                    <td>${c.description}</td>
                    <td>${c.branchName || 'N/A'}</td>
                    <td class="text-end text-success fw-bold">${isEntry ? '$'+c.amount.toFixed(2) : '-'}</td>
                    <td class="text-end text-danger fw-bold">${!isEntry ? '$'+c.amount.toFixed(2) : '-'}</td>
                </tr>
            `;
        });

        const balance = totalIn - totalOut;
        const balanceEl = document.getElementById('cashflowBalance');
        balanceEl.innerText = `Balance Total: $${balance.toFixed(2)}`;
        balanceEl.className = `fw-bold mb-0 ${balance >= 0 ? 'text-success' : 'text-danger'}`;
        
        // Add Total Row
        tbody.innerHTML += `
            <tr class="table-light fw-bold">
                <td colspan="4" class="text-end">TOTALES:</td>
                <td class="text-end text-success">$${totalIn.toFixed(2)}</td>
                <td class="text-end text-danger">$${totalOut.toFixed(2)}</td>
            </tr>
        `;
    } catch (e) { console.error(e); }
}

/* ================= ESTADISTICAS ================= */
async function loadStats() {
    // Delay rendering slightly to ensure the tab's display:none is fully removed by the browser
    // This allows Chart.js to accurately calculate the container's height and prevents infinite expansion
    setTimeout(async () => {
        try {
            // Top Products
            const prods = await ApiClient.request(`/Reports/top-products?limit=10`);
            renderChart('topProductsChart', 'bar', prods.map(p => p.productName), prods.map(p => p.totalQuantitySold), 'Cantidad Vendida', '#ffc107');

            // Top Suppliers
            const sups = await ApiClient.request(`/Reports/top-suppliers?limit=10`);
            renderChart('topSuppliersChart', 'doughnut', sups.map(s => s.supplierName), sups.map(s => s.totalVolume), 'Volumen Comprado', ['#0dcaf0', '#0d6efd', '#198754', '#ffc107', '#dc3545']);

            // Sales Comparison
            const period = document.getElementById('comparisonPeriod').value;
            const comp = await ApiClient.request(`/Reports/sales-comparison${getFilterParams()}&periodType=${period}`);
            
            // Reverse array so chronological order is left to right
            const reversedComp = [...comp].reverse();
            renderChart('salesComparisonChart', 'line', reversedComp.map(c => c.period), reversedComp.map(c => c.totalSales), 'Ventas Totales ($)', '#0d6efd');
        } catch (e) { console.error(e); }
    }, 50);
}

function renderChart(canvasId, type, labels, data, label, colors) {
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    const ctx = document.getElementById(canvasId).getContext('2d');
    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: colors,
                borderColor: type === 'line' ? colors : 'transparent',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/* ================= EXPORTACION ================= */
function exportExcel(tableId, filename) {
    const table = document.getElementById(tableId);
    const wb = XLSX.utils.table_to_book(table, {sheet: "Reporte"});
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportPDF(tableId, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text(filename.replace('_', ' '), 14, 15);
    
    doc.autoTable({ 
        html: `#${tableId}`,
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 }
    });
    
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
