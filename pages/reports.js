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
    const activeTab = document.querySelector('#reportTabs .active').id;
    if (activeTab === 'sales-tab') loadSalesReport();
    if (activeTab === 'purchases-tab') loadPurchasesReport();
    if (activeTab === 'kardex-tab') loadKardexReport();
    if (activeTab === 'cashflow-tab') loadCashFlowReport();
    if (activeTab === 'useractivity-tab') loadUserActivityReport();
    if (activeTab === 'financials-tab') loadFinancials();
    if (activeTab === 'stats-tab') loadStats();
}


function updateReportMeta(prefix) {
    const branchSel = document.getElementById('filterBranchId');
    const branchName = branchSel.options[branchSel.selectedIndex].text;
    const userSel = document.getElementById('filterUserId');
    const userName = userSel.options[userSel.selectedIndex].text;
    const start = document.getElementById('filterStartDate').value;
    const end = document.getElementById('filterEndDate').value;
    
    const elBranch = document.getElementById(prefix + '-meta-branch');
    const elUser = document.getElementById(prefix + '-meta-user');
    const elPeriod = document.getElementById(prefix + '-meta-period');
    const elPrinted = document.getElementById(prefix + '-meta-printed');
    
    if(elBranch) elBranch.innerText = branchName;
    if(elUser) elUser.innerText = userName;
    if(elPeriod) elPeriod.innerText = `${start} a ${end}`;
    if(elPrinted) elPrinted.innerText = new Date().toLocaleDateString();
}

/* ================= VENTAS ================= */
async function loadSalesReport() {
    try {
        let query = getFilterParams();
        const data = await ApiClient.request(`/Reports/sales${query}`);
        updateReportMeta("sales");
        
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
                    <td><span class="badge ${s.paymentType === 'CASH' ? 'bg-success' : 'bg-warning text-dark'}">${s.paymentType === 'CASH' ? 'EFECTIVO' : 'CRÉDITO'}</span></td>
                    <td class="text-end fw-bold">$${s.total.toFixed(2)}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML += `
            <tr class="report-total-row border-top border-2">
                <td colspan="6" class="text-end fw-bold">TOTAL:</td>
                <td class="text-end fw-bold text-primary fs-5">$${totalSum.toFixed(2)}</td>
            </tr>
        `;
    } catch (e) { console.error(e); }
}

