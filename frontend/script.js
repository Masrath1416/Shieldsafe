// ================= CONFIG =================
//const BASE_URL = "https://womens-safety-backend-oz26.onrender.com"; // Production URL
//const BASE_URL = "https://shieldsafe-backend-production.up.railway.app";
const BASE_URL = "https://shieldsafe-1.onrender.com";
//const BASE_URL = "http://127.0.0.1:5000";
// ================= APP STATE =================
let isSirenPlaying = false;
let journeyTimerInterval = null;
let sirenAudio = document.getElementById("sosSound");
let deferredInstallPrompt = null;

// ================= LIVE MAP STATE =================
let map = null;
let userMarker = null;
let watchId = null;
let lastSyncTime = 0;

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
    // Hide splash screen after 2 seconds
    setTimeout(() => {
        const splash = document.getElementById("splashScreen");
        if (splash) {
            splash.style.opacity = "0";
            setTimeout(() => {
                splash.style.display = "none";
                checkAuthStatus();
            }, 500);
        }
    }, 2000);
});

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.section) {
        showSection(event.state.section);
    }
});

window.addEventListener('load', () => {
    loadProfile();
    const section = location.hash.replace('#', '') || 'home';
    showSection(section);
});

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;

    setInstallButtonsVisible(true);
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    setInstallButtonsVisible(false);
    showToast("ShieldSafe installed successfully", "success");
});

window.addEventListener("online", () => showToast("Back online", "success"));
window.addEventListener("offline", () => showToast("You are offline. SOS needs internet to send SMS.", "error"));

