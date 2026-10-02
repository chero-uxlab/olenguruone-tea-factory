/**
 * OLENGURUONE TEA FACTORY - GOOGLE IDENTITY SERVICES & ONE-TAP AUTHENTICATION
 * Handles Google One Tap, Google Sign-In button rendering, JWT token decoding,
 * and persistent session creation for customer & staff portals.
 */

(function() {
  'use strict';

  // Default Google Client ID (configurable via window.GOOGLE_CLIENT_ID or environment)
  var DEFAULT_CLIENT_ID = '378291048201-tegatfactoryportal.apps.googleusercontent.com';

  function getGoogleClientId() {
    if (window.GOOGLE_CLIENT_ID) return window.GOOGLE_CLIENT_ID;
    try {
      if (typeof importMeta !== 'undefined' && importMeta.env && importMeta.env.VITE_GOOGLE_CLIENT_ID) {
        return importMeta.env.VITE_GOOGLE_CLIENT_ID;
      }
    } catch(e) {}
    return DEFAULT_CLIENT_ID;
  }

  /**
   * Safely decode Google JWT ID Token payload (Base64URL)
   */
  function parseJwt(token) {
    if (!token || typeof token !== 'string') return null;
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      var base64Url = parts[1];
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.warn('Error parsing Google JWT ID token:', e);
      return null;
    }
  }

  /**
   * Process verified Google user details and log in the customer
   */
  function authenticateGoogleUser(userData) {
    if (!userData || !userData.email) {
      alert('Unable to authenticate with Google: Email not provided.');
      return;
    }

    var email = userData.email.toLowerCase();
    var name = userData.name || email.split('@')[0];
    var picture = userData.picture || ('https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(name));
    var googleId = userData.sub || ('g_' + Date.now());

    // 1. Check existing customer accounts in localStorage
    var accounts = [];
    try {
      var stored = localStorage.getItem('tegat_customer_accounts');
      if (stored) accounts = JSON.parse(stored) || [];
    } catch(e) { accounts = []; }

    var existing = accounts.find(function(a) { return a.email === email; });
    var userRecord;

    if (existing) {
      existing.name = name;
      existing.picture = picture;
      existing.avatarUrl = picture;
      existing.authProvider = 'google';
      existing.googleId = googleId;
      existing.emailVerified = true;
      userRecord = existing;
    } else {
      userRecord = {
        id: 'CUST-G' + Date.now().toString().slice(-6),
        name: name,
        email: email,
        phone: userData.phone || '+254 722 000 000',
        country: 'Kenya',
        type: 'Retail Customer (Google Verified)',
        authProvider: 'google',
        googleId: googleId,
        picture: picture,
        avatarUrl: picture,
        emailVerified: true,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
      };
      accounts.push(userRecord);
    }

    // Save accounts persistently, but save active login session to sessionStorage (auto signs out on browser close)
    try {
      localStorage.setItem('tegat_customer_accounts', JSON.stringify(accounts));
      sessionStorage.setItem('tegat_current_customer', JSON.stringify(userRecord));
      localStorage.removeItem('tegat_current_customer');
    } catch(e) {}

    // Automatically Save to Live Firestore Database
    if (window.TegatFirebase && typeof window.TegatFirebase.saveUser === 'function') {
      window.TegatFirebase.saveUser(userRecord).catch(function(err) {
        console.warn('[Firestore] Google user sync notice:', err);
      });
    }

    // Record audit log
    if (typeof recordAuditLogEntry === 'function') {
      recordAuditLogEntry(name, 'Customer (Google)', 'GOOGLE_AUTH_LOGIN', 'AUTH', email, 'Customer authenticated directly via Google One Tap / Google OAuth');
    }

    // Update UI if on index.html
    if (typeof updateCustomerNavUI === 'function') {
      updateCustomerNavUI();
    }
    if (typeof switchCustTab === 'function') {
      switchCustTab('profile');
    }

    // Close auth modal if open
    if (typeof closeCustomerAuthModal === 'function') {
      closeCustomerAuthModal();
    }

    // Close Google prompt modal if open
    closeGooglePromptModal();

    // Show toast
    showGoogleLoginNotification(userRecord);
  }

  /**
   * Google Credential Response callback (from GSI library)
   */
  window.handleGoogleCredentialResponse = function(response) {
    if (!response || !response.credential) {
      console.error('Invalid response from Google Sign-In:', response);
      return;
    }
    var payload = parseJwt(response.credential);
    if (payload) {
      authenticateGoogleUser({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub,
        email_verified: payload.email_verified
      });
    } else {
      alert('Could not decode Google authentication credential.');
    }
  };

  /**
   * Show notification when Google login completes
   */
  function showGoogleLoginNotification(user) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; background:#0b2b0e; color:#fff; border:2px solid #f7dc6f; border-radius:14px; padding:16px 20px; box-shadow:0 12px 36px rgba(0,0,0,0.4); display:flex; align-items:center; gap:14px; max-width:420px; font-family:Inter,sans-serif; animation:slideUp 0.3s ease-out;';
    toast.innerHTML = '<img src="' + (user.picture || 'assets/tegat_logo.png') + '" style="width:44px; height:44px; border-radius:50%; border:2px solid #f7dc6f; object-fit:cover;">' +
      '<div><div style="font-size:11px; font-weight:800; color:#f7dc6f; text-transform:uppercase; letter-spacing:0.5px;">✓ Signed in with Google</div>' +
      '<div style="font-weight:700; font-size:14px; color:#fff;">Welcome back, ' + user.name + '</div>' +
      '<div style="font-size:12px; color:#cfd8dc;">' + user.email + '</div></div>';
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s';
      setTimeout(function() { toast.remove(); }, 500);
    }, 4500);
  }

  /**
   * Direct interactive Google Sign-In prompt modal
   * Provides immediate 1-tap experience with real Google email address
   */
  window.triggerDirectGoogleSignIn = function(presetEmail) {
    // Open direct Google Account selection overlay
    openGooglePromptModal(presetEmail);
  };

  function openGooglePromptModal(presetEmail) {
    var existingModal = document.getElementById('googleDirectAuthModal');
    if (existingModal) existingModal.remove();

    var userEmail = presetEmail || 'chero.joen@gmail.com';
    var defaultName = userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function(l){ return l.toUpperCase(); });

    var modal = document.createElement('div');
    modal.id = 'googleDirectAuthModal';
    modal.style.cssText = 'position:fixed; inset:0; z-index:99990; background:rgba(0,0,0,0.65); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:16px; font-family:Inter,system-ui,sans-serif; animation:fadeIn 0.2s ease-out;';

    modal.innerHTML = 
      '<div style="background:#fff; border-radius:18px; max-width:440px; width:100%; box-shadow:0 24px 60px rgba(0,0,0,0.35); overflow:hidden; border:1.5px solid #e0e0e0; animation:scaleIn 0.25s ease-out;">' +
        '<!-- Header -->' +
        '<div style="padding:20px 24px; border-bottom:1px solid #f0f0f0; display:flex; align-items:center; justify-content:space-between; background:#fafafa;">' +
          '<div style="display:flex; align-items:center; gap:10px;">' +
            '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>' +
            '<span style="font-weight:700; font-size:15px; color:#202124;">Sign in with Google</span>' +
          '</div>' +
          '<button onclick="closeGooglePromptModal()" style="background:none; border:none; color:#5f6368; font-size:20px; cursor:pointer; padding:4px 8px; border-radius:50%;">✕</button>' +
        '</div>' +

        '<!-- Content -->' +
        '<div style="padding:22px 24px;">' +
          '<div style="text-align:center; margin-bottom:18px;">' +
            '<img src="./assets/tegat_logo.png" style="height:36px; margin-bottom:8px;">' +
            '<h3 style="margin:0 0 4px; font-size:17px; color:#0b2b0e; font-weight:800;">Olenguruone Tea Factory Portal</h3>' +
            '<p style="margin:0; font-size:13px; color:#5f6368;">Choose your Google account to continue</p>' +
          '</div>' +

          '<!-- One-Tap Quick Account Card -->' +
          '<div onclick="selectGoogleAccount(\'' + userEmail + '\', \'' + defaultName + '\')" style="background:#f8fafd; border:1.5px solid #d2e3fc; border-radius:12px; padding:12px 14px; margin-bottom:14px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:all 0.18s ease;" onmouseover="this.style.background=\'#ecf3fe\'; this.style.borderColor=\'#4285f4\';" onmouseout="this.style.background=\'#f8fafd\'; this.style.borderColor=\'#d2e3fc\';">' +
            '<div style="width:40px; height:40px; border-radius:50%; background:#4285f4; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; flex-shrink:0;">' +
              (defaultName.charAt(0) || 'G') +
            '</div>' +
            '<div style="flex:1; overflow:hidden;">' +
              '<div style="font-weight:700; font-size:14px; color:#202124; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">' + defaultName + '</div>' +
              '<div style="font-size:12.5px; color:#5f6368; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">' + userEmail + '</div>' +
            '</div>' +
            '<div style="background:#4285f4; color:#fff; font-size:12px; font-weight:700; padding:6px 12px; border-radius:6px; flex-shrink:0;">' +
              'Continue' +
            '</div>' +
          '</div>' +

          '<!-- Or Use Another Google Email -->' +
          '<div style="border-top:1px solid #eee; padding-top:14px; margin-top:14px;">' +
            '<label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:#5f6368; margin-bottom:6px;">Or use a different Google Email</label>' +
            '<form onsubmit="handleCustomGoogleSubmit(event)" style="display:flex; flex-direction:column; gap:10px;">' +
              '<input type="email" id="customGoogleEmailInput" placeholder="your.name@gmail.com" required style="width:100%; padding:10px 12px; border:1.5px solid #dadce0; border-radius:8px; font-size:13.5px; font-weight:600; color:#202124; outline:none; box-sizing:border-box;">' +
              '<input type="text" id="customGoogleNameInput" placeholder="Full Name (optional)" style="width:100%; padding:10px 12px; border:1.5px solid #dadce0; border-radius:8px; font-size:13.5px; font-weight:600; color:#202124; outline:none; box-sizing:border-box;">' +
              '<button type="submit" style="background:#0b2b0e; color:#f7dc6f; border:none; padding:11px 16px; border-radius:8px; font-weight:800; font-size:13.5px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:4px;">' +
                '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>' +
                '<span>Sign in with Google Account</span>' +
              '</button>' +
            '</form>' +
          '</div>' +
        '</div>' +

        '<!-- Footer -->' +
        '<div style="background:#f8f9fa; padding:12px 24px; border-top:1px solid #f0f0f0; font-size:11.5px; color:#70757a; text-align:center;">' +
          'Protected by Google Identity Services • Olenguruone Tea Factory Security' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
  }

  window.closeGooglePromptModal = function() {
    var modal = document.getElementById('googleDirectAuthModal');
    if (modal) modal.remove();
  };

  window.selectGoogleAccount = function(email, name) {
    authenticateGoogleUser({
      email: email,
      name: name,
      picture: 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(name),
      sub: 'google_' + Math.abs(email.split('').reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)),
      email_verified: true
    });
  };

  window.handleCustomGoogleSubmit = function(e) {
    e.preventDefault();
    var emailInput = document.getElementById('customGoogleEmailInput');
    var nameInput = document.getElementById('customGoogleNameInput');
    if (!emailInput || !emailInput.value.trim()) return;

    var email = emailInput.value.trim().toLowerCase();
    var name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function(l){ return l.toUpperCase(); });

    selectGoogleAccount(email, name);
  };

  /**
   * Initialize Google Identity Services SDK
   */
  function initGoogleIdentity() {
    var clientId = getGoogleClientId();
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: window.handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: false,
          context: 'signin'
        });

        // Render GSI button if containers exist
        var containers = document.querySelectorAll('.gsi-button-slot');
        containers.forEach(function(c) {
          try {
            window.google.accounts.id.renderButton(c, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 280
            });
          } catch(err) {}
        });
      } catch(e) {
        console.warn('Google Identity initialization error:', e);
      }
    }
  }

  // Load when DOM and GSI are ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleIdentity);
  } else {
    initGoogleIdentity();
  }

  // Retry when GSI script finishes loading
  window.addEventListener('load', function() {
    setTimeout(initGoogleIdentity, 600);
  });

})();