/* ================= COMPRAS ================= */
async function loadPurchasesReport() {
    try {
        let query = getFilterParams();
        const data = await ApiClient.request(`/Reports/purchases${query}`);
        updateReportMeta("purchases");
        
        const tbody = document.getElementById('purchasesTableBody');
        tbody.innerHTML = '';
        let totalSum = 0;

        data.forEach(p => {
            totalSum += p.total;
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(p.date).toLocaleString()}</td>
                    <td class="fw-bold">${p.invoiceNumber}</td>
                    <td>${p.supplierName}</td>
                    <td>${p.userName}</td>
                    <td>${p.branchName || 'Central'}</td>
                    <td><span class="badge bg-secondary">${p.status}</span></td>
                    <td class="text-end fw-bold">$${p.total.toFixed(2)}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML += `
            <tr class="report-total-row border-top border-2">
                <td colspan="6" class="text-end fw-bold">TOTAL:</td>
                <td class="text-end fw-bold text-danger fs-5">$${totalSum.toFixed(2)}</td>
            </tr>
        `;
    } catch (e) { console.error(e); }
}

/* ================= KARDEX ================= */
async function loadKardexReport() {
    try {
        const data = await ApiClient.request(`/Reports/kardex${getFilterParams()}`);
        updateReportMeta("kardex");
        const tbody = document.getElementById('kardexTableBody');
        tbody.innerHTML = '';

        data.forEach(k => {
            const isEntry = k.movementType === 'IN';
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(k.createdAt).toLocaleString()}</td>
                    <td class="fw-semibold">${k.productName}</td>
                    <td><span class="badge border ${isEntry ? 'border-success text-success' : 'border-danger text-danger'} bg-transparent">${isEntry ? 'ENTRADA' : 'SALIDA'}</span></td>
                    <td>${k.description}</td>
                    <td class="text-end ${isEntry ? 'text-success' : 'text-danger'} fw-bold">${isEntry ? '+' : '-'}${k.quantity}</td>
                    <td class="text-end text-secondary">${k.previousStock}</td>
                    <td class="text-end fw-bold">${k.newStock}</td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

/* ================= ACTIVIDAD USUARIOS ================= */
async function loadUserActivityReport() {
    try {
        const data = await ApiClient.request(`/Reports/user-activity${getFilterParams()}`);
        updateReportMeta("activity");
        const tbody = document.getElementById('activityTableBody');
        tbody.innerHTML = '';

        data.forEach(a => {
            const isClosed = a.status === 'CLOSED';
            tbody.innerHTML += `
                <tr>
                    <td class="fw-semibold">${a.userName}</td>
                    <td>${a.branchName}</td>
                    <td>${new Date(a.openingTime).toLocaleString()}</td>
                    <td>${a.closingTime ? new Date(a.closingTime).toLocaleString() : '-'}</td>
                    <td class="text-end fw-bold">$${a.openingBalance.toFixed(2)}</td>
                    <td class="text-end fw-bold ${isClosed ? 'text-primary' : 'text-secondary'}">$${a.closingBalance.toFixed(2)}</td>
                    <td><span class="badge ${isClosed ? 'bg-secondary' : 'bg-success'}">${isClosed ? 'CERRADO' : 'ABIERTO'}</span></td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

/* ================= ESTADOS FINANCIEROS ================= */
async function loadFinancials() {
    try {
        // Balance General
        const bs = await ApiClient.request(`/Reports/balance-sheet`);
        document.getElementById('bs-cash').innerText = '$' + bs.cashAndEquivalents.toFixed(2);
        document.getElementById('bs-ar').innerText = '$' + bs.accountsReceivable.toFixed(2);
        document.getElementById('bs-inv').innerText = '$' + bs.inventoryValue.toFixed(2);
        document.getElementById('bs-total-assets').innerText = '$' + bs.totalAssets.toFixed(2);
        
        document.getElementById('bs-ap').innerText = '$' + bs.accountsPayable.toFixed(2);
        document.getElementById('bs-total-liab').innerText = '$' + bs.totalLiabilities.toFixed(2);
        
        document.getElementById('bs-equity').innerText = '$' + bs.equity.toFixed(2);
        document.getElementById('bs-total-le').innerText = '$' + (bs.totalLiabilities + bs.equity).toFixed(2);

        // Estado de Resultados
        const is = await ApiClient.request(`/Reports/income-statement${getFilterParams()}`);
        document.getElementById('is-rev').innerText = '$' + is.revenue.toFixed(2);
        document.getElementById('is-cogs').innerText = '-$' + is.costOfGoodsSold.toFixed(2);
        document.getElementById('is-gross').innerText = '$' + is.grossProfit.toFixed(2);
        document.getElementById('is-opex').innerText = '-$' + is.operatingExpenses.toFixed(2);
        document.getElementById('is-net').innerText = '$' + is.netIncome.toFixed(2);

        if(is.netIncome < 0) {
            document.getElementById('is-net').classList.replace('text-primary', 'text-danger');
        } else {
            document.getElementById('is-net').classList.replace('text-danger', 'text-primary');
        }

    } catch(e) { console.error(e); }
}

/* ================= CASH FLOW ================= */
async function loadCashFlowReport() {
    try {
        const data = await ApiClient.request(`/Reports/cash-flow${getFilterParams()}`);
        updateReportMeta("cashflow");
        const tbody = document.getElementById('cashflowTableBody');
        tbody.innerHTML = '';
        
        let totalIn = 0;
        let totalOut = 0;

        data.forEach(c => {
            const isEntry = c.type === 'IN';
            if (isEntry) totalIn += c.amount;
            else totalOut += c.amount;

            const categoryMap = {
                'SALE': 'Venta Operativa',
                'PURCHASE': 'Adquisición',
                'AR_PAYMENT': 'Recaudo Cuentas por Cobrar',
                'AP_PAYMENT': 'Pago a Proveedores',
                'BRANCH_MOVEMENT': 'Gasto/Mov. Interno'
            };
            const catLabel = categoryMap[c.category] || c.category;

            tbody.innerHTML += `
                <tr>
                    <td>${new Date(c.date).toLocaleString()}</td>
                    <td class="fw-semibold text-secondary">${catLabel}</td>
                    <td>${c.description}</td>
                    <td>${c.branchName || 'Consolidado Global'}</td>
                    <td class="text-end text-success fw-bold">${isEntry ? '$'+c.amount.toFixed(2) : '-'}</td>
                    <td class="text-end text-danger fw-bold">${!isEntry ? '$'+c.amount.toFixed(2) : '-'}</td>
                </tr>
            `;
        });

        const balance = totalIn - totalOut;
        const balanceEl = document.getElementById('cashflowBalance');
        balanceEl.innerText = `$${balance.toFixed(2)}`;
        balanceEl.className = `${balance >= 0 ? 'text-success' : 'text-danger'}`;
        
        tbody.innerHTML += `
            <tr class="report-total-row fw-bold border-top border-2">
                <td colspan="4" class="text-end">FLUJO NETO CONSOLIDADO:</td>
                <td class="text-end text-success fs-6">$${totalIn.toFixed(2)}</td>
                <td class="text-end text-danger fs-6">$${totalOut.toFixed(2)}</td>
            </tr>
        `;
    } catch (e) { console.error(e); }
}

/* ================= ESTADISTICAS ================= */
async function loadStats() {
    setTimeout(async () => {
        try {
            // Analytics
            const period = document.getElementById('analyticsPeriod').value;
            const analytics = await ApiClient.request(`/Reports/sales-analytics${getFilterParams()}&groupBy=${period}`);
            
            // Render Analytics Line Chart
            if (charts['salesAnalyticsChart']) charts['salesAnalyticsChart'].destroy();
            const ctxAnalytics = document.getElementById('salesAnalyticsChart').getContext('2d');
            charts['salesAnalyticsChart'] = new Chart(ctxAnalytics, {
                type: 'bar',
                data: {
                    labels: analytics.map(a => a.groupKey),
                    datasets: [
                        { label: 'Ventas Contado', data: analytics.map(a => a.cashSales), backgroundColor: '#198754' },
                        { label: 'Ventas Crédito', data: analytics.map(a => a.creditSales), backgroundColor: '#ffc107' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
            });

            // Top Products
            const prods = await ApiClient.request(`/Reports/top-products?limit=10`);
            renderChart('topProductsChart', 'bar', prods.map(p => p.productName), prods.map(p => p.totalQuantitySold), 'Cantidad Vendida', '#0d6efd');

            // Top Suppliers
            const sups = await ApiClient.request(`/Reports/top-suppliers?limit=10`);
            renderChart('topSuppliersChart', 'doughnut', sups.map(s => s.supplierName), sups.map(s => s.totalVolume), 'Volumen Comprado ($)', ['#0dcaf0', '#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d']);

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
    const doc = new jsPDF('p', 'pt', 'letter');
    
    doc.setFontSize(18);
    doc.setTextColor(33, 43, 89);
    doc.setFont('helvetica', 'bold');
    doc.text(filename.replace(/_/g, ' '), 40, 45);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reporte generado el: ${new Date().toLocaleString()}`, 40, 60);
    
    doc.autoTable({ 
        html: `#${tableId}`,
        startY: 75,
        theme: 'grid',
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.5 },
        headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        didParseCell: function(data) {
            if (data.row.raw && data.row.raw.classList && data.row.raw.classList.contains('report-total-row')) {
                data.cell.styles.fillColor = [225, 230, 235];
                data.cell.styles.textColor = [0, 0, 0];
                data.cell.styles.fontStyle = 'bold';
            }
            if (data.section === 'body') {
                const text = data.cell.text[0] || '';
                if (text.trim().startsWith('$') || text.trim().startsWith('+') || text.trim().startsWith('-') || (!isNaN(text.trim()) && text.trim().length > 0)) {
                    data.cell.styles.halign = 'right';
                }
            }
        }
    });
    
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
