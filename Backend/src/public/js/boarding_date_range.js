(function () {
  const timeSlots = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  function getCurrentTimeStr() {
    return new Date().toTimeString().slice(0, 5);
  }

  function getTodayDateStr() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return formatDateStr(now);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function formatDateStr(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatTimeLabel(timeStr) {
    const [hourStr, minuteStr] = timeStr.split(":");
    const hour = parseInt(hourStr, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minuteStr} ${period}`;
  }

  function formatDateLabel(dateStr) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function getMinimumEndDateTime(startDate, startTime) {
    if (!startDate || !startTime) return null;
    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    return new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000);
  }

  // single calendar drives both the start and end date via range-select
  // (click a start day, then click a later day to complete the range), and a
  // single time panel below it walks through check-in time -> check-out date
  // -> check-out time, one step at a time, instead of two side-by-side lists
  const state = {
    startDate: null,
    startTime: null,
    endDate: null,
    endTime: null,
    calViewYear: today.getFullYear(),
    calViewMonth: today.getMonth(),
  };

  function clearRangeErrors() {
    const startError = document.getElementById("start-appointment-error");
    const endError = document.getElementById("end-appointment-error");
    if (startError) startError.style.display = "none";
    if (endError) endError.style.display = "none";
    if (endError) endError.textContent = "Please select a boarding end date and time.";
  }

  function appendHint(container, text) {
    const hint = document.createElement("div");
    hint.textContent = text;
    hint.style.cssText = "font-size:0.85rem;color:#9a9a9a;";
    container.appendChild(hint);
  }

  function appendSummaryLine(container, label, dateStr, timeStr) {
    const line = document.createElement("div");
    line.textContent = timeStr
      ? `${label}: ${formatDateLabel(dateStr)} at ${formatTimeLabel(timeStr)}`
      : `${label}: ${formatDateLabel(dateStr)}`;
    container.appendChild(line);
  }

  // builds the time-of-day buttons for either "start" or "end" into the given
  // container, wired up to set state.startTime/state.endTime on click
  async function renderTimeButtons(container, kind) {
    const selectedDate = kind === "start" ? state.startDate : state.endDate;
    const selectedTime = kind === "start" ? state.startTime : state.endTime;

    // day-level boarding capacity (not per-hour like grooming's slots) - a
    // single object for the whole day, or null for days with no slot at all
    // (e.g. mondays)
    let daySlot = null;
    try {
      const res = await fetch(`/api/boarding-slots/${selectedDate}`);
      const data = await res.json();
      daySlot = data.slot;
    } catch (error) {
      appendHint(container, "Unable to load availability.");
      return;
    }

    // dogs and cats share the same 10-per-day pool, and pet type isn't known
    // yet at this step (it's picked after the calendar), so a day is only
    // unavailable if it's manually blocked or has no spots left at all
    const isDayUnavailable = !daySlot || daySlot.blocked || daySlot.spotsLeft <= 0;

    for (const slot of timeSlots) {
      const isPastTime = selectedDate === getTodayDateStr() && slot <= getCurrentTimeStr();
      const isEndSameDayBeforeStart = kind === "end" && selectedDate === state.startDate && state.startTime && slot <= state.startTime;
      let isBeforeMinimumStay = false;

      if (kind === "end" && state.startDate && state.startTime) {
        const minimumEndDateTime = getMinimumEndDateTime(state.startDate, state.startTime);
        isBeforeMinimumStay = minimumEndDateTime && new Date(`${selectedDate}T${slot}:00`) < minimumEndDateTime;
      }

      const isDisabled = isDayUnavailable || isPastTime || isEndSameDayBeforeStart || isBeforeMinimumStay;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = formatTimeLabel(slot);
      btn.className = "time-slot-btn" + (selectedTime === slot ? " selected" : "");
      btn.disabled = isDisabled;

      if (!isDisabled) {
        btn.addEventListener("click", function () {
          if (kind === "start") {
            state.startTime = slot;
          } else {
            state.endTime = slot;
          }
          renderTimePanel();
        });
      }

      container.appendChild(btn);
    }
  }

  // the single time panel walks through: pick a start date -> pick a
  // check-in time -> pick an end date (on the calendar) -> pick a check-out
  // time -> done. it shows whichever step is next, plus a running summary of
  // whatever's already been chosen.
  async function renderTimePanel() {
    const labelEl = document.getElementById("range-time-panel-label");
    const grid = document.getElementById("range-time-slots-grid");
    const summaryEl = document.getElementById("range-selected-summary");

    if (!labelEl || !grid || !summaryEl) return;

    grid.innerHTML = "";
    summaryEl.innerHTML = "";

    if (!state.startDate) {
      labelEl.textContent = "Check-in time";
      appendHint(grid, "Pick a start date on the calendar");
      return;
    }

    if (!state.startTime) {
      labelEl.textContent = "Check-in time";
      await renderTimeButtons(grid, "start");
      return;
    }

    if (!state.endDate) {
      labelEl.textContent = "Check-out date";
      appendHint(grid, "Now pick a check-out date on the calendar");
      appendSummaryLine(summaryEl, "Check-in", state.startDate, state.startTime);
      return;
    }

    if (!state.endTime) {
      labelEl.textContent = "Check-out time";
      await renderTimeButtons(grid, "end");
      appendSummaryLine(summaryEl, "Check-in", state.startDate, state.startTime);
      return;
    }

    labelEl.textContent = "Your stay";
    appendSummaryLine(summaryEl, "Check-in", state.startDate, state.startTime);
    appendSummaryLine(summaryEl, "Check-out", state.endDate, state.endTime);
  }

  // handles a click on a calendar day: first click sets the start date, a later
  // click completes the range as the end date. Clicking on/before the current
  // start (or clicking again once a full range is already selected) restarts
  // the selection with the clicked day as the new start.
  function handleDayClick(dateStr, dateObj) {
    const hasFullRange = state.startDate && state.endDate;
    const startDateObj = state.startDate ? new Date(`${state.startDate}T00:00:00`) : null;
    const clickedBeforeOrEqualStart = startDateObj && dateObj <= startDateObj;

    if (!state.startDate || hasFullRange || clickedBeforeOrEqualStart) {
      state.startDate = dateStr;
      state.startTime = null;
      state.endDate = null;
      state.endTime = null;
    } else {
      state.endDate = dateStr;
      state.endTime = null;
    }

    renderCalendar();
    renderTimePanel();
  }

  function renderCalendar() {
    const labelEl = document.getElementById("range-cal-month-label");
    const prevBtn = document.getElementById("range-cal-prev");
    const nextBtn = document.getElementById("range-cal-next");
    const gridEl = document.getElementById("range-cal-days-grid");

    if (!labelEl || !prevBtn || !nextBtn || !gridEl) return;

    const viewYear = state.calViewYear;
    const viewMonth = state.calViewMonth;

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    labelEl.textContent = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    gridEl.innerHTML = "";

    for (let i = 0; i < leadingBlanks; i++) {
      const blank = document.createElement("div");
      blank.className = "cal-day-cell";
      gridEl.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(viewYear, viewMonth, day);
      const dateStr = formatDateStr(dateObj);
      const isPast = dateObj < today;
      const isMonday = dateObj.getDay() === 1;
      const allSlotsPassedToday = dateStr === getTodayDateStr() && getCurrentTimeStr() >= timeSlots[timeSlots.length - 1];

      const isDisabled = isPast || isMonday || allSlotsPassedToday;

      const cell = document.createElement("div");
      cell.className = "cal-day-cell";

      if (isDisabled) {
        const dayEl = document.createElement("span");
        dayEl.className = "cal-day-disabled";
        dayEl.textContent = String(day);
        cell.appendChild(dayEl);
      } else {
        const isStart = state.startDate === dateStr;
        const isEnd = state.endDate === dateStr;
        const isInRange = state.startDate && state.endDate && dateStr > state.startDate && dateStr < state.endDate;

        let className = "cal-day";
        if (isStart) className += " range-start";
        if (isEnd) className += " range-end";
        if (isInRange) className += " in-range";

        const dayEl = document.createElement("button");
        dayEl.type = "button";
        dayEl.className = className;
        dayEl.textContent = String(day);
        dayEl.addEventListener("click", function () {
          handleDayClick(dateStr, dateObj);
        });
        cell.appendChild(dayEl);
      }

      gridEl.appendChild(cell);
    }

    prevBtn.disabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  }

  function resetBoardingDateRange() {
    state.startDate = null;
    state.startTime = null;
    state.endDate = null;
    state.endTime = null;
    state.calViewYear = today.getFullYear();
    state.calViewMonth = today.getMonth();

    clearRangeErrors();
    renderCalendar();
    renderTimePanel();
  }

  function bindCalendarNavigation() {
    const prevBtn = document.getElementById("range-cal-prev");
    const nextBtn = document.getElementById("range-cal-next");

    if (!prevBtn || !nextBtn) return;

    prevBtn.addEventListener("click", function () {
      let newMonth = state.calViewMonth - 1;
      let newYear = state.calViewYear;

      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }

      state.calViewMonth = newMonth;
      state.calViewYear = newYear;
      renderCalendar();
    });

    nextBtn.addEventListener("click", function () {
      let newMonth = state.calViewMonth + 1;
      let newYear = state.calViewYear;

      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }

      state.calViewMonth = newMonth;
      state.calViewYear = newYear;
      renderCalendar();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindCalendarNavigation();
    resetBoardingDateRange();
  });

  window.boardingDateRange = state;
  window.resetBoardingDateRange = resetBoardingDateRange;
})();