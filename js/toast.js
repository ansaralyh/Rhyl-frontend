/**
 * Global toast popup - use for login, logout, success/error messages instead of alert().
 * Usage: showToast('Message here', 'success' | 'error' | 'info')
 */
(function () {
    const styles = `
        .rhyl-toast-container { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; max-width: 90vw; }
        .rhyl-toast { padding: 14px 20px; border-radius: 12px; font-size: 15px; font-weight: 600; box-shadow: 0 10px 40px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 10px; pointer-events: auto; animation: rhyl-toast-in 0.3s ease; min-width: 280px; max-width: 420px; }
        .rhyl-toast-success { background: #059669; color: #fff; }
        .rhyl-toast-error { background: #dc2626; color: #fff; }
        .rhyl-toast-info { background: #0d9488; color: #fff; }
        @keyframes rhyl-toast-in { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rhyl-toast-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }
    `;
    const sheet = document.createElement('style');
    sheet.textContent = styles;
    document.head.appendChild(sheet);

    function getContainer() {
        let el = document.getElementById('rhyl-toast-container');
        if (!el) {
            el = document.createElement('div');
            el.id = 'rhyl-toast-container';
            el.className = 'rhyl-toast-container';
            document.body.appendChild(el);
        }
        return el;
    }

    const icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    window.showToast = function (message, type) {
        type = type || 'info';
        const container = getContainer();
        const toast = document.createElement('div');
        toast.className = 'rhyl-toast rhyl-toast-' + type;
        toast.innerHTML = icons[type] ? icons[type] + ' <span>' + String(message).replace(/</g, '&lt;') + '</span>' : '<span>' + String(message).replace(/</g, '&lt;') + '</span>';
        container.appendChild(toast);

        const duration = type === 'error' ? 4500 : 3500;
        setTimeout(() => {
            toast.style.animation = 'rhyl-toast-out 0.25s ease forwards';
            setTimeout(() => toast.remove(), 260);
        }, duration);
    };
})();
