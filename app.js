// State Management
let sessions = JSON.parse(localStorage.getItem('sessions')) || [];
let currentDate = new Date();
let selectedDate = new Date();

// DOM Elements
const calendarDays = document.getElementById('calendar-days');
const monthYearDisplay = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal');
const sessionForm = document.getElementById('session-form');
const cancelModal = document.getElementById('cancel-modal');
const dayDetail = document.getElementById('day-detail');
const detailDate = document.getElementById('detail-date');
const detailList = document.getElementById('detail-list');
const closeDetail = document.getElementById('close-detail');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// Initialize
function init() {
    renderCalendar();
    setupEventListeners();
}

// Render Calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYearDisplay.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
    
    calendarDays.innerHTML = '';
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const div = createDayElement(day, 'other-month', new Date(year, month - 1, day));
        calendarDays.appendChild(div);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        let className = 'day';
        if (isToday(date)) className += ' today';
        if (hasEvent(date)) className += ' has-event';
        if (isSelected(date)) className += ' selected';
        
        const div = createDayElement(i, className, date);
        calendarDays.appendChild(div);
    }
    
    // Next month days
    const totalDaysShown = firstDayOfMonth + daysInMonth;
    const nextMonthDays = (Math.ceil(totalDaysShown / 7) * 7) - totalDaysShown;
    for (let i = 1; i <= nextMonthDays; i++) {
        const div = createDayElement(i, 'other-month', new Date(year, month + 1, i));
        calendarDays.appendChild(div);
    }
}

function createDayElement(day, className, date) {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = day;
    div.onclick = () => selectDate(date);
    return div;
}

function selectDate(date) {
    selectedDate = new Date(date);
    renderCalendar();
    showDayDetails(date);
}

function showDayDetails(date) {
    const dateStr = formatDate(date);
    const daySessions = sessions.filter(s => s.date === dateStr);
    
    detailDate.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
    detailList.innerHTML = '';
    
    if (daySessions.length === 0) {
        detailList.innerHTML = '<li>No sessions recorded</li>';
    } else {
        daySessions.forEach(session => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${session.time}</span>
                <button class="delete-session" onclick="deleteSession(${session.id})">&times;</button>
            `;
            detailList.appendChild(li);
        });
    }
    
    dayDetail.classList.remove('hidden');
}

// Helpers
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

function hasEvent(date) {
    const dateStr = formatDate(date);
    return sessions.some(s => s.date === dateStr);
}

function isSelected(date) {
    return date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Event Listeners
function setupEventListeners() {
    prevMonthBtn.onclick = () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    };
    
    nextMonthBtn.onclick = () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    };
    
    addBtn.onclick = () => {
        const now = new Date();
        document.getElementById('session-date').value = formatDate(now);
        document.getElementById('session-time').value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        modal.classList.remove('hidden');
    };
    
    cancelModal.onclick = () => modal.classList.add('hidden');
    
    sessionForm.onsubmit = (e) => {
        e.preventDefault();
        const date = document.getElementById('session-date').value;
        const time = document.getElementById('session-time').value;
        
        const newSession = {
            id: Date.now(),
            date,
            time
        };
        
        sessions.push(newSession);
        saveSessions();
        modal.classList.add('hidden');
        renderCalendar();
        
        // If we're looking at the same date, update the details
        const currentSelectedStr = formatDate(selectedDate);
        if (date === currentSelectedStr) {
            showDayDetails(selectedDate);
        }
    };
    
    closeDetail.onclick = () => dayDetail.classList.add('hidden');
    
    exportBtn.onclick = exportData;
    importBtn.onclick = () => importFile.click();
    importFile.onchange = importData;
}

function deleteSession(id) {
    if (confirm('Are you sure you want to delete this session?')) {
        sessions = sessions.filter(s => s.id !== id);
        saveSessions();
        renderCalendar();
        showDayDetails(selectedDate);
    }
}

function saveSessions() {
    localStorage.setItem('sessions', JSON.stringify(sessions));
}

// Data Export/Import
function exportData() {
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'did-it-days-backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                if (confirm(`Import ${imported.length} sessions? This will merge with your current data.`)) {
                    // Simple merge: filter out duplicates if they have the same ID
                    const existingIds = new Set(sessions.map(s => s.id));
                    const newOnes = imported.filter(s => !existingIds.has(s.id));
                    sessions = [...sessions, ...newOnes];
                    saveSessions();
                    renderCalendar();
                    alert('Import successful!');
                }
            } else {
                alert('Invalid file format');
            }
        } catch (err) {
            alert('Error parsing file');
        }
    };
    reader.readAsText(file);
}

init();
