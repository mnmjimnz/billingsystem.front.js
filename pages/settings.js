document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
});

async function loadSettings() {
    try {
        const settings = await ApiClient.request('/Settings', 'GET');
        if (settings) {
            document.getElementById('companyName').value = settings.companyName || '';
            document.getElementById('companyPhone').value = settings.phone || '';
            document.getElementById('companyEmail').value = settings.email || '';
            document.getElementById('companyAddress').value = settings.address || '';
            document.getElementById('taxPercentage').value = settings.taxPercentage || 0;
            document.getElementById('socialSecurityPercentage').value = settings.socialSecurityPercentage || 0;
            document.getElementById('afpPercentage').value = settings.afpPercentage || 0;
        }
    } catch (e) {
        console.error("Error loading settings", e);
        showToast('Error al cargar la configuración', 'error');
    }
}

async function saveSettings() {
    const companyName = document.getElementById('companyName').value;
    const phone = document.getElementById('companyPhone').value;
    const email = document.getElementById('companyEmail').value;
    const address = document.getElementById('companyAddress').value;
    const taxPercentage = parseFloat(document.getElementById('taxPercentage').value);
    const socialSecurityPercentage = parseFloat(document.getElementById('socialSecurityPercentage').value) || 0;
    const afpPercentage = parseFloat(document.getElementById('afpPercentage').value) || 0;

    if (!companyName) {
        showToast('El nombre de la empresa es requerido', 'error');
        return;
    }

    if (isNaN(taxPercentage) || taxPercentage < 0) {
        showToast('Ingrese un porcentaje de IVA válido', 'error');
        return;
    }

    const payload = {
        companyName,
        phone,
        email,
        address,
        taxPercentage,
        socialSecurityPercentage,
        afpPercentage
    };

    try {
        const btn = document.getElementById('btnSaveSettings');
        btn.disabled = true;
        btn.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i> Guardando...';

        await ApiClient.request('/Settings', 'PUT', payload);
        
        showToast('Configuración guardada exitosamente', 'success');
        
        // Update UI Core brand name
        if(document.getElementById('brand-name')) {
            document.getElementById('brand-name').innerText = companyName;
        }
        localStorage.setItem('companyName', companyName);

    } catch (e) {
        console.error("Error saving settings", e);
        showToast('Error al guardar la configuración', 'error');
    } finally {
        const btn = document.getElementById('btnSaveSettings');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-save me-1"></i> Guardar Configuración';
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
