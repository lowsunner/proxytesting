// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            openPage(page);
            setActiveNav(page);
        });
    });

    // Initialize search engines
    document.querySelectorAll('.engine').forEach(engine => {
        engine.addEventListener('click', function() {
            document.querySelectorAll('.engine').forEach(e => e.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Initialize search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.trim();
                if (query) {
                    const selectedEngine = document.querySelector('.engine.active');
                    const engine = selectedEngine ? selectedEngine.getAttribute('data-engine') : 'Google';
                    performSearch(engine, query);
                }
            }
        });
    }

    // Initialize shortcuts
    document.querySelectorAll('.shortcut').forEach(shortcut => {
        const url = shortcut.getAttribute('data-url');
        if (url) {
            shortcut.addEventListener('click', function() {
                openURL(url);
            });
        }
    });

    // Initialize custom shortcut
    setupCustomShortcut();

    // Start of password protection
    if (getPassword() == null) {
        openPage('home');
        setActiveNav('home');
    } else {
        openPage('password');
        const topNav = document.querySelector('.top-nav');
        if (topNav) topNav.style.display = 'none';
    }

    // Load settings
    loadSettings();
    setupCloak();
    showAnnouncement();
}

  
// Password functions
function getPassword() {
    return localStorage.getItem('password') || null;
}

function setPassword() {
    const $password = document.getElementById('password-set');
    const password = $password.value;
    if (password == null || password == '') {
        showNotification('Removed password');
        localStorage.removeItem('password');
        return;
    }
    if (confirm("Are you sure you want to password protect this page? If you do, you will not be able to access this page without the password. If you do not want to password protect this page, click cancel.") == true) {
        localStorage.setItem('password', password);
        showNotification('Password set successfully!');
    }
}

function checkPassword() {
    const $password = document.getElementById('password-prompt');
    const password = $password.value;
    if (password == getPassword()) {
        openPage('home');
        setActiveNav('home');
        const topNav = document.querySelector('.top-nav');
        if (topNav) topNav.style.display = 'flex';
        showNotification('Password accepted!');
    } else {
        showNotification('Incorrect password!');
    }
}

// URL functions
function isUrl(val = "") {
    if (/^http(s?):\/\//.test(val) || (val.includes(".") && val.substr(0, 1) !== " "))
        return true;
    return false;
}

// Open URL through Cloudflare Function
function openURL(url) {
    if (!isUrl(url)) url = getSearchEngineURL() + url;
    else if (!(url.startsWith("https://") || url.startsWith("http://")))
        url = "http://" + url;

    const encoded = __uv$config.encodeUrl(url); // Proper UV XOR encoding

    if (getAboutBlank() === 'on') {
        openAboutBlank(window.location.origin + __uv$config.prefix + encoded);
    } else {
        window.location.href = __uv$config.prefix + encoded;
    }
}

function performSearch(engine, query) {
    let searchURL;
    switch(engine) {
        case 'Google':
            searchURL = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            break;
        case 'Brave Search':
            searchURL = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
            break;
        case 'DuckDuckGo':
            searchURL = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
            break;
        case 'Bing':
            searchURL = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
            break;
        default:
            searchURL = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    const encoded = __uv$config.encodeUrl(searchURL); // Proper UV XOR encoding

    if (getAboutBlank() === 'on') {
        openAboutBlank(window.location.origin + __uv$config.prefix + encoded);
    } else {
        window.location.href = __uv$config.prefix + encoded;
    }
}


if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(window.location.origin + "/js/sw.js");
  }
// Service Worker registration


// Navigation functions
function openPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
    });
    
    // Show the selected page
    const pageElement = document.getElementById(page);
    if (pageElement) {
        pageElement.style.display = 'flex';
    }
    
    // Update footer visibility
    const footer = document.getElementById('footer');
    if (footer) {
        footer.style.display = (page === 'settings' || page === 'password') ? 'none' : 'block';
    }
    
    // Focus search input if on search page
    if (page === 'search') {
        setTimeout(() => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.value = '';
            }
        }, 100);
    }
}

function setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

// Settings functions
function loadSettings() {
    // Search engine
    const savedEngine = localStorage.getItem('searchEngine') || 'Google';
    const searchSelect = document.getElementById('searchSelect');
    if (searchSelect) searchSelect.value = savedEngine;

    // Analytics
    const analytics = localStorage.getItem('analytics') || 'off';
    const analyticsSelect = document.getElementById('analyticsSelect');
    if (analyticsSelect) analyticsSelect.value = analytics;

    // About:blank
    const aboutBlank = localStorage.getItem('aboutBlank') || 'off';
    const aboutBlankSelect = document.getElementById('aboutBlankSelect');
    if (aboutBlankSelect) aboutBlankSelect.value = aboutBlank;

    // Set active search engine in UI
    const engines = document.querySelectorAll('.engine');
    engines.forEach(engine => {
        if (engine.getAttribute('data-engine') === savedEngine) {
            engine.classList.add('active');
        } else {
            engine.classList.remove('active');
        }
    });
}

