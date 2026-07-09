document.addEventListener('DOMContentLoaded', () => {
    loadThemes();
});

let allThemes = [];
let activeThemeId = null;
let themeSettingsModal = null;

async function loadThemes() {
    try {
        const themes = await ApiClient.request('/Themes', 'GET');
        allThemes = themes || [];
        renderThemeGrid();
        
        const activeTheme = allThemes.find(t => t.isActive);
        if (activeTheme) {
            activeThemeId = activeTheme.id;
            document.getElementById('btnCustomize').disabled = false;
        }

    } catch (error) {
        console.error('Error cargando temas:', error);
        showToast('Error', 'No se pudieron cargar los temas disponibles', 'danger');
    }
}

function renderThemeGrid() {
    const grid = document.getElementById('themes-grid');
    grid.innerHTML = '';
    
    if (allThemes.length === 0) {
        grid.innerHTML = '<div class="col-12"><div class="alert alert-warning">No hay temas instalados en el sistema.</div></div>';
        return;
    }
    
    allThemes.forEach(theme => {
        const isActive = theme.isActive;
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        col.innerHTML = `
            <div class="card h-100 theme-card ${isActive ? 'active' : ''}">
                ${isActive ? '<span class="badge bg-success active-badge"><i class="bi bi-check-circle-fill me-1"></i>Activo</span>' : ''}
                <img src="${theme.previewImage || 'https://placehold.co/600x400?text=' + theme.name}" class="card-img-top theme-preview" alt="${theme.name}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="card-title fw-bold m-0">${theme.name}</h5>
                        <span class="badge bg-light text-dark border">v${theme.version}</span>
                    </div>
                    <p class="card-text text-muted small mb-3">${theme.description}</p>
                    <div class="d-flex gap-2">
                        ${isActive 
                            ? `<button class="btn btn-outline-secondary w-100" disabled>Tema Actual</button>` 
                            : `<button class="btn btn-primary w-100 shadow-sm" onclick="activateTheme(${theme.id})">Activar Tema</button>`
                        }
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

async function activateTheme(themeId) {
    if (!confirm('¿Estás seguro de que deseas activar este tema? Esto cambiará instantáneamente la apariencia de la tienda para todos los clientes.')) {
        return;
    }
    
    try {
        await ApiClient.request(`/Themes/activate/${themeId}`, 'POST');
        showToast('Éxito', 'El tema se activó correctamente', 'success');
        await loadThemes();
    } catch (error) {
        console.error('Error activando tema:', error);
        showToast('Error', 'No se pudo activar el tema', 'danger');
    }
}

async function openCustomizeModal() {
    if (!activeThemeId) return;
    
    try {
        const settings = await ApiClient.request(`/Themes/settings/${activeThemeId}`, 'GET');
        
        document.getElementById('settingPrimaryColor').value = settings.primaryColor || '#000000';
        document.getElementById('settingSecondaryColor').value = settings.secondaryColor || '#ffffff';
        document.getElementById('settingFontFamily').value = settings.fontFamily || '';
        document.getElementById('settingBorderRadius').value = settings.borderRadius || '';
        document.getElementById('settingLogoUrl').value = settings.logoUrl || '';
        document.getElementById('settingMainBannerUrl').value = settings.mainBannerUrl || '';
        document.getElementById('settingButtonStyle').value = settings.buttonStyle || 'solid';
        document.getElementById('settingProductsPerRow').value = settings.productsPerRow || 4;
        document.getElementById('settingProductCardStyle').value = settings.productCardStyle || 'clean';
        
        if (!themeSettingsModal) {
            themeSettingsModal = new bootstrap.Modal(document.getElementById('themeSettingsModal'));
        }
        themeSettingsModal.show();
        
    } catch (error) {
        console.error('Error cargando configuración del tema:', error);
        showToast('Error', 'No se pudo cargar la configuración de este tema', 'danger');
    }
}

async function saveThemeSettings() {
    if (!activeThemeId) return;
    
    const btn = document.getElementById('btnSaveThemeSettings');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    btn.disabled = true;

    try {
        const updatedSettings = {
            themeId: activeThemeId,
            primaryColor: document.getElementById('settingPrimaryColor').value,
            secondaryColor: document.getElementById('settingSecondaryColor').value,
            fontFamily: document.getElementById('settingFontFamily').value,
            borderRadius: document.getElementById('settingBorderRadius').value,
            logoUrl: document.getElementById('settingLogoUrl').value,
            mainBannerUrl: document.getElementById('settingMainBannerUrl').value,
            buttonStyle: document.getElementById('settingButtonStyle').value,
            productsPerRow: parseInt(document.getElementById('settingProductsPerRow').value) || 4,
            productCardStyle: document.getElementById('settingProductCardStyle').value
        };

        await ApiClient.request(`/Themes/settings/${activeThemeId}`, 'PUT', updatedSettings);
        
        showToast('Éxito', 'Configuración de diseño guardada correctamente', 'success');
        if (themeSettingsModal) {
            themeSettingsModal.hide();
        }
    } catch (error) {
        console.error('Error guardando configuración del tema:', error);
        showToast('Error', 'No se pudo guardar la configuración', 'danger');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
