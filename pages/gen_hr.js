const fs = require('fs');
const path = require('path');

const srcHtml = fs.readFileSync(path.join(__dirname, 'users.html'), 'utf-8');

let newHtml = srcHtml.replace('Control de Usuarios', 'Recursos Humanos y Nómina');
newHtml = newHtml.replace('Personal de Sucursal', 'Expedientes y Planillas');
newHtml = newHtml.replace('Nuevo Usuario', 'Calcular Nómina');
newHtml = newHtml.replace('openUserModal()', 'calculatePayroll()');
newHtml = newHtml.replace('users-table-body', 'hr-table-body');
newHtml = newHtml.replace('users.js?v=20260627004119', 'hr.js');

const thReplace = `
                                        <th class="ps-4">DPI/Doc</th>
                                        <th>Empleado</th>
                                        <th>Cargo</th>
                                        <th>Salario Base</th>
                                        <th>Fecha Alta</th>
                                        <th class="text-end pe-4">Acciones</th>`;
newHtml = newHtml.replace(/<th class="ps-4">ID<\/th>[\s\S]*?<th class="text-end pe-4">Acciones<\/th>/g, thReplace);

const tabsHtml = `
                <ul class="nav nav-tabs mb-4" id="hrTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="expedientes-tab" data-bs-toggle="tab" data-bs-target="#expedientes" type="button" role="tab">Expedientes</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="asistencia-tab" data-bs-toggle="tab" data-bs-target="#asistencia" type="button" role="tab">Asistencia (Reloj)</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="nomina-tab" data-bs-toggle="tab" data-bs-target="#nomina" type="button" role="tab">Nóminas (Planillas)</button>
                    </li>
                </ul>
                <div class="tab-content" id="hrTabsContent">
                    <div class="tab-pane fade show active" id="expedientes" role="tabpanel">
`;

newHtml = newHtml.replace('<div class="row mb-3">', tabsHtml + '<div class="row mb-3">');

const afterTable = `
                    </div>
                    <div class="tab-pane fade" id="asistencia" role="tabpanel">
                        <div class="card border-0 shadow-sm text-center p-5">
                            <h4 class="mb-4">Reloj Biométrico Web</h4>
                            <div class="display-1 fw-bold text-primary mb-4" id="clock-display">00:00:00</div>
                            <div class="mb-4">
                                <select class="form-select w-50 mx-auto" id="attendanceEmployeeSelect">
                                    <option value="">Selecciona tu usuario...</option>
                                </select>
                            </div>
                            <button class="btn btn-success btn-lg px-5 rounded-pill shadow-sm" onclick="registerAttendance()">
                                <i class="bi bi-fingerprint me-2"></i> REGISTRAR ENTRADA/SALIDA
                            </button>
                            <div id="attendance-message" class="mt-3 fw-bold"></div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="nomina" role="tabpanel">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover align-middle mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th class="ps-4">Periodo Inicio</th>
                                                <th>Periodo Fin</th>
                                                <th>Fecha Proceso</th>
                                                <th class="text-end pe-4">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="payroll-runs-body">
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`;
newHtml = newHtml.replace('</div>\n        </main>', afterTable + '</div>\n        </main>');

