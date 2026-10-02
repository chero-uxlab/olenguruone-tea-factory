/**
 * Olenguruone Tea Factory - Cookie Consent & Preference Manager
 */
(function() {
    const COOKIE_STORAGE_KEY = 'tegat_cookie_consent';

    function getConsent() {
        const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
        if (!raw || raw === 'undefined' || raw === 'null') return null;
        try {
            return JSON.parse(raw);
        } catch(e) {
            return null;
        }
    }

    function saveConsent(consentObj) {
        consentObj.timestamp = new Date().toISOString();
        localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(consentObj));
        hideBanner();
        hideModal();
    }

    function hideBanner() {
        const banner = document.getElementById('tegatCookieBanner');
        if (banner) banner.remove();
    }

    function hideModal() {
        const modal = document.getElementById('tegatCookieOverlay');
        if (modal) modal.remove();
    }

    function acceptAll() {
        saveConsent({
            essential: true,
            analytics: true,
            marketing: true,
            status: 'accepted_all'
        });
    }

    function acceptEssential() {
        saveConsent({
            essential: true,
            analytics: false,
            marketing: false,
            status: 'essential_only'
        });
    }

    window.openCookieSettings = function() {
        hideModal();
        const current = getConsent() || { essential: true, analytics: true, marketing: false };

        const overlay = document.createElement('div');
        overlay.id = 'tegatCookieOverlay';
        overlay.className = 'tegat-cookie-overlay';

        overlay.innerHTML = `
            <div class="tegat-cookie-modal">
                <h4 class="tegat-cookie-modal-title">Cookie Preferences</h4>
                <p class="tegat-cookie-modal-desc">
                    Olenguruone Tea Factory uses cookies to ensure security, maintain shopping cart state, and improve site performance for domestic & export clients.
                </p>

                <div class="tegat-cookie-option">
                    <div class="tegat-cookie-option-info">
                        <h5>Strictly Necessary Cookies</h5>
                        <p>Essential for basic website functions, cart persistence, customer session authentication, and payment processing.</p>
                    </div>
                    <label class="tegat-switch">
                        <input type="checkbox" checked disabled>
                        <span class="tegat-slider"></span>
                    </label>
                </div>

                <div class="tegat-cookie-option">
                    <div class="tegat-cookie-option-info">
                        <h5>Analytics & Performance</h5>
                        <p>Allows us to measure site performance, visitor flow, and export order demand trends.</p>
                    </div>
                    <label class="tegat-switch">
                        <input type="checkbox" id="tegatOptAnalytics" ${current.analytics !== false ? 'checked' : ''}>
                        <span class="tegat-slider"></span>
                    </label>
                </div>

                <div class="tegat-cookie-option">
                    <div class="tegat-cookie-option-info">
                        <h5>Marketing & Personalization</h5>
                        <p>Used to remember regional currency preferences and custom tea recommendations.</p>
                    </div>
                    <label class="tegat-switch">
                        <input type="checkbox" id="tegatOptMarketing" ${current.marketing ? 'checked' : ''}>
                        <span class="tegat-slider"></span>
                    </label>
                </div>

                <div class="tegat-cookie-modal-footer">
                    <button type="button" class="tegat-cookie-btn-essential" id="tegatSaveCustomBtn">Save Preferences</button>
                    <button type="button" class="tegat-cookie-btn-accept" id="tegatAcceptAllModalBtn">Accept All</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('tegatSaveCustomBtn').addEventListener('click', function() {
            const analytics = document.getElementById('tegatOptAnalytics').checked;
            const marketing = document.getElementById('tegatOptMarketing').checked;
            saveConsent({
                essential: true,
                analytics: analytics,
                marketing: marketing,
                status: 'customized'
            });
        });

        document.getElementById('tegatAcceptAllModalBtn').addEventListener('click', function() {
            acceptAll();
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                hideModal();
            }
        });
    };

    function showBanner() {
        if (document.getElementById('tegatCookieBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'tegatCookieBanner';
        banner.className = 'tegat-cookie-banner';

        banner.innerHTML = `
            <div class="tegat-cookie-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5 4 4 0 0 1 0-.001Z"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>
                <h4>We value your privacy & preferences</h4>
            </div>
            <div class="tegat-cookie-body">
                We use cookies and local storage to keep track of your shopping cart, maintain account security, and enhance your browsing experience. Choose your preferences below.
            </div>
            <div class="tegat-cookie-actions">
                <button type="button" class="tegat-cookie-btn-accept" id="tegatBtnAcceptAll">Accept All</button>
                <button type="button" class="tegat-cookie-btn-essential" id="tegatBtnEssentialOnly">Essential Only</button>
                <button type="button" class="tegat-cookie-btn-settings" id="tegatBtnCustomize">Customize</button>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('tegatBtnAcceptAll').addEventListener('click', acceptAll);
        document.getElementById('tegatBtnEssentialOnly').addEventListener('click', acceptEssential);
        document.getElementById('tegatBtnCustomize').addEventListener('click', function() {
            hideBanner();
            window.openCookieSettings();
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        const consent = getConsent();
        if (!consent) {
            setTimeout(showBanner, 600);
        }
    });
})();
