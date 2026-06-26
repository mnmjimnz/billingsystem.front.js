document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    if(themeToggle) {
        themeToggle.checked = currentTheme === 'dark';
    }

    if(themeToggle) {
        themeToggle.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
});