// Replace modal with HR modal
const hrModal = `
    <!-- HR Modal -->
    <div class="modal fade" id="hrModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content border-0 shadow">
                <div class="modal-header border-bottom-0 pb-0">
                    <h5 class="modal-title fw-bold" id="hrModalLabel">Expediente del Empleado</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="hrForm">
                        <input type="hidden" id="hrUserId">
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-semibold">Nombre Completo</label>
                                <input type="text" class="form-control" id="hrFullName" readonly>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-semibold">DPI / Documento</label>
                                <input type="text" class="form-control" id="hrDocumentId">
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-semibold">Cargo (Puesto)</label>
                                <input type="text" class="form-control" id="hrJobTitle">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-semibold">Salario Base Mensual</label>
                                <input type="number" step="0.01" class="form-control" id="hrSalary">
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-semibold">Bono Adicional Fijo</label>
                                <input type="number" step="0.01" class="form-control" id="hrBaseBonus">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-semibold">Fecha de Contratación</label>
                                <input type="date" class="form-control" id="hrHireDate">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer border-top-0 pt-0">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="saveHrDetails()">Guardar Expediente</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Payroll Details Modal -->
    <div class="modal fade" id="payrollDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content border-0 shadow">
                <div class="modal-header border-bottom-0 pb-0">
                    <h5 class="modal-title fw-bold">Detalle de Planilla</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Empleado</th>
                                    <th>Cargo</th>
                                    <th>Salario Base</th>
                                    <th>Bonos</th>
                                    <th>Deducciones</th>
                                    <th class="text-success fw-bold">Total a Pagar</th>
                                </tr>
                            </thead>
                            <tbody id="payroll-details-body">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

newHtml = newHtml.replace(/<!-- User Modal -->[\s\S]*?<\/form>\s*<\/div>\s*<div class="modal-footer border-top-0 pt-0">\s*<button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar<\/button>\s*<button type="button" class="btn btn-primary" id="btnSaveUser" onclick="saveUser\(\)">Guardar Usuario<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, hrModal);

fs.writeFileSync(path.join(__dirname, 'hr.html'), newHtml);

// Create hr.js
const hrJs = `
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
            tr.innerHTML = \`
                <td class="ps-4 fw-medium">\${user.documentId || 'N/A'}</td>
                <td>\${user.fullName}</td>
                <td>\${user.jobTitle || 'N/A'}</td>
                <td>\$\${(user.salary || 0).toFixed(2)}</td>
                <td>\${user.hireDate ? new Date(user.hireDate).toLocaleDateString() : 'N/A'}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-light" onclick='openHrModal(\${JSON.stringify(user)})' title="Ver Expediente">
                        <i class="bi bi-folder2-open text-primary"></i> Expediente
                    </button>
                </td>
            \`;
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
        hireDate: document.getElementById('hrHireDate').value || null
    };
    
    try {
        await ApiClient.request(\`/Hr/users/\${id}/hr-details\`, 'PUT', payload);
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

async function calculatePayroll() {
    const start = prompt("Fecha inicio de periodo (YYYY-MM-DD):");
    if (!start) return;
    const end = prompt("Fecha fin de periodo (YYYY-MM-DD):");
    if (!end) return;
    
    try {
        const payload = { periodStart: start, periodEnd: end };
        await ApiClient.request('/Hr/payroll/calculate', 'POST', payload);
        showToast('Nómina calculada exitosamente', 'success');
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
            tr.innerHTML = \`
                <td class="ps-4 fw-medium">\${new Date(run.periodStart).toLocaleDateString()}</td>
                <td>\${new Date(run.periodEnd).toLocaleDateString()}</td>
                <td>\${new Date(run.processedDate).toLocaleString()}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-primary" onclick="viewPayrollDetails(\${run.id})">
                        <i class="bi bi-eye"></i> Detalle
                    </button>
                </td>
            \`;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
    }
}

async function viewPayrollDetails(runId) {
    try {
        const details = await ApiClient.request(\`/Hr/payroll/runs/\${runId}/details\`, 'GET');
        const tbody = document.getElementById('payroll-details-body');
        tbody.innerHTML = '';
        
        details.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
                <td>
                    <div class="fw-bold">\${d.fullname}</div>
                    <small class="text-muted">\${d.documentid || ''}</small>
                </td>
                <td>\${d.jobtitle || ''}</td>
                <td>\$\${(d.basesalary || 0).toFixed(2)}</td>
                <td class="text-success">+\$\${(d.bonusamount || 0).toFixed(2)}</td>
                <td class="text-danger">-\$\${(d.deductionsamount || 0).toFixed(2)}</td>
                <td class="text-success fw-bold">\$\${(d.netpay || 0).toFixed(2)}</td>
            \`;
            tbody.appendChild(tr);
        });
        
        new bootstrap.Modal(document.getElementById('payrollDetailsModal')).show();
    } catch (e) {
        showToast('Error al cargar detalle', 'error');
    }
}
`;

fs.writeFileSync(path.join(__dirname, 'hr.js'), hrJs);
