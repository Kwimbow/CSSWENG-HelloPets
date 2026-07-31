// bookings list containing list of bookings 
// bookings mapped to dates in the format "YYYY-MM--DD"
let bookings = {};

// selected
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth(); 
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const calendarGrid = document.getElementById('calendarGrid');
const calMonthLabel = document.getElementById('calMonthLabel');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const bookingsList = document.getElementById('bookingsList');
const blockTimeBox = document.getElementById('blockTimeBox');

// adds slot from the DB into the bookings cache
function parseSlotIntoBookings(slot) {
  if (!bookings[slot.date]) {
    bookings[slot.date] = [];
  }

  // slots are fixed 1-hour durations
  const [h, m] = slot.time.split(":").map(Number);
  const endHour = String((h + 1) % 24).padStart(2, "0");
  const endString = `${endHour}:${String(m).padStart(2, "0")}`;

  if (slot.status === "booked" && slot.booking) {
    bookings[slot.date].push({
      _id: slot._id,
      start: slot.time,
      end: endString,
      name: `${slot.booking.customer.firstName} ${slot.booking.customer.lastName}`,
      pet: `${slot.booking.petName}, ${slot.booking.petSelection}, ${slot.booking.petBreed || ""}`,
    });
  } else if (slot.status === "blocked") {
    bookings[slot.date].push({
      _id: slot._id,
      start: slot.time,
      end: endString,
      name: "Blocked",
      pet: "Slot blocked",
    });
  }
}

// fetches all booked/blocked slots for every day in the given month
async function fetchMonthBookings(year, month) {
  try {
    bookings = {}; 

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const formattedMonth = String(month + 1).padStart(2, "0");

    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(`${year}-${formattedMonth}-${String(day).padStart(2, "0")}`);
    }

    const responses = await Promise.all(
      dates.map((date) => fetch(`/api/admin/slots/${date}`))
    );
    const results = await Promise.all(
      responses.map((res) => res.json())
    );

    results.forEach((data) => {
      if (data.success && Array.isArray(data.slots)) {
        data.slots.forEach(parseSlotIntoBookings);
      }
    });

    renderCalendar();
    renderDayPanel();
  } catch (error) {
    console.error("Failed to load bookings:", error);
  }
}



function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// removes sunday 
function mondaySatColumn(jsDay) {
    if (jsDay === 0) return -1;
    return jsDay - 1; // Mon=1->0 ... Sat=6->5
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    calMonthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    let firstCol = mondaySatColumn(firstOfMonth.getDay());

    // removes 1st week if moneth starts on sunday
    if (firstCol === -1) firstCol = 0, calendarGrid.dataset.sundayStart = "1";

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
        if (jsDay === 0) continue; // skip sunday

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

async function renderDayPanel() {
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


const timeSlots = ["10:00","11:00","12:00","13:00","14:00","15:00","16:00"];

// for the time selection
function buildHourOptions() {
    let out = '';
    for (let i = 1; i <= 12; i++) {
        out += `<option value="${i}">${i}</option>`;
    }
    return out;
}
function buildMinuteOptions() {
    return [0, 15, 30, 45].map(m => {
        const val = String(m).padStart(2, '0');
        return `<option value="${val}">${val}</option>`;
    }).join('');
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
                    <span class="time-colon">:</span>
                    <select id="startMin">${buildMinuteOptions()}</select>
                    <select id="startPeriod"><option>AM</option><option>PM</option></select>
                </div>
            </div>
            <div class="time-group">
                <label>End</label>
                <div class="time-box">
                    <select id="endHour">${buildHourOptions()}</select>
                    <span class="time-colon">:</span>
                    <select id="endMin">${buildMinuteOptions()}</select>
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

    document.getElementById('addBlockBtn').addEventListener('click', async () => {
        const date = dateKey(selectedDate);
        const fullDay = document.getElementById('blockFullDayChk').checked;
        
        // TODO (2026-07-31) consider simplifying UI to just a selector of the slots for the given day
        let slotsToBlock;
        if (fullDay) {
            slotsToBlock = timeSlots;
        } else {
            const startH = parseInt(to24h(document.getElementById('startHour').value, document.getElementById('startPeriod').value), 10);
            const startM = parseInt(document.getElementById('startMin').value, 10);
            const endH   = parseInt(to24h(document.getElementById('endHour').value,   document.getElementById('endPeriod').value),   10);
            const endM   = parseInt(document.getElementById('endMin').value, 10);

            const inputStart = startH * 60 + startM;
            const inputEnd   = endH   * 60 + endM;

            slotsToBlock = timeSlots.filter(t => {
                const [sh, sm] = t.split(':').map(Number);
                const slotStart = sh * 60 + sm;
                return slotStart < inputEnd && slotStart + 60 > inputStart;
            });
        }

        if (slotsToBlock.length === 0) {
            alert('No available time slots overlap with the selected range.');
            return;
        }

        const results = await Promise.all(
            slotsToBlock.map(time =>
                fetch('/api/admin/slots/block', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date, time }),
                }).then(r => r.json())
            )
        );

        if (results.some(r => !r.success)) {
            alert('One or more slots failed to block.');
        }

        // fetch this date again to keep the cache in sync
        const slotRes = await fetch(`/api/admin/slots/${date}`);
        const slotData = await slotRes.json();
        bookings[date] = [];
        if (slotData.success) slotData.slots.forEach(parseSlotIntoBookings);

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
    fetchMonthBookings(currentYear, currentMonth);
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    fetchMonthBookings(currentYear, currentMonth);
});

fetchMonthBookings(currentYear, currentMonth);