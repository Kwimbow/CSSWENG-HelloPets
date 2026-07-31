// bookings list containing list of bookings 
const bookings = {
    "2026-07-30": [ // dummy bookings for july 30
        { start: "12:30", end: "13:30", name: "Coby", pet: "Max, Dog, Beagle" }
    ]
};

// selected
let currentYear = 2026;
let currentMonth = 6; // 0-indexed
let selectedDate = new Date(2026, 6, 29);

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const calendarGrid = document.getElementById('calendarGrid');
const calMonthLabel = document.getElementById('calMonthLabel');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const bookingsList = document.getElementById('bookingsList');
const blockTimeBox = document.getElementById('blockTimeBox');

function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// removes sunday 
function tuesSunColumn(jsDay) {
    if (jsDay === 1) return -1;
    if (jsDay === 0) return 5;
    return jsDay - 2;
    // sun 0, mon 1, tues 2, wed 3, thur 4, fri 5, sat 6
    // tues 0, wed 1, thurs 2, fri 3, sat 4, sun 5
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    calMonthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    let firstCol = tuesSunColumn(firstOfMonth.getDay());

    // removes 1st week if moneth starts on sunday
    if (firstCol === -1) firstCol = 0, calendarGrid.dataset.tuesdayStart = "1";

    // blank days
    const leading = firstCol === -1 ? 0 : firstCol;
    for (let i = 0; i < leading; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day empty';
        calendarGrid.appendChild(blank);
    }

    // render remainindg days
    for (let day = 1; day <= daysInMonth; day++) {
        const thisDate = new Date(currentYear, currentMonth, day);
        const jsDay = thisDate.getDay();
        if (jsDay === 1) continue; // skip monday

        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.textContent = day;

        if (bookings[dateKey(thisDate)] && bookings[dateKey(thisDate)].length) {
            const dot = document.createElement('span');
            dot.className = 'day-dot';
            cell.appendChild(dot);
        }

        // selected date stuff
        if (sameDate(thisDate, selectedDate)) {
            cell.classList.add('selected');
        }

        cell.addEventListener('click', () => {
            selectedDate = thisDate;
            renderCalendar();
            renderDayPanel();
        });

        calendarGrid.appendChild(cell);
    }
}

function renderDayPanel() {
    selectedDateLabel.textContent = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()} ${selectedDate.getFullYear()}`;

    // fetch bookings
    const key = dateKey(selectedDate);
    const dayBookings = bookings[key] || [];

    bookingsList.innerHTML = '';

    if (dayBookings.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-bookings';
        empty.textContent = 'No bookings for this day.';
        bookingsList.appendChild(empty);
    }

    else {
        dayBookings.forEach((b, idx) => {
            const entry = document.createElement('div');
            entry.className = 'booking-entry';

            const info = document.createElement('div');
            info.className = 'booking-entry-info';

            const timeName = document.createElement('span');
            timeName.className = 'booking-time-name';
            timeName.textContent = `${formatTime(b.start)} - ${formatTime(b.end)} || ${b.name}`;

            const petInfo = document.createElement('ul');
            petInfo.style.margin = '0';
            const li = document.createElement('li');
            li.className = 'booking-pet-info';
            li.textContent = b.pet;
            petInfo.appendChild(li);

            info.appendChild(timeName);
            info.appendChild(petInfo);

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = "<i class='bx bx-trash'></i>";
            delBtn.addEventListener('click', () => {
                bookings[key].splice(idx, 1); // ---------------------------- js delete booking add db implementation here mayhaps
                renderCalendar();
                renderDayPanel();
            });

            entry.appendChild(info);
            entry.appendChild(delBtn);
            bookingsList.appendChild(entry);
        });
    }

    closeBlockBox();
}

function formatTime(t) {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${String(m).padStart(2,'0')} ${period}`;
}



// blocking time



// for the time selection 
function buildHourOptions() {
    let out = '';
    for (let i = 1; i <= 12; i++) {
        out += `<option value="${i}">${i}</option>`;
    }
    return out;
}

function closeBlockBox() {
    blockTimeBox.classList.remove('open');
    blockTimeBox.innerHTML = 'Block a time on this day';
    blockTimeBox.addEventListener('click', openBlockBox, { once: true });
}

function openBlockBox() {
    blockTimeBox.classList.add('open');
    blockTimeBox.innerHTML = `
        <label class="block-full-day-row">
            <input type="checkbox" id="blockFullDayChk">
            <span class="block-checkbox-box"></span>
            Block full day
        </label>

        <div class="time-inputs-row" id="timeInputsRow">
            <div class="time-group">
                <label>Start</label>
                <div class="time-box">
                    <select id="startHour">${buildHourOptions()}</select>
                    <span class="time-colon">: 00</span>
                    <select id="startPeriod"><option>AM</option><option>PM</option></select>
                </div>
            </div>
            <div class="time-group">
                <label>End</label>
                <div class="time-box">
                    <select id="endHour">${buildHourOptions()}</select>
                    <span class="time-colon">: 00</span>
                    <select id="endPeriod"><option>AM</option><option>PM</option></select>
                </div>
            </div>
        </div>

        <div class="block-actions-row">
            <button class="block-btn block-cancel-btn" id="cancelBlockBtn">Cancel</button>
            <button class="block-btn block-add-btn" id="addBlockBtn">Add Block</button>
        </div>
    `;

    document.getElementById('startHour').value = 12;
    document.getElementById('endHour').value = 12;

    document.getElementById('blockFullDayChk').addEventListener('change', (e) => {
        document.getElementById('timeInputsRow').classList.toggle('disabled', e.target.checked);
    });

    document.getElementById('cancelBlockBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        closeBlockBox();
    });

    document.getElementById('addBlockBtn').addEventListener('click', () => {
        const key = dateKey(selectedDate);
        if (!bookings[key]) bookings[key] = [];

        const fullDay = document.getElementById('blockFullDayChk').checked;

        if (fullDay) {
            bookings[key].push({ start: "00:00", end: "23:59", name: "Blocked", pet: "Full day blocked" });
        } else {
            const sh = to24h(document.getElementById('startHour').value, document.getElementById('startPeriod').value);
            const eh = to24h(document.getElementById('endHour').value, document.getElementById('endPeriod').value);
            bookings[key].push({ start: `${sh}:${sm}`, end: `${eh}:${em}`, name: "Blocked", pet: "Time slot blocked" });
        }

        renderCalendar();
        renderDayPanel();
    });
}

// display 12hr. in db, 24h
function to24h(hour12, period) {
    let h = parseInt(hour12, 10) % 12;
    if (period === 'PM') h += 12;
    return String(h).padStart(2, '0');
}

document.getElementById('prevMonthBtn').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
});

// init
renderCalendar();
renderDayPanel();