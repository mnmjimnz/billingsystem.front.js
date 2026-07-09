document.addEventListener('DOMContentLoaded', () => {
    loadStoreSettings();
});

let currentSettings = null;

async function loadStoreSettings() {
    try {
        const settings = await ApiClient.request('/Settings', 'GET');
        currentSettings = settings;

        if (settings) {
            document.getElementById('storeTheme').value = settings.storeTheme || 'minimalist';
            document.getElementById('storeProductsPerPage').value = settings.storeProductsPerPage || 12;
            document.getElementById('showStoreSlider').checked = settings.showStoreSlider !== false; // defaults to true
            document.getElementById('sliderImage1').value = settings.sliderImage1 || '';
            document.getElementById('sliderImage2').value = settings.sliderImage2 || '';
            document.getElementById('sliderImage3').value = settings.sliderImage3 || '';
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
        showToast('Error', 'No se pudo cargar la configuración de la tienda', 'danger');
    }
}

async function saveStoreSettings() {
    const btn = document.getElementById('btnSaveSettings');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    btn.disabled = true;

    try {
        if (!currentSettings) {
            // Need to fetch first if null so we don't wipe out other settings
            currentSettings = await ApiClient.request('/Settings', 'GET') || {};
        }

        const updatedSettings = {
            ...currentSettings,
            storeTheme: document.getElementById('storeTheme').value,
            storeProductsPerPage: parseInt(document.getElementById('storeProductsPerPage').value) || 12,
            showStoreSlider: document.getElementById('showStoreSlider').checked,
            sliderImage1: document.getElementById('sliderImage1').value,
            sliderImage2: document.getElementById('sliderImage2').value,
            sliderImage3: document.getElementById('sliderImage3').value
        };

        await ApiClient.request('/Settings', 'PUT', updatedSettings);
        
        showToast('Éxito', 'Configuración de la tienda guardada correctamente', 'success');
    } catch (error) {
        console.error('Error guardando configuración:', error);
        showToast('Error', 'No se pudo guardar la configuración de la tienda', 'danger');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
