/**
 * Tegat Tea Factory — Dedicated Accessibility Widget & Toolbar
 * WCAG 2.1 Level AA Compliance Support
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'tegat_a11y_preferences';

  var defaultState = {
    textSize: 0, // 0: Normal, 1: Large (112%), 2: X-Large (125%), 3: Huge (138%)
    dyslexiaFont: false,
    highlightLinks: false,
    contrastMode: 'none', // 'none', 'high-contrast', 'invert', 'monochrome'
    bigCursor: false,
    stopAnimations: false,
    textSpacing: false,
    readingGuide: false,
    readingMask: false,
    screenReader: false
  };

  var state = Object.assign({}, defaultState);

  // Load saved state
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = Object.assign({}, defaultState, JSON.parse(saved));
    }
  } catch (e) {
    console.warn('Could not read accessibility preferences from localStorage', e);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
    updateBadge();
  }

  function countActiveFeatures() {
    var count = 0;
    if (state.textSize > 0) count++;
    if (state.dyslexiaFont) count++;
    if (state.highlightLinks) count++;
    if (state.contrastMode !== 'none') count++;
    if (state.bigCursor) count++;
    if (state.stopAnimations) count++;
    if (state.textSpacing) count++;
    if (state.readingGuide) count++;
    if (state.readingMask) count++;
    if (state.screenReader) count++;
    return count;
  }

  function updateBadge() {
    var badge = document.getElementById('a11yActiveBadge');
    if (!badge) return;
    var count = countActiveFeatures();
    if (count > 0) {
      badge.textContent = count;
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
    }
  }

  function applyState() {
    var html = document.documentElement;

    // 1. Text Sizing
    html.classList.remove('a11y-text-large', 'a11y-text-xlarge', 'a11y-text-huge');
    if (state.textSize === 1) html.classList.add('a11y-text-large');
    else if (state.textSize === 2) html.classList.add('a11y-text-xlarge');
    else if (state.textSize === 3) html.classList.add('a11y-text-huge');

    // 2. Dyslexia Font
    html.classList.toggle('a11y-dyslexia', !!state.dyslexiaFont);

    // 3. Highlight Links
    html.classList.toggle('a11y-highlight-links', !!state.highlightLinks);

    // 4. Contrast
    html.classList.remove('a11y-high-contrast', 'a11y-invert-colors', 'a11y-monochrome');
    if (state.contrastMode === 'high-contrast') html.classList.add('a11y-high-contrast');
    else if (state.contrastMode === 'invert') html.classList.add('a11y-invert-colors');
    else if (state.contrastMode === 'monochrome') html.classList.add('a11y-monochrome');

    // 5. Big Cursor
    html.classList.toggle('a11y-big-cursor', !!state.bigCursor);

    // 6. Stop Animations
    html.classList.toggle('a11y-stop-animations', !!state.stopAnimations);

    // 7. Text Spacing
    html.classList.toggle('a11y-text-spacing', !!state.textSpacing);

    // 8. Reading Guide
    var guide = document.getElementById('a11yReadingGuide');
    if (guide) guide.classList.toggle('active', !!state.readingGuide);

    // 9. Reading Mask
    var maskTop = document.getElementById('a11yReadingMaskTop');
    var maskBottom = document.getElementById('a11yReadingMaskBottom');
    if (maskTop && maskBottom) {
      maskTop.classList.toggle('active', !!state.readingMask);
      maskBottom.classList.toggle('active', !!state.readingMask);
    }

    updateUI();
    saveState();
  }

  function updateUI() {
    // Stepper
    var stepInd = document.getElementById('a11yTextSizeIndicator');
    var minusBtn = document.getElementById('a11yTextMinus');
    var plusBtn = document.getElementById('a11yTextPlus');
    if (stepInd) {
      var sizes = ['100%', '112%', '125%', '138%'];
      stepInd.textContent = sizes[state.textSize] || '100%';
    }
    if (minusBtn) minusBtn.disabled = state.textSize <= 0;
    if (plusBtn) plusBtn.disabled = state.textSize >= 3;

    // Card buttons
    var btnDyslexia = document.getElementById('a11yBtnDyslexia');
    if (btnDyslexia) setCardState(btnDyslexia, state.dyslexiaFont);

    var btnHighlight = document.getElementById('a11yBtnHighlight');
    if (btnHighlight) setCardState(btnHighlight, state.highlightLinks);

    var btnHighContrast = document.getElementById('a11yBtnHighContrast');
    if (btnHighContrast) setCardState(btnHighContrast, state.contrastMode === 'high-contrast');

    var btnInvert = document.getElementById('a11yBtnInvert');
    if (btnInvert) setCardState(btnInvert, state.contrastMode === 'invert');

    var btnMono = document.getElementById('a11yBtnMonochrome');
    if (btnMono) setCardState(btnMono, state.contrastMode === 'monochrome');

    var btnCursor = document.getElementById('a11yBtnCursor');
    if (btnCursor) setCardState(btnCursor, state.bigCursor);

    var btnAnim = document.getElementById('a11yBtnAnim');
    if (btnAnim) setCardState(btnAnim, state.stopAnimations);

    var btnSpacing = document.getElementById('a11yBtnSpacing');
    if (btnSpacing) setCardState(btnSpacing, state.textSpacing);

    var btnGuide = document.getElementById('a11yBtnGuide');
    if (btnGuide) setCardState(btnGuide, state.readingGuide);

    var btnMask = document.getElementById('a11yBtnMask');
    if (btnMask) setCardState(btnMask, state.readingMask);

    var btnSpeech = document.getElementById('a11yBtnSpeech');
    if (btnSpeech) setCardState(btnSpeech, state.screenReader);
  }

  function setCardState(el, active) {
    if (active) {
      el.classList.add('active');
      var status = el.querySelector('.a11y-card-status');
      if (status) status.textContent = 'ON';
    } else {
      el.classList.remove('active');
      var status = el.querySelector('.a11y-card-status');
      if (status) status.textContent = 'OFF';
    }
  }

  // Reading Guide & Mask Mouse Tracker
  document.addEventListener('mousemove', function (e) {
    if (state.readingGuide) {
      var guide = document.getElementById('a11yReadingGuide');
      if (guide) {
        guide.style.top = e.clientY + 'px';
      }
    }
    if (state.readingMask) {
      var maskTop = document.getElementById('a11yReadingMaskTop');
      var maskBottom = document.getElementById('a11yReadingMaskBottom');
      var bandHeight = 60; // focus window height
      if (maskTop && maskBottom) {
        maskTop.style.top = '0px';
        maskTop.style.height = Math.max(0, e.clientY - bandHeight / 2) + 'px';

        maskBottom.style.top = (e.clientY + bandHeight / 2) + 'px';
        maskBottom.style.bottom = '0px';
      }
    }
  });

  // Speech Synthesizer on Hover/Focus if enabled
  var speechTimeout = null;
  function speakText(text) {
    if (!state.screenReader || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    var clean = text.trim().replace(/\s+/g, ' ');
    if (clean.length > 0 && clean.length < 300) {
      var utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    }
  }

  document.addEventListener('mouseover', function (e) {
    if (!state.screenReader) return;
    clearTimeout(speechTimeout);
    speechTimeout = setTimeout(function () {
      var target = e.target;
      if (target && (target.tagName === 'P' || target.tagName === 'H1' || target.tagName === 'H2' || target.tagName === 'H3' || target.tagName === 'H4' || target.tagName === 'A' || target.tagName === 'BUTTON' || target.tagName === 'LI')) {
        speakText(target.innerText || target.getAttribute('aria-label') || target.title);
      }
    }, 250);
  });

  // Build and inject HTML DOM
  function injectWidget() {
    if (document.getElementById('a11yLauncherBtn')) return;

    // Overlays (Reading Guide & Reading Mask)
    var guide = document.createElement('div');
    guide.id = 'a11yReadingGuide';
    guide.className = 'a11y-reading-guide-line';
    document.body.appendChild(guide);

    var maskTop = document.createElement('div');
    maskTop.id = 'a11yReadingMaskTop';
    maskTop.className = 'a11y-reading-mask-top';
    document.body.appendChild(maskTop);

    var maskBottom = document.createElement('div');
    maskBottom.id = 'a11yReadingMaskBottom';
    maskBottom.className = 'a11y-reading-mask-bottom';
    document.body.appendChild(maskBottom);

    // Launcher Button
    var launcher = document.createElement('button');
    launcher.id = 'a11yLauncherBtn';
    launcher.className = 'a11y-launcher-btn';
    launcher.setAttribute('aria-label', 'Open Accessibility Toolbar (WCAG 2.1 Options)');
    launcher.setAttribute('title', 'Accessibility Toolbar & Options');
    launcher.innerHTML =
      '<span class="a11y-launcher-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="4" r="2"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>' +
      '</svg>' +
      '</span>' +
      '<span id="a11yActiveBadge" class="a11y-active-badge">0</span>';
    document.body.appendChild(launcher);

    // Panel Overlay & Container
    var overlay = document.createElement('div');
    overlay.id = 'a11yPanelOverlay';
    overlay.className = 'a11y-panel-overlay';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = 'a11yPanelContainer';
    panel.className = 'a11y-panel-container';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Accessibility Controls');
    panel.innerHTML =
      '<div class="a11y-header">' +
        '<h3 class="a11y-header-title">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>' +
          '<span>Accessibility Hub</span>' +
        '</h3>' +
        '<div class="a11y-header-actions">' +
          '<button id="a11yResetTop" class="a11y-reset-btn-top" title="Reset all settings" aria-label="Reset all settings">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>' +
          '</button>' +
          '<button id="a11yCloseBtn" class="a11y-close-btn" title="Close" aria-label="Close Accessibility Menu">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div class="a11y-banner">' +
        '<span>WCAG 2.1 Level AA Compliance</span>' +
        '<a href="javascript:void(0)" id="a11yOpenStatementBanner">Statement</a>' +
      '</div>' +

      '<div class="a11y-body">' +
        // Stepper: Text Size
        '<div class="a11y-stepper-card">' +
          '<div class="a11y-stepper-label">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color:var(--lux-green, #0b2b0e);" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>' +
            '<span class="a11y-stepper-title">Content Font Size</span>' +
          '</div>' +
          '<div class="a11y-stepper-controls">' +
            '<button id="a11yTextMinus" class="a11y-step-btn" title="Decrease font size" aria-label="Decrease font size">−</button>' +
            '<span id="a11yTextSizeIndicator" class="a11y-step-indicator">100%</span>' +
            '<button id="a11yTextPlus" class="a11y-step-btn" title="Increase font size" aria-label="Increase font size">+</button>' +
          '</div>' +
        '</div>' +

        // Grid Tools
        '<div class="a11y-grid">' +
          // Dyslexia
          '<button id="a11yBtnDyslexia" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg></span>' +
            '<span class="a11y-card-title">Dyslexia Font</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // Highlight Links
          '<button id="a11yBtnHighlight" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>' +
            '<span class="a11y-card-title">Highlight Links</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // High Contrast
          '<button id="a11yBtnHighContrast" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z"/></svg></span>' +
            '<span class="a11y-card-title">High Contrast</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // Invert Colors
          '<button id="a11yBtnInvert" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>' +
            '<span class="a11y-card-title">Invert Colors</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // Monochrome
          '<button id="a11yBtnMonochrome" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg></span>' +
            '<span class="a11y-card-title">Monochrome</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // Big Cursor
          '<button id="a11yBtnCursor" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 3 10 21 14 13 22 9 3 3"/></svg></span>' +
            '<span class="a11y-card-title">Big Cursor</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // Text Spacing
          '<button id="a11yBtnSpacing" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></span>' +
            '<span class="a11y-card-title">Text Spacing</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // Stop Animations
          '<button id="a11yBtnAnim" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></span>' +
            '<span class="a11y-card-title">Stop Motion</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // Reading Guide
          '<button id="a11yBtnGuide" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg></span>' +
            '<span class="a11y-card-title">Reading Guide</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // Reading Mask
          '<button id="a11yBtnMask" class="a11y-card-btn" type="button">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg></span>' +
            '<span class="a11y-card-title">Reading Mask</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +

          // Screen Reader / Read Aloud
          '<button id="a11yBtnSpeech" class="a11y-card-btn" type="button" style="grid-column: span 2;">' +
            '<span class="a11y-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></span>' +
            '<span class="a11y-card-title">Screen Reader Voice Hover (Read Aloud)</span>' +
            '<span class="a11y-card-status">OFF</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div class="a11y-footer">' +
        '<button id="a11yResetAll" class="a11y-reset-all-btn" type="button">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>' +
          '<span>Reset All</span>' +
        '</button>' +
        '<a href="javascript:void(0)" id="a11yStatementFooter" class="a11y-statement-link">Accessibility Statement</a>' +
      '</div>';
    document.body.appendChild(panel);

    // Accessibility Statement Modal
    var modal = document.createElement('div');
    modal.id = 'a11yStatementModal';
    modal.className = 'a11y-statement-modal';
    modal.innerHTML =
      '<div class="a11y-statement-content">' +
        '<button class="a11y-statement-close" id="a11yStatementClose" aria-label="Close Statement">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">' +
          '<div style="background:#eaf4ec; color:var(--lux-green, #0b2b0e); width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(11,43,14,0.15);">' +
            '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>' +
          '</div>' +
          '<div>' +
            '<h2 style="margin:0; font-size:22px; font-weight:800; color:var(--lux-green, #0b2b0e);">Accessibility Statement</h2>' +
            '<p style="margin:0; font-size:13px; color:#64748b;">Olenguruone Tea Factory &bull; KTDA</p>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:14.5px; color:#334155; line-height:1.65; display:flex; flex-direction:column; gap:14px;">' +
          '<p><strong>Olenguruone Tea Factory (KTDA)</strong> strives to ensure that its online store and portal services are accessible to all people with disabilities. We have invested significant effort and technology to ensure our digital presence is inclusive, seamless, and dignified for every customer, farmer, and visitor.</p>' +
          '<h4 style="margin:8px 0 2px; color:var(--lux-green, #0b2b0e); font-size:16px;">Standards &amp; Conformance</h4>' +
          '<p>Our website utilizes dedicated accessibility controls and semantic markup to improve compliance with the <strong>Web Content Accessibility Guidelines (WCAG 2.1 Level AA)</strong>. These guidelines explain how to make web content more accessible for people with visual, cognitive, auditory, and motor disabilities.</p>' +
          '<h4 style="margin:8px 0 2px; color:var(--lux-green, #0b2b0e); font-size:16px;">Available Accessibility Tools</h4>' +
          '<ul style="margin:0 0 8px 20px; padding:0; display:flex; flex-direction:column; gap:4px;">' +
            '<li><strong>Font Size Adjustments:</strong> Proportional scaling up to 138% of base text.</li>' +
            '<li><strong>Dyslexia Friendly Font:</strong> High-legibility typography optimized for readers with dyslexia.</li>' +
            '<li><strong>Contrast &amp; Inversion:</strong> High-contrast black &amp; white, inverted colors, and monochrome modes.</li>' +
            '<li><strong>Reading Guides &amp; Masks:</strong> Real-time horizontal focus bands to assist line tracking.</li>' +
            '<li><strong>Voice Hover Reader:</strong> Speech synthesis readout of highlighted text and interactive buttons.</li>' +
            '<li><strong>Motion Control:</strong> Complete freeze of auto-advancing slides and CSS transitions.</li>' +
          '</ul>' +
          '<h4 style="margin:8px 0 2px; color:var(--lux-green, #0b2b0e); font-size:16px;">Contact Support &amp; Feedback</h4>' +
          '<p>If you encounter any accessibility barrier or have questions regarding our website, please reach out directly to our customer and factory dispatch team:</p>' +
          '<div style="background:#f8fafc; border:1.5px solid #e2e0d8; border-radius:10px; padding:12px 16px; font-size:13.5px;">' +
            '<p style="margin:0 0 6px 0;"><strong>Factory Email:</strong> <a href="mailto:info@olenguruone.ktdateas.com" style="color:var(--lux-green, #0b2b0e); font-weight:700; text-decoration:underline;">info@olenguruone.ktdateas.com</a></p>' +
            '<p style="margin:0 0 6px 0;"><strong>Customer Care Phone:</strong> <a href="tel:+254723121163" style="color:var(--lux-green, #0b2b0e); font-weight:700; text-decoration:underline;">+254 723 121 163</a></p>' +
            '<p style="margin:0;"><strong>Location:</strong> Olenguruone, Kuresoi South, Nakuru County, Kenya</p>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    bindEvents();
    applyState();
  }

  function bindEvents() {
    var launcher = document.getElementById('a11yLauncherBtn');
    var overlay = document.getElementById('a11yPanelOverlay');
    var panel = document.getElementById('a11yPanelContainer');
    var closeBtn = document.getElementById('a11yCloseBtn');

    function togglePanel() {
      var isOpen = panel.classList.contains('a11y-open');
      if (isOpen) {
        panel.classList.remove('a11y-open');
        overlay.classList.remove('a11y-open');
        launcher.classList.remove('launcher-active');
      } else {
        panel.classList.add('a11y-open');
        overlay.classList.add('a11y-open');
        launcher.classList.add('launcher-active');
      }
    }

    launcher.addEventListener('click', togglePanel);
    overlay.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', togglePanel);

    // Text Size
    document.getElementById('a11yTextMinus').addEventListener('click', function () {
      if (state.textSize > 0) {
        state.textSize--;
        applyState();
      }
    });

    document.getElementById('a11yTextPlus').addEventListener('click', function () {
      if (state.textSize < 3) {
        state.textSize++;
        applyState();
      }
    });

    // Dyslexia
    document.getElementById('a11yBtnDyslexia').addEventListener('click', function () {
      state.dyslexiaFont = !state.dyslexiaFont;
      applyState();
    });

    // Highlight links
    document.getElementById('a11yBtnHighlight').addEventListener('click', function () {
      state.highlightLinks = !state.highlightLinks;
      applyState();
    });

    // Contrast
    document.getElementById('a11yBtnHighContrast').addEventListener('click', function () {
      state.contrastMode = state.contrastMode === 'high-contrast' ? 'none' : 'high-contrast';
      applyState();
    });

    // Invert
    document.getElementById('a11yBtnInvert').addEventListener('click', function () {
      state.contrastMode = state.contrastMode === 'invert' ? 'none' : 'invert';
      applyState();
    });

    // Monochrome
    document.getElementById('a11yBtnMonochrome').addEventListener('click', function () {
      state.contrastMode = state.contrastMode === 'monochrome' ? 'none' : 'monochrome';
      applyState();
    });

    // Big Cursor
    document.getElementById('a11yBtnCursor').addEventListener('click', function () {
      state.bigCursor = !state.bigCursor;
      applyState();
    });

    // Stop Animations
    document.getElementById('a11yBtnAnim').addEventListener('click', function () {
      state.stopAnimations = !state.stopAnimations;
      applyState();
    });

    // Text Spacing
    document.getElementById('a11yBtnSpacing').addEventListener('click', function () {
      state.textSpacing = !state.textSpacing;
      applyState();
    });

    // Reading Guide
    document.getElementById('a11yBtnGuide').addEventListener('click', function () {
      state.readingGuide = !state.readingGuide;
      if (state.readingGuide) state.readingMask = false;
      applyState();
    });

    // Reading Mask
    document.getElementById('a11yBtnMask').addEventListener('click', function () {
      state.readingMask = !state.readingMask;
      if (state.readingMask) state.readingGuide = false;
      applyState();
    });

    // Speech Synthesizer
    document.getElementById('a11yBtnSpeech').addEventListener('click', function () {
      state.screenReader = !state.screenReader;
      if (state.screenReader) {
        speakText('Screen reader read aloud activated. Hover over any text to hear it read.');
      } else {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
      applyState();
    });

    // Reset All
    function resetAll() {
      state = Object.assign({}, defaultState);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      applyState();
    }

    document.getElementById('a11yResetTop').addEventListener('click', resetAll);
    document.getElementById('a11yResetAll').addEventListener('click', resetAll);

    // Statement Modal
    var statementModal = document.getElementById('a11yStatementModal');
    var statementClose = document.getElementById('a11yStatementClose');

    function openStatement() {
      statementModal.classList.add('show');
    }

    function closeStatement() {
      statementModal.classList.remove('show');
    }

    document.getElementById('a11yOpenStatementBanner').addEventListener('click', openStatement);
    document.getElementById('a11yStatementFooter').addEventListener('click', openStatement);
    statementClose.addEventListener('click', closeStatement);
    statementModal.addEventListener('click', function (e) {
      if (e.target === statementModal) closeStatement();
    });

    // Escape Key listener
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (statementModal.classList.contains('show')) {
          closeStatement();
        } else if (panel.classList.contains('a11y-open')) {
          togglePanel();
        }
      }
    });
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }

  // Global helper if called externally
  window.openA11yToolbar = function () {
    var panel = document.getElementById('a11yPanelContainer');
    var overlay = document.getElementById('a11yPanelOverlay');
    var launcher = document.getElementById('a11yLauncherBtn');
    if (panel && !panel.classList.contains('a11y-open')) {
      panel.classList.add('a11y-open');
      if (overlay) overlay.classList.add('a11y-open');
      if (launcher) launcher.classList.add('launcher-active');
    }
  };

  window.openA11yStatement = function () {
    var modal = document.getElementById('a11yStatementModal');
    if (modal) modal.classList.add('show');
  };
})();
