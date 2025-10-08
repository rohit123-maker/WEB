// --- ELEMENT REFERENCES ---
const root = document.documentElement;
const settingsPanel = document.getElementById('settings-panel');
const mainContainer = document.getElementById('main-container');
const pinButton = document.getElementById('pin-button');
const sessionGoalDisplay = document.getElementById('session-goal');
const timeDisplay = document.getElementById('time');
const dateDisplay = document.getElementById('date');
const greetingDisplay = document.getElementById('greeting');
const locationDisplay = document.getElementById('location-display');
const weatherDisplay = document.getElementById('weather-display');
const timerDisplay = document.getElementById('timer-display');
const stopwatchDisplay = document.getElementById('stopwatch-display');
// These references are needed for the tab logic:
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// --- LOCAL STORAGE KEY ---
const LS_PREFIX = 'smartClock_';

// --- GLOBAL VARIABLES for Timer/Stopwatch ---
let timerInterval = null;
let totalTime = 300; // Default to 5 minutes (300 seconds)
let stopwatchInterval = null;
let stopwatchTime = 0; 
let stopwatchStartTime = 0;

// =======================================================
// I. INITIALIZATION AND LOCAL STORAGE
// =======================================================

function loadSettings() {
    // 1. Load Customization Settings
    const storedTheme = localStorage.getItem(LS_PREFIX + 'theme') || 'neon-blue';
    const storedColor = localStorage.getItem(LS_PREFIX + 'primaryColor') || '#66fcf1';
    const storedFont = localStorage.getItem(LS_PREFIX + 'font') || "'Segoe UI', sans-serif";
    const storedBgUrl = localStorage.getItem(LS_PREFIX + 'bgUrl') || '';
    const storedGoal = localStorage.getItem(LS_PREFIX + 'goal') || 'No Goal Set';
    const isPinned = localStorage.getItem(LS_PREFIX + 'isPinned') === 'true';
    const isHidden = localStorage.getItem(LS_PREFIX + 'isHidden') === 'true';

    // Apply loaded settings
    setTheme(storedTheme, false); // false = don't save again
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = storedTheme;

    setCustomColor('primary', storedColor, false, false);
    const colorPicker = document.getElementById('primary-color-picker');
    if (colorPicker) colorPicker.value = storedColor;

    setFontStyle(storedFont, false);
    const fontSelect = document.getElementById('font-select');
    if (fontSelect) fontSelect.value = storedFont;

    setCustomBackground(storedBgUrl, false);
    const bgInput = document.getElementById('bg-url-input');
    if (bgInput) bgInput.value = storedBgUrl;

    setSessionGoal(storedGoal, false);
    const goalInput = document.getElementById('session-goal-input');
    if (goalInput) goalInput.value = (storedGoal === 'No Goal Set') ? '' : storedGoal;

    // Apply Pin/Hide State
    if (isPinned) togglePin(false);
    if (isHidden) toggleHide(false);

    // 2. Load Timer/Stopwatch State
    const lastTotalTime = parseInt(localStorage.getItem(LS_PREFIX + 'totalTime')) || 300;
    totalTime = lastTotalTime;
    
    // Ensure display and inputs are synchronized
    timerDisplay.textContent = formatTime(lastTotalTime);
    const timerHours = document.getElementById('timer-hours');
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    if (timerHours) timerHours.value = Math.floor(lastTotalTime / 3600);
    if (timerMinutes) timerMinutes.value = Math.floor((lastTotalTime % 3600) / 60);
    if (timerSeconds) timerSeconds.value = lastTotalTime % 60;
    
    stopwatchTime = parseInt(localStorage.getItem(LS_PREFIX + 'stopwatchTime')) || 0;
    stopwatchDisplay.textContent = formatStopwatchTime(stopwatchTime);
}

// =======================================================
// II. TAB SWITCHING LOGIC
// =======================================================