function getSearchEngine() {
    return localStorage.getItem('searchEngine') || 'Google';
}

function setSearchEngine() {
    const searchSelect = document.getElementById('searchSelect');
    const searchEngine = searchSelect.value;
    
    switch(searchEngine) {
        case 'Google':
            localStorage.setItem('searchEngineURL', 'https://google.com/search?q=');
            break;
        case 'DuckDuckGo':
            localStorage.setItem('searchEngineURL', 'https://duckduckgo.com/?q=');
            break;
        case 'Bing':
            localStorage.setItem('searchEngineURL', 'https://bing.com/search?q=');
            break;
        case 'Brave Search':
            localStorage.setItem('searchEngineURL', 'https://search.brave.com/search?q=');
            break;
    }
    localStorage.setItem('searchEngine', searchEngine);
    showNotification(`Search engine set to ${searchEngine}`);
    
    // Update UI
    loadSettings();
}

function getSearchEngineURL() {
    return localStorage.getItem('searchEngineURL') || 'https://google.com/search?q=';
}

// Analytics functions (simplified - arc.io removed)
function getAnalytics() {
    return localStorage.getItem('analytics') || 'off';
}

function setAnalytics() {
    const analyticsSelect = document.getElementById('analyticsSelect');
    const analyticsPref = analyticsSelect.value;
    localStorage.setItem('analytics', analyticsPref);
    showNotification(`Analytics ${analyticsPref}`);
}

// About:blank functions
function getAboutBlank() {
    return localStorage.getItem('aboutBlank') || 'off';
}

function setAboutBlank() {
    const aboutBlankSelect = document.getElementById('aboutBlankSelect');
    const aboutBlankPref = aboutBlankSelect.value;
    localStorage.setItem('aboutBlank', aboutBlankPref);
    showNotification(`about:blank ${aboutBlankPref}`);
}

function openAboutBlank(url) {
    if (!url) {
        url = window.location.origin;
    }
    const w = window.open('about:blank', '_blank');
    if (w) {
        w.document.write(`<iframe style="height: 100%; width: 100%; border: none;" src="${url}" allowfullscreen></iframe>`);
        w.document.body.style.margin = '0';
    } else {
        showNotification("Please allow pop-ups to use about:blank");
    }
}

// Custom shortcut functions
function setCustomShortcut() {
    const shortcutURL = document.getElementById('shortcutURL');
    const shortcutLogo = document.getElementById('shortcutLogo');

    if (!shortcutURL.value && !shortcutLogo.value) {
        localStorage.removeItem('shortcutURL');
        localStorage.removeItem('shortcutLogo');
        showNotification('Custom shortcut cleared');
    } else if (!shortcutURL.value || !shortcutLogo.value) {
        showNotification('Please fill out both fields');
        return;
    } else {
        if (shortcutURL.value.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi)) {
            localStorage.setItem('shortcutURL', shortcutURL.value);
            localStorage.setItem('shortcutLogo', shortcutLogo.value.charAt(0));
            showNotification('Custom shortcut set!');
        } else {
            showNotification('Please enter a valid URL');
            return;
        }
    }
    setupCustomShortcut();
}

function setupCustomShortcut() {
    const customURL = localStorage.getItem('shortcutURL');
    const customLogo = localStorage.getItem('shortcutLogo');
    const customDiv = document.getElementById('customShortcutDiv');
    
    if (customURL && customLogo && customDiv) {
        const icon = customDiv.querySelector('.shortcut-icon span');
        if (icon) {
            icon.textContent = customLogo;
        }
        customDiv.onclick = function() { openURL(customURL); };
    }
}

// Cloak functions
function setupCloak() {
    const cloakTitle = localStorage.getItem('cloakTitle');
    const cloakFavicon = localStorage.getItem('cloakFavicon');
    
    if (cloakTitle) {
        document.title = cloakTitle;
    }
    if (cloakFavicon) {
        changeFavicon(cloakFavicon);
    }
}

function changeFavicon(src) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = src;
}
navigator.serviceWorker.register(window.location.origin + "/js/sw.js");

// Notification system
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 4000);
    } else {
        // Fallback to alert if notification system not available
        alert(message);
    }
}

function closeNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.add('hidden');
    }
}

// Announcement system
function showAnnouncement() {
    // Simple welcome message instead of fetching from file
    setTimeout(() => {
        showNotification('Welcome to Free☀️, enjoy the browsing.');
    }, 1000);
}

// Make functions globally available
window.openURL = openURL;
window.openPage = openPage;
window.setActiveNav = setActiveNav;
window.checkPassword = checkPassword;
window.setPassword = setPassword;
window.setSearchEngine = setSearchEngine;
window.setAboutBlank = setAboutBlank;
window.setAnalytics = setAnalytics;
window.setCustomShortcut = setCustomShortcut;
window.closeNotification = closeNotification;