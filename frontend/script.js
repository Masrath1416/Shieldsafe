// ================= CONFIG =================
const BASE_URL = "https://womens-safety-backend-oz26.onrender.com";

// ================= APP STATE =================
let isSirenPlaying = false;
let safetyTimerInterval = null;
let journeyTimerInterval = null;
let sirenAudio = document.getElementById("sosSound");

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

function checkAuthStatus() {
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("userName");

    if (token) {
        if (userName) {
            document.getElementById("userName").innerText = userName;
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
    showSection('home');
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll("section");
    sections.forEach(s => s.classList.remove("active"));

    // Show target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add("active");
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

    // Update nav links
    const navLinks = document.querySelectorAll(".nav-item");
    navLinks.forEach(link => {
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
        <div class="history-item">
            <div class="history-icon sos"><i class="fas fa-bell"></i></div>
            <div class="history-info">
                <h4>Emergency Alert Triggered</h4>
                <p>${new Date(item.alertTime).toLocaleString()}</p>
                <span class="status-badge ${item.status.toLowerCase()}">${item.status}</span>
            </div>
            <div class="history-action">
                <a href="https://maps.google.com/?q=${item.latitude},${item.longitude}" target="_blank">View Map</a>
            </div>
        </div>
    `).join('');
}

function renderJourneyHistory(data) {
    const container = document.getElementById("journeyHistory");
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="empty-state">No journeys found.</div>`;
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="history-item">
            <div class="history-icon journey"><i class="fas fa-route"></i></div>
            <div class="history-info">
                <h4>Trip to ${item.destination}</h4>
                <p>${new Date(item.startedAt).toLocaleString()}</p>
                <span class="status-badge ${item.status.toLowerCase()}">${item.status}</span>
            </div>
        </div>
    `).join('');
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
async function addContact() {
    const name = document.getElementById("contactName")?.value;
    const phone = document.getElementById("contactPhone")?.value;
    const token = localStorage.getItem("token");

    if (!token) return alert("Please login first");
    if (!name || !phone) return alert("Please fill all fields");

    try {
        const res = await fetch(`${BASE_URL}/api/contacts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name, phone }),
        });

        if (res.ok) {
            alert("Contact added ✅");
            document.getElementById("contactName").value = "";
            document.getElementById("contactPhone").value = "";
            fetchContacts();
        } else {
            alert("Failed to add contact");
        }
    } catch (err) {
        console.error(err);
    }
}

async function fetchContacts() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${BASE_URL}/api/contacts`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        renderContactList(data);
    } catch (err) {
        console.error("Failed to fetch contacts", err);
    }
}

function renderContactList(contacts) {
    const container = document.getElementById("contactList");
    if (!container) return;

    if (!contacts || contacts.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">No contacts added yet.</p>`;
        return;
    }

    container.innerHTML = contacts.map(c => `
        <div class="contact-card">
            <div class="contact-info">
                <div class="contact-avatar">${c.contactName.charAt(0)}</div>
                <div>
                    <h4>${c.contactName}</h4>
                    <p>${c.contactPhone}</p>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteContact('${c.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

async function deleteContact(id) {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${BASE_URL}/api/contacts/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            fetchContacts();
        }
    } catch (err) {
        console.error("Delete failed", err);
    }
}

// ================= SOS & LOCATION =================
async function triggerSOS() {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login first");

    if (!navigator.geolocation) return alert("Geolocation not supported");

    showModal('sosModal');
    playSiren();

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        document.getElementById("alertLocation").innerText = `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        try {
            const res = await fetch(`${BASE_URL}/api/sos/trigger`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ latitude, longitude }),
            });
            const data = await res.json();
            console.log("SOS Triggered Successfully:", data);
        } catch (err) {
            console.error("SOS Alert failed to send to server", err);
        }
    }, () => {
        alert("Could not get location, but SOS alert triggered locally!");
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
            alert("Location access denied or lost.");
        },
        { enableHighAccuracy: true }
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

// ================= SAFETY TIMER =================
function startSafetyTimer() {
    const mins = document.getElementById("timerMinutes").value;
    let seconds = mins * 60;

    document.getElementById("timerControls").style.display = "none";
    document.getElementById("activeTimerControls").style.display = "block";

    updateTimerDisplay('timerDisplay', seconds);

    safetyTimerInterval = setInterval(() => {
        seconds--;
        updateTimerDisplay('timerDisplay', seconds);

        if (seconds <= 0) {
            clearInterval(safetyTimerInterval);
            triggerSOS();
            alert("Timer expired! SOS Triggered.");
        }
    }, 1000);
}

function checkIn() {
    clearInterval(safetyTimerInterval);
    document.getElementById("timerControls").style.display = "block";
    document.getElementById("activeTimerControls").style.display = "none";
    document.getElementById("timerDisplay").innerText = "00:00";
    alert("Glad you're safe! Timer stopped.");
}

// ================= JOURNEY MODE =================
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
    alert("Journey completed! Glad you reached safely.");
}

// ================= HELPERS =================
function updateTimerDisplay(elementId, totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    document.getElementById(elementId).innerText =
        `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}