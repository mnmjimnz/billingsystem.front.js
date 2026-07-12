
document.addEventListener('DOMContentLoaded', () => {
    loadHrUsers();
    loadPayrollRuns();
    setInterval(updateClock, 1000);
});

async function loadHrUsers() {
    try {
        const users = await ApiClient.request('/Hr/users', 'GET');
        const tbody = document.getElementById('hr-table-body');
        const select = document.getElementById('attendanceEmployeeSelect');
        tbody.innerHTML = '';
        select.innerHTML = '<option value="">Selecciona tu usuario...</option>';
        
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ps-4 fw-medium">${user.documentId || 'N/A'}</td>
                <td>${user.fullName}</td>
                <td>${user.jobTitle || 'N/A'}</td>
                <td>$${(user.salary || 0).toFixed(2)}</td>
                <td>${user.hireDate ? new Date(user.hireDate).toLocaleDateString() : 'N/A'}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-light" onclick='openHrModal(${JSON.stringify(user)})' title="Ver Expediente">
                        <i class="bi bi-folder2-open text-primary"></i> Expediente
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
            
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.fullName;
            select.appendChild(option);
        });
    } catch (e) {
        showToast('Error cargando empleados', 'error');
    }
}

function openHrModal(user) {
    document.getElementById('hrUserId').value = user.id;
    document.getElementById('hrFullName').value = user.fullName;
    document.getElementById('hrDocumentId').value = user.documentId || '';
    document.getElementById('hrJobTitle').value = user.jobTitle || '';
    document.getElementById('hrSalary').value = user.salary || '';
    document.getElementById('hrBaseBonus').value = user.baseBonus || '';
    document.getElementById('hrIncomeTaxPercentage').value = user.incomeTaxPercentage || 0;
    if (user.hireDate) {
        document.getElementById('hrHireDate').value = user.hireDate.split('T')[0];
    } else {
        document.getElementById('hrHireDate').value = '';
    }
    
    new bootstrap.Modal(document.getElementById('hrModal')).show();
}

async function saveHrDetails() {
    const id = document.getElementById('hrUserId').value;
    const payload = {
        documentId: document.getElementById('hrDocumentId').value,
        jobTitle: document.getElementById('hrJobTitle').value,
        salary: parseFloat(document.getElementById('hrSalary').value) || 0,
        baseBonus: parseFloat(document.getElementById('hrBaseBonus').value) || 0,
        incomeTaxPercentage: parseFloat(document.getElementById('hrIncomeTaxPercentage').value) || 0,
        hireDate: document.getElementById('hrHireDate').value || null
    };
    
    try {
        await ApiClient.request(`/Hr/users/${id}/hr-details`, 'PUT', payload);
        showToast('Expediente actualizado', 'success');
        bootstrap.Modal.getInstance(document.getElementById('hrModal')).hide();
        loadHrUsers();
    } catch (e) {
        showToast('Error al actualizar', 'error');
    }
}

function updateClock() {
    const now = new Date();
    document.getElementById('clock-display').innerText = now.toLocaleTimeString();
}

async function registerAttendance() {
    const userId = document.getElementById('attendanceEmployeeSelect').value;
    if (!userId) {
        showToast('Selecciona un empleado', 'warning');
        return;
    }
    
    try {
        const res = await ApiClient.request('/Hr/attendance/check', 'POST', { userId: parseInt(userId) });
        document.getElementById('attendance-message').innerText = res.message;
        document.getElementById('attendance-message').className = 'mt-3 fw-bold text-success';
        setTimeout(() => document.getElementById('attendance-message').innerText = '', 3000);
    } catch (e) {
        document.getElementById('attendance-message').innerText = e.message || 'Error al registrar';
        document.getElementById('attendance-message').className = 'mt-3 fw-bold text-danger';
    }
}

function calculatePayroll() {
    document.getElementById('calculatePayrollForm').reset();
    new bootstrap.Modal(document.getElementById('calculatePayrollModal')).show();
}

async function confirmCalculatePayroll() {
    const start = document.getElementById('payrollStartDate').value;
    const end = document.getElementById('payrollEndDate').value;
    
    if (!start || !end) {
        showToast('Debes seleccionar ambas fechas', 'warning');
        return;
    }
    
    try {
        const payload = { periodStart: start, periodEnd: end };
        await ApiClient.request('/Hr/payroll/calculate', 'POST', payload);
        showToast('Nómina calculada exitosamente', 'success');
        bootstrap.Modal.getInstance(document.getElementById('calculatePayrollModal')).hide();
        loadPayrollRuns();
    } catch (e) {
        showToast('Error al calcular nómina', 'error');
    }
}

async function loadPayrollRuns() {
    try {
        const runs = await ApiClient.request('/Hr/payroll/runs', 'GET');
        const tbody = document.getElementById('payroll-runs-body');
        tbody.innerHTML = '';
        
        runs.forEach(run => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ps-4 fw-medium">${new Date(run.periodStart).toLocaleDateString()}</td>
                <td>${new Date(run.periodEnd).toLocaleDateString()}</td>
                <td>${new Date(run.processedDate).toLocaleString()}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-primary" onclick="viewPayrollDetails(${run.id})">
                        <i class="bi bi-eye"></i> Detalle
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
    }
}

async function viewPayrollDetails(runId) {
    try {
        const details = await ApiClient.request(`/Hr/payroll/runs/${runId}/details`, 'GET');
        const tbody = document.getElementById('payroll-details-body');
        tbody.innerHTML = '';
        
        details.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-bold">${d.fullname}</div>
                    <small class="text-muted">${d.documentid || ''}</small>
                </td>
                <td>${d.jobtitle || ''}</td>
                <td>$${(d.basesalary || 0).toFixed(2)}</td>
                <td class="text-success">+$${(d.bonusamount || 0).toFixed(2)}</td>
                <td class="text-danger">-$${(d.deductionsamount || 0).toFixed(2)}</td>
                <td class="text-success fw-bold">$${(d.netpay || 0).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        new bootstrap.Modal(document.getElementById('payrollDetailsModal')).show();
    } catch (e) {
        showToast('Error al cargar detalle', 'error');
    }
}
