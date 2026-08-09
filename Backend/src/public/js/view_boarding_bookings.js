(function () {
  // bookings list containing list of bookings
  // bookings mapped to dates in the format "YYYY-MM-DD"
  let bookings = {};

  // selected
  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();
  let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const calendarGrid = document.getElementById('boardingCalendarGrid');
  const calMonthLabel = document.getElementById('boardingCalMonthLabel');
  const selectedDateLabel = document.getElementById('boardingSelectedDateLabel');
  const bookingsList = document.getElementById('boardingBookingsList');
  const blockTimeBox = document.getElementById('boardingBlockDayBox');

  // adds a day's boarding slot into the bookings cache
  function parseSlotIntoBookings(date, slot) {
    if (!bookings[date]) {
      bookings[date] = [];
    }

    if (slot && slot.blocked) {
      bookings[date].push({
        _id: `${date}-blocked`,
        name: "Blocked",
        pet: "Day blocked",
        blocked: true,
      });
    }

    if (slot && Array.isArray(slot.bookings)) {
      slot.bookings.forEach((b) => {
        bookings[date].push({
          _id: b._id,
          name: `${b.customer.firstName} ${b.customer.lastName}`,
          pet: `${b.petName}, ${b.petSelection}, ${b.petBreed || ""}`,
          email: b.customer.email,
          phone: b.customer.mobileNumber,
          petName: b.petName,
          petWeight: b.petWeight,
          petSelection: b.petSelection,
          petBreed: b.petBreed,
          startDate: b.startDate,
          startTime: b.startTime,
          endDate: b.endDate,
          endTime: b.endTime,
          notes: b.optionalNotes || "",
        });
      });
    }
  }

  // fetches every day's boarding slot for the given month
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
        dates.map((date) => fetch(`/api/admin/boarding-slots/${date}`))
      );
      const results = await Promise.all(
        responses.map((res) => res.json())
      );

      results.forEach((data, idx) => {
        if (data.success) {
          parseSlotIntoBookings(dates[idx], data.slot);
        }
      });

      renderCalendar();
      renderDayPanel();
    } catch (error) {
      console.error("Failed to load boarding bookings:", error);
    }
  }

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

    // removes 1st week if month starts on sunday
    if (firstCol === -1) firstCol = 0, calendarGrid.dataset.tuesdayStart = "1";

    // blank days
    const leading = firstCol === -1 ? 0 : firstCol;
    for (let i = 0; i < leading; i++) {
      const blank = document.createElement('div');
      blank.className = 'calendar-day empty';
      calendarGrid.appendChild(blank);
    }

    // render remaining days
    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(currentYear, currentMonth, day);
      const jsDay = thisDate.getDay();
      if (jsDay === 1) continue; // skip monday

      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      cell.textContent = day;

      const isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (isPast) {
        cell.classList.add('past-day');
      }

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
      empty.textContent = 'No boarding bookings for this day.';
      bookingsList.appendChild(empty);
    }

    else {
      dayBookings.forEach((b, idx) => {
        const isBlocked = b.blocked === true;

        const entry = document.createElement('div');
        entry.className = isBlocked ? 'booking-entry blocked-entry' : 'booking-entry';

        const info = document.createElement('div');
        info.className = 'booking-entry-info';

        const timeName = document.createElement('span');
        timeName.className = 'booking-time-name';
        timeName.textContent = isBlocked
          ? `Blocked`
          : `${b.name}`;

        info.appendChild(timeName);

        if (!isBlocked) {
          const petInfo = document.createElement('ul');
          petInfo.className = 'booking-pet-preview';
          petInfo.style.margin = '0';
          const li = document.createElement('li');
          li.className = 'booking-pet-info';
          li.innerHTML = b.petSelection === 'cat'
            ? `<strong>${b.petName}</strong>, ${b.petSelection}`
            : `<strong>${b.petName}</strong>, ${b.petSelection}, ${b.petBreed || ''}`;
          petInfo.appendChild(li);
          info.appendChild(petInfo);

          const details = document.createElement('div');
          details.className = 'booking-details';
          details.innerHTML = `
            <div><b>Check-in:</b> ${b.startDate} at ${formatTime(b.startTime)}</div>
            <div><b>Check-out:</b> ${b.endDate} at ${formatTime(b.endTime)}</div>
            <div class="booking-details-divider"></div>
            <div><b>Email:</b> ${b.email}</div>
            <div><b>Phone No.:</b> ${b.phone}</div>
            <div><b>Pet Weight:</b> ${b.petWeight}</div>
            <div class="booking-details-divider"></div>
            <div><b>Notes:</b> ${b.notes || "none"}</div>
          `;
          info.appendChild(details);

          entry.addEventListener('click', () => {
            entry.classList.toggle('expanded');
          });
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = "<i class='bx bx-trash'></i>";
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          bookings[key].splice(idx, 1);

          if (isBlocked) {
            await fetch("/api/admin/boarding-slots/unblock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date: key }),
            });
            renderCalendar();
            renderDayPanel();
          } else {
            await fetch("/api/admin/boarding-slots/deleteBooking", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookingId: b._id }),
            });
            // a boarding booking spans multiple days, so refetch the whole month to keep every affected day's cache in sync
            fetchMonthBookings(currentYear, currentMonth);
          }
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



  // blocking a day
  function closeBlockBox() {
    blockTimeBox.classList.remove('open');
    const key = dateKey(selectedDate);
    const isBlocked = bookings[key] && bookings[key].some(b => b.blocked);
    blockTimeBox.textContent = isBlocked ? 'Day Blocked (click to unblock)' : 'Block this day';
    blockTimeBox.classList.toggle('day-blocked', isBlocked);
    blockTimeBox.addEventListener('click', isBlocked ? unblockDay : openBlockBox, { once: true });
  }

  function openBlockBox() {
    blockTimeBox.classList.add('open');
    blockTimeBox.innerHTML = `
      <div class="block-actions-row">
        <button class="block-btn block-cancel-btn" id="cancelBlockBtn">Cancel</button>
        <button class="block-btn block-add-btn" id="addBlockBtn">Block This Day</button>
      </div>
    `;

    document.getElementById('cancelBlockBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeBlockBox();
    });

    document.getElementById('addBlockBtn').addEventListener('click', async () => {
      const date = dateKey(selectedDate);

      const result = await fetch('/api/admin/boarding-slots/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      }).then(r => r.json());

      if (!result.success) {
        alert('Failed to block this day.');
      }

      // refetch this date's slot to keep the cache in sync
      const slotRes = await fetch(`/api/admin/boarding-slots/${date}`);
      const slotData = await slotRes.json();
      bookings[date] = [];
      if (slotData.success) parseSlotIntoBookings(date, slotData.slot);

      renderCalendar();
      renderDayPanel();
    });
  }

  async function unblockDay() {
    const date = dateKey(selectedDate);

    await fetch('/api/admin/boarding-slots/unblock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });

    const slotRes = await fetch(`/api/admin/boarding-slots/${date}`);
    const slotData = await slotRes.json();
    bookings[date] = [];
    if (slotData.success) parseSlotIntoBookings(date, slotData.slot);

    renderCalendar();
    renderDayPanel();
  }

  document.getElementById('boardingPrevMonthBtn').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    fetchMonthBookings(currentYear, currentMonth);
  });

  document.getElementById('boardingNextMonthBtn').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    fetchMonthBookings(currentYear, currentMonth);
  });

  fetchMonthBookings(currentYear, currentMonth);
})();