function showTab(tabId) {
    // 1. Deactivate all tab buttons and content
    tabButtons.forEach(button => button.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // 2. Activate the selected tab button and content
    const selectedButton = document.querySelector(`#tabs button[onclick="showTab('${tabId}')"]`);
    if (selectedButton) selectedButton.classList.add('active');
    
    const selectedContent = document.getElementById(tabId);
    if (selectedContent) selectedContent.classList.add('active');

    // 3. Pause any background counting to save resources and avoid drift
    if (tabId !== 'timer') pauseTimer();
    if (tabId !== 'stopwatch') pauseStopwatch();
}

// =======================================================
// III. TIMER LOGIC
// =======================================================

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

function startTimer() {
    if (timerInterval) return; 
    
    // Read time from input fields only if the timer is at 0 or finished
    if (totalTime <= 0 || timerDisplay.textContent === "TIME UP!") {
        const h = parseInt(document.getElementById('timer-hours').value) || 0;
        const m = parseInt(document.getElementById('timer-minutes').value) || 0;
        const s = parseInt(document.getElementById('timer-seconds').value) || 0;
        totalTime = (h * 3600) + (m * 60) + s;
    }
    
    if (totalTime <= 0) { 
        alert("Please set a time greater than zero!"); 
        return; 
    }
    
    timerInterval = setInterval(() => {
        totalTime--;
        timerDisplay.textContent = formatTime(totalTime);
        localStorage.setItem(LS_PREFIX + 'totalTime', totalTime);
        
        if (totalTime <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerDisplay.textContent = "TIME UP!";
            // Optional: Add a subtle alert sound or visual flash here
            localStorage.setItem(LS_PREFIX + 'totalTime', 0);
        }
    }, 1000);
}

function pauseTimer() { 
    clearInterval(timerInterval); 
    timerInterval = null; 
    localStorage.setItem(LS_PREFIX + 'totalTime', totalTime);
}

function resetTimer() { 
    pauseTimer(); 
    totalTime = 300; // Reset to default 5 minutes
    document.getElementById('timer-hours').value = 0;
    document.getElementById('timer-minutes').value = 5;
    document.getElementById('timer-seconds').value = 0;
    timerDisplay.textContent = formatTime(totalTime);
    localStorage.setItem(LS_PREFIX + 'totalTime', 300);
}


// =======================================================
// IV. STOPWATCH LOGIC
// =======================================================

function formatStopwatchTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10); 
    const parts = [h, m, s];
    const formattedTime = parts.map(v => v.toString().padStart(2, '0')).join(':');
    return `${formattedTime}:${cs.toString().padStart(2, '0')}`;
}

function startStopwatch() {
    if (stopwatchInterval) return; 
    // Calculate start time based on current time and stored stopwatchTime (to resume)
    stopwatchStartTime = Date.now() - stopwatchTime;
    
    stopwatchInterval = setInterval(() => {
        stopwatchTime = Date.now() - stopwatchStartTime;
        stopwatchDisplay.textContent = formatStopwatchTime(stopwatchTime);
        localStorage.setItem(LS_PREFIX + 'stopwatchTime', stopwatchTime);
    }, 10); // Update every 10 milliseconds for smooth centiseconds
}

function pauseStopwatch() { 
    clearInterval(stopwatchInterval); 
    stopwatchInterval = null; 
    localStorage.setItem(LS_PREFIX + 'stopwatchTime', stopwatchTime);
}

function resetStopwatch() { 
    pauseStopwatch(); 
    stopwatchTime = 0; 
    stopwatchDisplay.textContent = "00:00:00:00";
    localStorage.setItem(LS_PREFIX + 'stopwatchTime', 0);
}


// =======================================================
// V. CLOCK & GEOLOCATION
// =======================================================

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayOfWeek = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dayOfMonth = now.getDate().toString();
    const year = now.getFullYear();
    dateDisplay.textContent = `${dayOfWeek}, ${monthName} ${dayOfMonth}, ${year}`;

    const currentHour = now.getHours();
    let greetingText;
    if (currentHour < 12) { greetingText = 'Good Morning!'; } 
    else if (currentHour < 17) { greetingText = 'Good Afternoon.'; } 
    else if (currentHour < 22) { greetingText = 'Good Evening.'; } 
    else { greetingText = 'Good Night.'; }
    greetingDisplay.textContent = greetingText;
}

function getCityFromCoords(lat, lon) {
    // Mock Geo-lookup without a server/API key
    locationDisplay.textContent = `Location: Lat ${lat}, Lon ${lon}`;
    weatherDisplay.textContent = 'Weather/City lookup requires a separate API key.';
}

function getLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(4);
                const lon = position.coords.longitude.toFixed(4);
                getCityFromCoords(lat, lon);
            },
            (error) => {
                let errorMsg = (error.code === error.PERMISSION_DENIED) ? 'Location permission denied.' : 'Location information unavailable.';
                locationDisplay.textContent = errorMsg;
                weatherDisplay.textContent = 'Cannot fetch weather without location.';
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        locationDisplay.textContent = "Geolocation not supported.";
        weatherDisplay.textContent = '';
    }
}


// =======================================================
// VI. CUSTOMIZATION & CONTROL LOGIC
// =======================================================

function setSessionGoal(goal, save = true) {
    const goalText = goal.trim() || "No Goal Set";
    sessionGoalDisplay.textContent = goalText;
    if (save) localStorage.setItem(LS_PREFIX + 'goal', goalText);
}

function toggleMenu() { settingsPanel.classList.toggle('open'); }

function togglePin(save = true) {
    mainContainer.classList.toggle('pinned');
    pinButton.classList.toggle('pinned-active');
    if (save) localStorage.setItem(LS_PREFIX + 'isPinned', mainContainer.classList.contains('pinned'));
}

function toggleHide(save = true) {
    mainContainer.classList.toggle('hidden');
    if (save) localStorage.setItem(LS_PREFIX + 'isHidden', mainContainer.classList.contains('hidden'));
}

function setTheme(themeName, save = true) {
    document.body.className = `theme-${themeName}`; 
    root.style.setProperty('--primary-color', ''); 
    root.style.setProperty('--secondary-color', '');
    root.style.setProperty('--bg-color', '');
    root.style.setProperty('--container-bg', '');
    root.style.setProperty('--neon-glow', '');

    if (save) localStorage.setItem(LS_PREFIX + 'theme', themeName);
    
    if (themeName !== 'custom') {
        setTimeout(() => {
            const computedColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
            const colorPicker = document.getElementById('primary-color-picker');
            if (colorPicker) colorPicker.value = computedColor;
            setCustomColor('primary', computedColor, true, true);
        }, 50);
    }
}

function setCustomColor(colorType, value, save = true, isThemeLoad = false) {
    if (!isThemeLoad) setTheme('custom', save);
    
    if (colorType === 'primary') {
        root.style.setProperty('--primary-color', value);
        const rgb = hexToRgb(value);
        root.style.setProperty('--neon-glow', `0 0 10px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
        if (save) localStorage.setItem(LS_PREFIX + 'primaryColor', value);
    }
}

function setCustomBackground(url, save = true) {
    if (url) {
        root.style.setProperty('--custom-bg-url', `url('${url}')`);
        document.body.classList.add('custom-bg');
        if (save) localStorage.setItem(LS_PREFIX + 'bgUrl', url);
    } else {
        clearCustomBackground(save);
    }
}

function clearCustomBackground(save = true) {
    root.style.removeProperty('--custom-bg-url');
    document.body.classList.remove('custom-bg');
    const bgInput = document.getElementById('bg-url-input');
    if (bgInput) bgInput.value = '';
    if (save) localStorage.removeItem(LS_PREFIX + 'bgUrl');
}

function setFontStyle(font, save = true) {
    root.style.setProperty('--main-font', font);
    if (save) localStorage.setItem(LS_PREFIX + 'font', font);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
}


// =======================================================
// VII. INITIALISATION (Code that runs on page load)
// =======================================================

// Register the functions globally so they can be called from index.html buttons
window.showTab = showTab;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
window.startStopwatch = startStopwatch;
window.pauseStopwatch = pauseStopwatch;
window.resetStopwatch = resetStopwatch;
window.setSessionGoal = setSessionGoal;
window.toggleMenu = toggleMenu;
window.togglePin = togglePin;
window.toggleHide = toggleHide;
window.setTheme = setTheme;
window.setCustomColor = setCustomColor;
window.setCustomBackground = setCustomBackground;
window.clearCustomBackground = clearCustomBackground;
window.setFontStyle = setFontStyle;

// Run the core startup routines
loadSettings();
updateClock();
setInterval(updateClock, 1000);
getLocation();
showTab('clock');
