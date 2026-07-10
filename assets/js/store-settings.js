let allThemes = [];
let activeThemeId = null;
let themeSettingsModal = null;
let confirmActivationModal = null;
let themeIdToActivate = null;
let customizingThemeId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadThemes();
    
    document.getElementById('btnConfirmActivation')?.addEventListener('click', confirmAndActivateTheme);
});

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
                    
                    <div class="row g-2">
                        <div class="col-12">
                            <button class="btn btn-outline-primary w-100 shadow-sm" onclick="openCustomizeModal(${theme.id})">
                                <i class="bi bi-sliders me-1"></i> Personalizar
                            </button>
                        </div>
                        <div class="col-12">
                            ${isActive 
                                ? `<button class="btn btn-outline-secondary w-100" disabled>Tema Actual</button>` 
                                : `<button class="btn btn-primary w-100 shadow-sm" onclick="activateTheme(${theme.id})">Activar Tema</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

function activateTheme(themeId) {
    themeIdToActivate = themeId;
    if (!confirmActivationModal) {
        confirmActivationModal = new bootstrap.Modal(document.getElementById('confirmActivationModal'));
    }
    confirmActivationModal.show();
}

async function confirmAndActivateTheme() {
    if (!themeIdToActivate) return;
    
    const btn = document.getElementById('btnConfirmActivation');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Activando...';
    btn.disabled = true;

    try {
        await ApiClient.request(`/Themes/activate/${themeIdToActivate}`, 'POST');
        showToast('Éxito', 'El tema se activó correctamente', 'success');
        if (confirmActivationModal) {
            confirmActivationModal.hide();
        }
        await loadThemes();
    } catch (error) {
        console.error('Error activando tema:', error);
        showToast('Error', 'No se pudo activar el tema', 'danger');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        themeIdToActivate = null;
    }
}

async function openCustomizeModal(themeId = null) {
    customizingThemeId = themeId || activeThemeId;
    if (!customizingThemeId) return;
    
    try {
        const settings = await ApiClient.request(`/Themes/settings/${customizingThemeId}`, 'GET');
        
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
    if (!customizingThemeId) return;
    
    const btn = document.getElementById('btnSaveThemeSettings');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    btn.disabled = true;

    try {
        const updatedSettings = {
            themeId: customizingThemeId,
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

        await ApiClient.request(`/Themes/settings/${customizingThemeId}`, 'PUT', updatedSettings);
        
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

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
