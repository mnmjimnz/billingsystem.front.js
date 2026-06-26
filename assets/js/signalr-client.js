// assets/js/signalr-client.js
let connection = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Only connect if user is logged in
    if (!ApiClient.getToken()) return;

    connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7145/hubs/notifications", {
            accessTokenFactory: () => ApiClient.getToken()
        })
        .withAutomaticReconnect()
        .build();

    connection.on("ReceiveNotification", (notification) => {
        showToast(notification.message, "info", notification.title);
        // Dispatch custom event so UI can update notification badge if needed
        window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));
    });

    connection.on("NotificationResolved", (referenceId) => {
        window.dispatchEvent(new CustomEvent('notification-resolved', { detail: referenceId }));
    });

    window.addEventListener('new-notification', () => loadNotifications());
    window.addEventListener('notification-resolved', () => loadNotifications());

    try {
        await connection.start();
        console.log("SignalR Connected.");
        loadNotifications(); // Load initial
    } catch (err) {
        console.error("SignalR Connection Error: ", err);
    }
});

async function loadNotifications() {
    try {
        const notifs = await ApiClient.request('/Notifications');
        const list = document.getElementById('notif-list');
        const badge = document.getElementById('notif-badge');
        
        if (!list) return;

        list.innerHTML = '<li><h6 class="dropdown-header">Notificaciones Pendientes</h6></li>';
        
        if (notifs.length === 0) {
            list.innerHTML += '<li><span class="dropdown-item text-secondary">No hay notificaciones</span></li>';
            if(badge) badge.style.display = 'none';
            return;
        }

        if(badge) {
            badge.style.display = 'block';
            badge.innerText = notifs.length;
        }

        notifs.forEach(n => {
            list.innerHTML += `
                <li>
                    <a class="dropdown-item border-bottom py-2" href="receivables.html">
                        <div class="fw-bold">${n.title}</div>
                        <small class="text-wrap text-muted">${n.message}</small>
                    </a>
                </li>`;
        });
    } catch (e) {
        console.error("Error loading notifications", e);
    }
}
