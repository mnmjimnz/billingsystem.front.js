document.addEventListener('DOMContentLoaded', () => {
    loadAllNotifications();
});

async function loadAllNotifications() {
    try {
        const tbody = document.getElementById('notifications-table-body');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><span class="spinner-border text-primary"></span></td></tr>';
        
        const notifs = await ApiClient.request('/Notifications/all');
        
        if (notifs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay notificaciones registradas</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        notifs.forEach(n => {
            const isResolved = n.isResolved;
            const dateStr = new Date(n.createdAt).toLocaleString();
            let typeIcon = 'bi-info-circle text-primary';
            if (n.type === 'WARNING') typeIcon = 'bi-exclamation-triangle text-warning';
            else if (n.type === 'ERROR') typeIcon = 'bi-x-circle text-danger';

            const statusBadge = isResolved 
                ? '<span class="badge bg-success-subtle text-success">Resuelta</span>'
                : '<span class="badge bg-warning-subtle text-warning">Pendiente</span>';
                
            const rowClass = isResolved ? '' : 'fw-bold bg-light';

            tbody.innerHTML += `
                <tr class="${rowClass}">
                    <td class="text-muted"><small>${dateStr}</small></td>
                    <td><i class="bi ${typeIcon} fs-5"></i></td>
                    <td>${n.title}</td>
                    <td>${n.message}</td>
                    <td class="text-center">${statusBadge}</td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error loading all notifications", e);
        const tbody = document.getElementById('notifications-table-body');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Error al cargar las notificaciones</td></tr>';
    }
}
