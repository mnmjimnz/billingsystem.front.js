document.addEventListener('DOMContentLoaded', () => {
    loadAccounts();
    
    // Set default dates for journals
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('journalStartDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('journalEndDate').value = today.toISOString().split('T')[0];
    document.getElementById('reportDate').value = today.toISOString().split('T')[0];
});

let accountsData = [];

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
    
    if (tabId === 'journals') {
        loadJournals();
    }
}

async function loadAccounts() {
    try {
        const accounts = await ApiClient.request('/Accounting/accounts', 'GET');
        accountsData = accounts;
        renderAccountsTree(accounts);
        populateParentDropdown(accounts);
    } catch (error) {
        showToast('Error cargando catálogo de cuentas', 'error');
    }
}

function renderAccountsTree(accounts) {
    const container = document.getElementById('accounts-tree');
    container.innerHTML = '';
    
    if (accounts.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-muted">No hay cuentas registradas.</div>';
        return;
    }

    // Build hierarchy
    const map = {};
    const roots = [];
    
    accounts.forEach(acc => {
        map[acc.id] = { ...acc, children: [] };
    });
    
    accounts.forEach(acc => {
        if (acc.parentAccountId) {
            if (map[acc.parentAccountId]) {
                map[acc.parentAccountId].children.push(map[acc.id]);
            }
        } else {
            roots.push(map[acc.id]);
        }
    });

    const createNodeHTML = (node, margin = 0) => {
        const typeLabels = {
            'Asset': 'Activo',
            'Liability': 'Pasivo',
            'Equity': 'Capital',
            'Revenue': 'Ingreso',
            'Cost': 'Costo',
            'Expense': 'Gasto'
        };
        
        let html = `
            <div class="tree-item" style="margin-left: ${margin}px">
                <div>
                    <span class="account-code">${node.code}</span>
                    <span class="account-name">${node.name}</span>
                </div>
                <div>
                    <span class="account-type">${typeLabels[node.type] || node.type}</span>
                    ${node.allowsTransactions ? '<span class="account-type" style="background:#e3f2fd;color:#1976d2">Transaccional</span>' : ''}
                </div>
            </div>
        `;
        
        if (node.children && node.children.length > 0) {
            node.children.sort((a,b) => a.code.localeCompare(b.code));
            node.children.forEach(child => {
                html += createNodeHTML(child, margin + 20);
            });
        }
        
        return html;
    };

    roots.sort((a,b) => a.code.localeCompare(b.code));
    let treeHTML = '';
    roots.forEach(root => {
        treeHTML += createNodeHTML(root, 0);
    });

    container.innerHTML = treeHTML;
}

function populateParentDropdown(accounts) {
    const select = document.getElementById('parentAccountId');
    select.innerHTML = '<option value="">-- Ninguna (Cuenta de Mayor) --</option>';
    
    // Solo permitir cuentas que NO son transaccionales como padres, o todas si se prefiere.
    const eligibleParents = accounts.filter(a => !a.allowsTransactions);
    eligibleParents.sort((a,b) => a.code.localeCompare(b.code));
    
    eligibleParents.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = `${acc.code} - ${acc.name}`;
        select.appendChild(option);
    });
}

function openAccountModal() {
    document.getElementById('accountForm').reset();
    document.getElementById('accountId').value = '';
    document.getElementById('accountModalTitle').textContent = 'Nueva Cuenta Contable';
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    modal.show();
}

function closeAccountModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
    if (modal) modal.hide();
}

async function saveAccount() {
    const id = document.getElementById('accountId').value;
    
    const account = {
        code: document.getElementById('accountCode').value,
        name: document.getElementById('accountName').value,
        type: document.getElementById('accountType').value,
        parentAccountId: document.getElementById('parentAccountId').value ? parseInt(document.getElementById('parentAccountId').value) : null,
        allowsTransactions: document.getElementById('allowsTransactions').checked,
        level: document.getElementById('parentAccountId').value ? 2 : 1 // simplified level logic
    };

    try {
        if (id) {
            await ApiClient.request(`/Accounting/accounts/${id}`, 'PUT', account);
            showToast('Cuenta actualizada exitosamente', 'success');
        } else {
            await ApiClient.request('/Accounting/accounts', 'POST', account);
            showToast('Cuenta creada exitosamente', 'success');
        }
        closeAccountModal();
        loadAccounts();
    } catch (error) {
        showToast('Error al guardar la cuenta', 'error');
    }
}