async function installApp() {
    if (isRunningStandalone()) {
        showToast("ShieldSafe is already installed", "success");
        setInstallButtonsVisible(false);
        return;
    }

    if (!deferredInstallPrompt) {
        showToast("Install from your browser menu if the prompt is unavailable", "info");
        return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;

    setInstallButtonsVisible(false);
}

function setInstallButtonsVisible(isVisible) {
    document.querySelectorAll(".install-app-btn").forEach((button) => {
        button.hidden = !isVisible;
    });
}

function isRunningStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function checkAuthStatus() {
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("userName");

    if (token) {
        if (userName) {
            document.getElementById("userName").innerText = userName;
        }
        const userPhoto = localStorage.getItem("userPhoto");
        if (userPhoto) {
            const navAvatar = document.getElementById("navAvatar");
            if (navAvatar) {
                navAvatar.innerHTML = `<img src="${userPhoto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
        }
        showApp();
    } else {
        showWelcome();
    }
}

// ================= NAVIGATION & UI =================
function showWelcome() {
    document.getElementById("welcomeSection").style.display = "flex";
    document.getElementById("authSection").style.display = "none";
    document.getElementById("appContent").style.display = "none";
}

function showAuth(type) {
    document.getElementById("welcomeSection").style.display = "none";
    document.getElementById("authSection").style.display = "flex";
    toggleAuth(type);
}

function toggleAuth(type) {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (type === 'login') {
        loginForm.style.display = "block";
        signupForm.style.display = "none";
    } else {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
    }
}

function showApp() {
    document.getElementById("welcomeSection").style.display = "none";
    document.getElementById("authSection").style.display = "none";
    document.getElementById("appContent").style.display = "block";
    
    // The load listener now handles the initial route, but if showApp is called directly:
    const section = location.hash.replace('#', '') || 'home';
    showSection(section);
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = "none";
    });

    const target = document.getElementById(sectionId);
    if (target) target.style.display = "block";

    if (!history.state || history.state.section !== sectionId) {
        history.pushState({ section: sectionId }, "", "#" + sectionId);
    }

    // SPECIAL: Load history if history tab clicked
    if (sectionId === 'history') {
        loadActivityHistory();
    }
    if (sectionId === 'contacts') {
        fetchContacts();
    }
    if (sectionId === 'location') {
        initMap();
    }
    if (sectionId === 'safetytips') {
        renderTips('all');
    }
    if (sectionId === 'settings') {
        loadProfile();
    }

    // Update nav links
    const navLinks = document.querySelectorAll(".nav-links a");
    navLinks.forEach(link => {
        if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Update bottom nav links
    const bottomNavLinks = document.querySelectorAll(".bottom-nav-item");
    bottomNavLinks.forEach(link => {
        if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Close mobile menu if open
    const navLinksEl = document.getElementById("navLinks");
    if (navLinksEl) navLinksEl.classList.remove("active");
}

async function loadActivityHistory() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        // Fetch SOS Alerts
        const sosRes = await fetch(`${BASE_URL}/api/sos`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const sosData = await sosRes.json();
        renderSosHistory(sosData);

        // Fetch Journeys
        const journeyRes = await fetch(`${BASE_URL}/api/journey`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const journeyData = await journeyRes.json();
        renderJourneyHistory(journeyData);

    } catch (err) {
        console.error("Failed to load history", err);
    }
}

function renderSosHistory(data) {
    const container = document.getElementById("sosHistory");
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="empty-state">No SOS alerts found.</div>`;
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="list-item">
            <div class="feature-icon-wrapper" style="width: 40px; height: 40px; color: var(--danger); border-color: rgba(239, 68, 68, 0.2);"><i data-lucide="bell-ring"></i></div>
            <div class="item-info" style="flex: 1; margin: 0 1rem;">
                <h4 style="color: var(--danger);">Emergency Alert Triggered</h4>
                <p>${new Date(item.alertTime).toLocaleString()}</p>
                <span style="font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 1rem; background: rgba(255,255,255,0.1);">${item.status}</span>
            </div>
            <div>
                <a href="https://maps.google.com/?q=${item.latitude},${item.longitude}" target="_blank" class="btn btn-secondary" style="padding: 0.5rem; border-radius: 50%;"><i data-lucide="map"></i></a>
            </div>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function renderJourneyHistory(data) {
    const container = document.getElementById("journeyHistory");
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="empty-state">No journeys found.</div>`;
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="list-item">
            <div class="feature-icon-wrapper" style="width: 40px; height: 40px;"><i data-lucide="route"></i></div>
            <div class="item-info" style="flex: 1; margin: 0 1rem;">
                <h4>Trip to ${item.destination}</h4>
                <p>${new Date(item.startedAt).toLocaleString()}</p>
                <span style="font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 1rem; background: rgba(255,255,255,0.1);">${item.status}</span>
            </div>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function switchHistoryTab(tab) {
    const sosTab = document.getElementById("tabSos");
    const journeyTab = document.getElementById("tabJourney");
    const sosList = document.getElementById("sosHistory");
    const journeyList = document.getElementById("journeyHistory");

    if (tab === 'sos') {
        sosTab.classList.add("active");
        journeyTab.classList.remove("active");
        sosList.style.display = "block";
        journeyList.style.display = "none";
    } else {
        sosTab.classList.remove("active");
        journeyTab.classList.add("active");
        sosList.style.display = "none";
        journeyList.style.display = "block";
    }
}

function toggleProfileMenu() {
    const dropdown = document.getElementById("profileDropdown");
    dropdown.classList.toggle("active");
}

function toggleMobileMenu() {
    const navLinks = document.getElementById("navLinks");
    navLinks.classList.toggle("active");
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
    
    // Stop the siren if dismissing the SOS modal
    if (modalId === 'sosModal') {
        stopSiren();
    }
}

// ================= AUTH LOGIC =================
async function handleSignup() {
    const name = document.getElementById("signupName")?.value;
    const email = document.getElementById("signupEmail")?.value;
    const password = document.getElementById("signupPassword")?.value;
    const errorDiv = document.getElementById("signupError");

    if (!email || !password) {
        alert("Please enter email & password");
        return;
    }
    if (!navigator.onLine) return alert("No internet connection! ❌");

    alert("Creating account... please wait ⏳");

    try {
        const res = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            errorDiv.innerText = data.message || data.error || "Signup failed ❌";
            errorDiv.style.display = "block";
            return;
        }

        alert("Signup successful ✅ Please login.");
        toggleAuth('login');
    } catch (err) {
        console.error("DEBUG INFO (Signup):", err);
        alert("Server error: Check console (F12) for details ❌");
    }
}

async function handleLogin() {
    const email = document.getElementById("loginEmail")?.value;
    const password = document.getElementById("loginPassword")?.value;
    const errorDiv = document.getElementById("loginError");

    if (!email || !password) {
        alert("Please enter email & password");
        return;
    }
    if (!navigator.onLine) return alert("No internet connection! ❌");

    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            errorDiv.innerText = data.message || data.error || "Login failed ❌";
            errorDiv.style.display = "block";
            return;
        }

        localStorage.setItem("token", data.token);
        if (data.user?.name) localStorage.setItem("userName", data.user.name);

        document.getElementById("userName").innerText = data.user?.name || "Profile";

        showApp();
    } catch (err) {
        console.error("DEBUG INFO (Login):", err);
        alert("Server error: Check console (F12) for details ❌");
    }
}

function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.reload();
}

function handleGoogleAuth() {
    alert("Google Auth integration coming soon!");
}

// ================= CONTACTS =================
function addContact() {
    const name = document.getElementById("contactName")?.value;
    const phone = document.getElementById("contactPhone")?.value;

    if (!name || !phone) return alert("Please fill all fields");

    const contacts = JSON.parse(localStorage.getItem("contacts")) || [];
    const newContact = {
        id: Date.now().toString(),
        name: name,
        phone: phone
    };
    contacts.push(newContact);
    localStorage.setItem("contacts", JSON.stringify(contacts));
    
    alert("Contact added ✅");
    document.getElementById("contactName").value = "";
    document.getElementById("contactPhone").value = "";
    fetchContacts();
}

function fetchContacts() {
    const contacts = JSON.parse(localStorage.getItem("contacts")) || [];
    renderContactList(contacts);
}

function renderContactList(contacts) {
    const container = document.getElementById("contactList");
    if (!container) return;

    if (!contacts || contacts.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem;">No contacts yet. Add trusted contacts.</div>`;
        return;
    }

    container.innerHTML = contacts.map(c => `
        <div class="contact-card" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border-subtle); margin-bottom: 0.5rem; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 style="margin: 0; font-weight: bold;">${c.name}</h4>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${c.phone}</p>
                </div>
            </div>
            <button onclick="deleteContact('${c.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer;">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function deleteContact(id) {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
    contacts = contacts.filter(c => c.id !== id);
    localStorage.setItem("contacts", JSON.stringify(contacts));
    fetchContacts();
}

// ================= SOS & LOCATION =================
function triggerSOS() {
    const contacts = JSON.parse(localStorage.getItem("contacts")) || [];

    if (contacts.length === 0) {
        alert("No contacts added!");
        return;
    }

    if (!navigator.geolocation) {
        alert("Geolocation not supported. Cannot send location.");
        return;
    }

    // Disable buttons
    const sosBtns = ["sosTriggerDesktop", "sosTriggerFab"].map(id => document.getElementById(id)).filter(Boolean);
    sosBtns.forEach(btn => {
        btn.innerText = "Sending...";
        btn.style.pointerEvents = "none";
    });

    navigator.geolocation.getCurrentPosition(async position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
            const res = await fetch(`${BASE_URL}/api/sos/trigger`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contacts,
                    latitude,
                    longitude
                })
            });

            if (!res.ok) {
                alert("❌ SOS failed");
                throw new Error("SOS API failed: " + res.status);
            }

            alert("🚨 SOS Triggered");
        } catch (err) {
            console.error(err);
            alert("Failed to send SOS");
        } finally {
            sosBtns.forEach(btn => {
                btn.innerText = "SOS";
                btn.style.pointerEvents = "auto";
            });
        }
    }, err => {
        alert("Failed to get location. Ensure GPS is on.");
        sosBtns.forEach(btn => {
            btn.innerText = "SOS";
            btn.style.pointerEvents = "auto";
        });
    });
}


// ================= LIVE MAP LOGIC =================
function initMap() {
    if (map) return; // Already initialized

    map = L.map('map').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 15);
            updateMapMarker(latitude, longitude);
        });
    }
}

function startLiveTracking() {
    if (!navigator.geolocation) return alert("Geolocation not supported");

    document.getElementById("startTrackingBtn").style.display = "none";
    document.getElementById("stopTrackingBtn").style.display = "inline-block";
    document.getElementById("location").classList.add("tracking-active");
    document.getElementById("trackingStatus").innerHTML = `<span class="status-dot"></span> Live Tracking Active`;

    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;

            document.getElementById("lat").innerText = latitude.toFixed(6);
            document.getElementById("lng").innerText = longitude.toFixed(6);

            updateMapMarker(latitude, longitude);
            map.panTo([latitude, longitude]);

            const now = Date.now();
            if (now - lastSyncTime > 10000) {
                syncLocationToBackend(latitude, longitude);
                lastSyncTime = now;
            }
        },
        (err) => {
            console.error("Tracking Error:", err);
            stopLiveTracking();
            alert("Location access denied or lost. ❌");
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
}

function stopLiveTracking() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    document.getElementById("startTrackingBtn").style.display = "inline-block";
    document.getElementById("stopTrackingBtn").style.display = "none";
    document.getElementById("location").classList.remove("tracking-active");
    document.getElementById("trackingStatus").innerHTML = `<span class="status-dot"></span> Tracking Inactive`;
}

function updateMapMarker(lat, lng) {
    if (!userMarker) {
        const safetyIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: var(--primary); width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px var(--primary-glow);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        userMarker = L.marker([lat, lng], { icon: safetyIcon }).addTo(map);
        userMarker.bindPopup("<b>You are here</b><br>Safety tracking active.").openPopup();
    } else {
        userMarker.setLatLng([lat, lng]);
    }
}

async function syncLocationToBackend(latitude, longitude) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        await fetch(`${BASE_URL}/api/location`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ latitude, longitude })
        });
    } catch (err) {
        console.error("Backend sync failed", err);
    }
}

// ================= SIREN =================
function toggleSiren() {
    if (isSirenPlaying) {
        stopSiren();
    } else {
        playSiren();
    }
}

function playSiren() {
    if (sirenAudio) {
        sirenAudio.loop = true;
        sirenAudio.play();
        isSirenPlaying = true;
    }
}

function stopSiren() {
    if (sirenAudio) {
        sirenAudio.pause();
        sirenAudio.currentTime = 0;
        isSirenPlaying = false;
    }
}

// ================= FAKE CALL =================
function triggerFakeCall() {
    alert("Fake call will arrive in 5 seconds...");
    setTimeout(() => {
        showModal('fakeCallModal');
    }, 5000);
}

// ================= SAFETRIP TRACKER =================
function startJourney() {
    const dest = document.getElementById("destination").value;
    const mins = document.getElementById("eta").value;

    if (!dest) return alert("Please enter destination");

    document.getElementById("journeySetup").style.display = "none";
    document.getElementById("journeyActive").style.display = "block";
    document.getElementById("displayDest").innerText = dest;

    let seconds = mins * 60;
    updateTimerDisplay('journeyTimerDisplay', seconds);

    journeyTimerInterval = setInterval(() => {
        seconds--;
        updateTimerDisplay('journeyTimerDisplay', seconds);

        if (seconds <= 0) {
            clearInterval(journeyTimerInterval);
            triggerSOS();
        }
    }, 1000);
}

function completeJourney() {
    clearInterval(journeyTimerInterval);
    document.getElementById("journeySetup").style.display = "block";
    document.getElementById("journeyActive").style.display = "none";
    alert("SafeTrip completed! Glad you reached safely.");
}

// ================= HELPERS =================
function updateTimerDisplay(elementId, totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    document.getElementById(elementId).innerText =
        `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ================= SAFETY TIPS =================
const safetyTips = [
    { category: 'outdoor', icon: 'eye', color: 'var(--primary)', title: 'Stay Aware of Your Surroundings', tip: 'Keep your head up and avoid looking at your phone while walking in unfamiliar areas. Confident, aware body language deters attackers.' },
    { category: 'outdoor', icon: 'ear', color: 'var(--primary)', title: 'Limit Headphone Use at Night', tip: 'Avoid wearing both earphones while walking alone at night. You need your hearing to detect approaching threats.' },
    { category: 'outdoor', icon: 'footprints', color: 'var(--primary)', title: 'Walk in Well-Lit Areas', tip: 'Always prefer busy, well-lit streets over shortcuts through dark alleys or parks, even if it takes longer.' },
    { category: 'outdoor', icon: 'users', color: 'var(--primary)', title: 'Trust Your Instincts', tip: 'If a person or situation makes you feel uneasy, leave immediately. Your instincts are a powerful safety tool.' },
    { category: 'digital', icon: 'lock', color: '#a855f7', title: 'Use Strong, Unique Passwords', tip: 'Use a password manager to generate and store unique passwords for every account. Never reuse passwords across sites.' },
    { category: 'digital', icon: 'wifi-off', color: '#a855f7', title: 'Avoid Public Wi-Fi for Sensitive Tasks', tip: 'Never log into banking or sensitive apps on public Wi-Fi. Use your mobile data or a trusted VPN instead.' },
    { category: 'digital', icon: 'map-pin-off', color: '#a855f7', title: 'Be Careful with Location Sharing', tip: 'Do not post real-time locations on social media. Wait until you have left a location before sharing it publicly.' },
    { category: 'digital', icon: 'user-x', color: '#a855f7', title: 'Guard Your Personal Information', tip: 'Do not share your home address, daily schedule, or workplace details with people you have only met online.' },
    { category: 'home', icon: 'door-closed', color: '#3b82f6', title: 'Lock Doors and Windows', tip: 'Develop a habit of locking your door immediately after entering your home, even during the day.' },
    { category: 'home', icon: 'bell-ring', color: '#3b82f6', title: 'Install a Doorbell Camera', tip: 'A smart video doorbell lets you see and speak to visitors without opening the door, even when you are not home.' },
    { category: 'home', icon: 'phone', color: '#3b82f6', title: 'Keep Your Phone Charged', tip: 'Always keep your phone above 20% battery when at home alone. A dead phone in an emergency is a serious risk.' },
    { category: 'home', icon: 'share-2', color: '#3b82f6', title: 'Share Your Plans with Someone', tip: 'Tell a trusted family member or friend where you are going and when you expect to be back, especially at night.' },
    { category: 'travel', icon: 'car', color: '#10b981', title: 'Verify Ride Details Before Entering', tip: 'Always confirm the car number, driver name, and photo match the app before getting into any cab or ride-share.' },
    { category: 'travel', icon: 'map', color: '#10b981', title: 'Pre-plan Your Route', tip: 'Research your destination before you travel. Download offline maps so you can navigate without relying on mobile data.' },
    { category: 'travel', icon: 'shopping-bag', color: '#10b981', title: 'Keep Valuables Hidden', tip: 'Use anti-theft bags and keep wallets and phones in inner pockets. Avoid displaying expensive items in public.' },
    { category: 'travel', icon: 'hotel', color: '#10b981', title: 'Choose Safe Accommodation', tip: 'Research hotels or hostels in advance. Ask for a room above the ground floor for added security.' },
];

function renderTips(filter = 'all') {
    const grid = document.getElementById('tipsGrid');
    if (!grid) return;
    const filtered = filter === 'all' ? safetyTips : safetyTips.filter(t => t.category === filter);
    grid.innerHTML = filtered.map(t => `
        <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; transition: transform 0.2s;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="feature-icon-wrapper" style="width: 40px; height: 40px; min-width:40px; color: ${t.color}; border-color: ${t.color}33;">
                    <i data-lucide="${t.icon}"></i>
                </div>
                <h4 style="font-size: 1rem; line-height: 1.3;">${t.title}</h4>
            </div>
            <p class="text-muted" style="font-size: 0.9rem; line-height: 1.6;">${t.tip}</p>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function filterTips(category) {
    // Update button styles
    const tabMap = { all: 'tipTabAll', outdoor: 'tipTabOutdoor', digital: 'tipTabDigital', home: 'tipTabHome', travel: 'tipTabTravel' };
    Object.keys(tabMap).forEach(k => {
        const btn = document.getElementById(tabMap[k]);
        if (btn) { btn.className = k === category ? 'btn btn-primary' : 'btn btn-secondary'; }
    });
    renderTips(category);
}

// ================= TOAST NOTIFICATIONS =================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if(type === 'success' || message.includes('✅')) icon = 'check-circle';
    if(type === 'error' || type === 'danger' || message.includes('❌')) icon = 'alert-circle';
    
    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message.replace(/[✅❌]/g, '').trim()}</span>`;
    container.appendChild(toast);
    
    if (window.lucide) lucide.createIcons();
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Override default alert for a premium feel
window.alert = function(message) {
    if(message.toLowerCase().includes('fail') || message.toLowerCase().includes('error') || message.includes('❌')) {
        showToast(message, 'error');
    } else {
        showToast(message, 'success');
    }
};

// ================= SETTINGS & PROFILE LOGIC =================

function loadProfile() {
    document.getElementById("profileName").value =
        localStorage.getItem("profileName") || "";

    document.getElementById("profilePhone").value =
        localStorage.getItem("profilePhone") || "";

    // Keep photo loading logic just in case
    const photo = localStorage.getItem("userPhoto") || "";
    const imgEl = document.getElementById("profileImage");
    const placeholderEl = document.getElementById("profileImagePlaceholder");
    if (imgEl && placeholderEl) {
        if (photo) {
            imgEl.src = photo;
            imgEl.style.display = "block";
            placeholderEl.style.display = "none";
        } else {
            imgEl.src = "";
            imgEl.style.display = "none";
            placeholderEl.style.display = "block";
            placeholderEl.innerText = localStorage.getItem("profileName") ? localStorage.getItem("profileName").charAt(0).toUpperCase() : "U";
        }
    }

    renderSettingsContacts();
}

function saveProfile() {
    const name = document.getElementById("profileName").value;
    const phone = document.getElementById("profilePhone").value;

    localStorage.setItem("profileName", name);
    localStorage.setItem("profilePhone", phone);

    alert("Profile Saved Successfully");
}

function triggerPhotoUpload() {
    const fileInput = document.getElementById("profilePhotoInput");
    if (fileInput) fileInput.click();
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file ❌");
        return;
    }

    // 2MB Limit to avoid exceeding localStorage quota
    if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB ❌");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        localStorage.setItem("userPhoto", dataUrl);
        loadProfile();
        showToast("Profile photo updated ✅", "success");
    };
    reader.readAsDataURL(file);
}

function renderSettingsContacts() {
    const container = document.getElementById("settingsContactsList");
    if (!container) return;

    const contacts = JSON.parse(localStorage.getItem("contacts")) || [];

    if (!contacts || contacts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">
                No emergency contacts added yet.
                <button class="btn btn-secondary" onclick="showSection('contacts')" style="margin-top: 0.5rem; padding: 0.4rem 0.8rem; font-size: 0.8rem; display: block; margin-left: auto; margin-right: auto;">
                    Add Contacts
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = contacts.map(c => `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.01); border: 1px solid var(--border-subtle); border-radius: 6px;">
            <div class="profile-avatar" style="width: 24px; height: 24px; font-size: 0.7rem; min-width: 24px;">${c.name.charAt(0).toUpperCase()}</div>
            <div style="flex: 1; min-width: 0; text-align: left;">
                <h4 style="font-size: 0.85rem; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary);">${c.name}</h4>
                <p style="font-size: 0.75rem; margin: 0; color: var(--text-secondary);">${c.phone}</p>
            </div>
        </div>
    `).join('');
}