async function loadJournals() {
    const start = document.getElementById('journalStartDate').value;
    const end = document.getElementById('journalEndDate').value;
    
    try {
        const journals = await ApiClient.request(`/Accounting/journal-entries?startDate=${start}&endDate=${end}`, 'GET');
        const tbody = document.getElementById('journalsTableBody');
        tbody.innerHTML = '';
        
        if (journals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay pólizas en este rango de fechas.</td></tr>';
            return;
        }

        journals.forEach(j => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${j.id}</td>
                <td>${new Date(j.date).toLocaleString()}</td>
                <td>${j.description}</td>
                <td>${j.referenceType} #${j.referenceId}</td>
                <td>
                    <button class="dx-btn dx-btn-secondary dx-btn-sm" onclick="viewJournalDetails(${j.id})">
                        <i class="bi bi-eye"></i> Ver Detalles
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showToast('Error al cargar pólizas', 'error');
    }
}

async function viewJournalDetails(id) {
    try {
        const journal = await ApiClient.request(`/Accounting/journal-entries/${id}`, 'GET');
        const container = document.getElementById('journalDetailsContainer');
        const tbody = document.getElementById('journalDetailsBody');
        
        document.getElementById('detailJournalId').textContent = id;
        tbody.innerHTML = '';
        
        let totalDebit = 0;
        let totalCredit = 0;
        
        journal.details.forEach(d => {
            totalDebit += d.debit;
            totalCredit += d.credit;
            
            const tr = document.createElement('tr');
            
            // Map account code/name if available from current accountsData
            const acc = accountsData.find(a => a.id === d.accountId);
            const code = acc ? acc.code : d.accountCode;
            const name = acc ? acc.name : d.accountName;
            
            tr.innerHTML = `
                <td>${code || d.accountId}</td>
                <td>${name || '-'}</td>
                <td class="text-end">$${d.debit.toFixed(2)}</td>
                <td class="text-end">$${d.credit.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('totalDebit').textContent = `$${totalDebit.toFixed(2)}`;
        document.getElementById('totalCredit').textContent = `$${totalCredit.toFixed(2)}`;
        
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showToast('Error al cargar detalles de póliza', 'error');
    }
}

async function loadTrialBalance() {
    const startDate = document.getElementById('startDate').value;
    const reportDate = document.getElementById('reportDate').value;
    
    if (!startDate || !reportDate) {
        showToast('Debe seleccionar ambas fechas', 'warning');
        return;
    }

    try {
        const balances = await ApiClient.request(`/Accounting/trial-balance?startDate=${startDate}&endDate=${reportDate}`, 'GET');
        const tbody = document.getElementById('trialBalanceBody');
        tbody.innerHTML = '';
        const tfoot = document.getElementById('trialBalanceFoot');
        tfoot.style.display = 'table-row-group';
        
        if (balances.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay datos contables.</td></tr>';
            return;
        }

        let totalDebit = 0;
        let totalCredit = 0;
        
        const typeLabels = {
            'Asset': 'Activo',
            'Liability': 'Pasivo',
            'Equity': 'Capital',
            'Revenue': 'Ingreso',
            'Cost': 'Costo',
            'Expense': 'Gasto'
        };
        console.log(balances);
        balances.forEach(b => {
            // Handle casing and nulls (PostgreSQL expando keys are lowercase)
            const bInitialBalance = b.initialbalance || b.initialBalance || b.InitialBalance || 0;
            const bPeriodDebit = b.perioddebit || b.periodDebit || b.PeriodDebit || 0;
            const bPeriodCredit = b.periodcredit || b.periodCredit || b.PeriodCredit || 0;
            
            // Only show accounts with activity
            if (bInitialBalance === 0 && bPeriodDebit === 0 && bPeriodCredit === 0) return;
            
            totalDebit += bPeriodDebit;
            totalCredit += bPeriodCredit;
            
            let initial = 0;
            let netBalance = 0;
            const type = b.type || b.Type;
            
            // Naturaleza de las cuentas
            if (type === 'Asset' || type === 'Expense' || type === 'Cost') {
                initial = bInitialBalance; // Debit - Credit
                netBalance = initial + bPeriodDebit - bPeriodCredit;
            } else {
                initial = -bInitialBalance; // Credit - Debit
                netBalance = initial + bPeriodCredit - bPeriodDebit;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${b.code || b.Code}</td>
                <td>${b.name || b.Name}</td>
                <td>${typeLabels[type] || type}</td>
                <td class="text-end" style="color: ${initial < 0 ? 'red' : 'inherit'}">$${initial.toFixed(2)}</td>
                <td class="text-end">$${bPeriodDebit.toFixed(2)}</td>
                <td class="text-end">$${bPeriodCredit.toFixed(2)}</td>
                <td class="text-end font-weight-bold" style="color: ${netBalance < 0 ? 'red' : 'inherit'}">$${netBalance.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('tbTotalDebit').textContent = `$${totalDebit.toFixed(2)}`;
        document.getElementById('tbTotalCredit').textContent = `$${totalCredit.toFixed(2)}`;
        
        // Verifica si cuadra
        const tbTotalCreditElem = document.getElementById('tbTotalCredit');
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            tbTotalCreditElem.style.color = 'red';
            showToast('¡Advertencia! La balanza no cuadra', 'error');
        } else {
            tbTotalCreditElem.style.color = 'green';
        }

    } catch (error) {
        showToast('Error al generar la balanza', 'error');
    }
}
