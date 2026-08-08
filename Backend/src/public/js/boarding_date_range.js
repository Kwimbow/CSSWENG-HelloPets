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

  const state = {
    startDate: null,
    startTime: null,
    endDate: null,
    endTime: null,
    startCalViewYear: today.getFullYear(),
    startCalViewMonth: today.getMonth(),
    endCalViewYear: today.getFullYear(),
    endCalViewMonth: today.getMonth(),
  };

  function clearRangeErrors() {
    const startError = document.getElementById("start-appointment-error");
    const endError = document.getElementById("end-appointment-error");
    if (startError) startError.style.display = "none";
    if (endError) endError.style.display = "none";
    if (endError) endError.textContent = "Please select a boarding end date and time.";
  }

  function updateSummary(kind) {
    const el = document.getElementById(`${kind}-selected-appointment-display`);
    if (!el) return;

    const selectedDate = kind === "start" ? state.startDate : state.endDate;
    const selectedTime = kind === "start" ? state.startTime : state.endTime;
    const label = kind === "start" ? "Start" : "End";

    if (selectedDate && selectedTime) {
      el.textContent = `${label}: ${formatDateLabel(selectedDate)} at ${formatTimeLabel(selectedTime)}`;
    } else if (selectedDate) {
      el.textContent = `${label}: ${formatDateLabel(selectedDate)}`;
    } else {
      el.textContent = "";
    }
  }

  async function renderTimeSlots(kind) {
    const grid = document.getElementById(`${kind}-time-slots-grid`);
    if (!grid) return;

    const selectedDate = kind === "start" ? state.startDate : state.endDate;
    const selectedTime = kind === "start" ? state.startTime : state.endTime;

    grid.innerHTML = "";

    if (!selectedDate) {
      const hint = document.createElement("div");
      hint.textContent = "Pick a date first";
      hint.style.cssText = "font-size:0.85rem;color:#9a9a9a;";
      grid.appendChild(hint);
      updateSummary(kind);
      return;
    }

    let slotData = [];
    try {
      const res = await fetch(`/api/slots/${selectedDate}`);
      const data = await res.json();
      slotData = data.slots || [];
    } catch (error) {
      const hint = document.createElement("div");
      hint.textContent = "Unable to load time slots.";
      hint.style.cssText = "font-size:0.85rem;color:#9a9a9a;";
      grid.appendChild(hint);
      updateSummary(kind);
      return;
    }

    if (selectedDate === getTodayDateStr() && selectedTime && selectedTime <= getCurrentTimeStr()) {
      if (kind === "start") {
        state.startTime = null;
      } else {
        state.endTime = null;
      }
      selectedTime = null;
    }

    for (const slot of timeSlots) {
      const matching = slotData.find((entry) => entry.time === slot);
      const isUnavailable = matching && matching.status !== "open";
      const isPastTime = selectedDate === getTodayDateStr() && slot <= getCurrentTimeStr();
      const isEndSameDayBeforeStart = kind === "end" && selectedDate === state.startDate && state.startTime && slot <= state.startTime;
      let isBeforeMinimumStay = false;

      if (kind === "end" && state.startDate && state.startTime && selectedDate) {
        const minimumEndDateTime = getMinimumEndDateTime(state.startDate, state.startTime);
        isBeforeMinimumStay = minimumEndDateTime && new Date(`${selectedDate}T${slot}:00`) < minimumEndDateTime;
      }

      const isDisabled = isUnavailable || isPastTime || isEndSameDayBeforeStart || isBeforeMinimumStay;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = formatTimeLabel(slot);
      btn.className = "time-slot-btn" + (selectedTime === slot ? " selected" : "");
      btn.disabled = isDisabled;

      if (!isDisabled) {
        btn.addEventListener("click", function () {
          if (kind === "start") {
            state.startTime = slot;
            if (state.endDate === state.startDate && state.endTime && state.endTime <= slot) {
              state.endTime = null;
            }
            if (state.endDate && state.endTime) {
              const minimumEndDateTime = getMinimumEndDateTime(state.startDate, slot);
              const currentEndDateTime = new Date(`${state.endDate}T${state.endTime}:00`);
              if (currentEndDateTime < minimumEndDateTime) {
                state.endTime = null;
              }
            }
          } else {
            state.endTime = slot;
          }
          renderTimeSlots("start");
          renderTimeSlots("end");
          updateSummary("start");
          updateSummary("end");
        });
      }

      grid.appendChild(btn);
    }

    updateSummary(kind);
  }

  function renderCalendar(kind) {
    const labelEl = document.getElementById(`${kind}-cal-month-label`);
    const prevBtn = document.getElementById(`${kind}-cal-prev`);
    const nextBtn = document.getElementById(`${kind}-cal-next`);
    const gridEl = document.getElementById(`${kind}-cal-days-grid`);

    if (!labelEl || !prevBtn || !nextBtn || !gridEl) return;

    const viewYear = kind === "start" ? state.startCalViewYear : state.endCalViewYear;
    const viewMonth = kind === "start" ? state.startCalViewMonth : state.endCalViewMonth;

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
      const isStartDate = kind === "start" && state.startDate === dateStr;
      const isEndDate = kind === "end" && state.endDate === dateStr;
      const allSlotsPassedToday = dateStr === getTodayDateStr() && getCurrentTimeStr() >= timeSlots[timeSlots.length - 1];

      let isDisabled = isPast || isMonday || allSlotsPassedToday;

      if (kind === "end" && state.startDate) {
        const startDateValue = new Date(`${state.startDate}T00:00:00`);
        if (dateObj <= startDateValue) {
          isDisabled = true;
        }
      }

      const cell = document.createElement("div");
      cell.className = "cal-day-cell";

      if (isDisabled) {
        const dayEl = document.createElement("span");
        dayEl.className = "cal-day-disabled";
        dayEl.textContent = String(day);
        cell.appendChild(dayEl);
      } else {
        const dayEl = document.createElement("button");
        dayEl.type = "button";
        dayEl.className = "cal-day" + ((kind === "start" ? isStartDate : isEndDate) ? " selected" : "");
        dayEl.textContent = String(day);
        dayEl.addEventListener("click", function () {
          if (kind === "start") {
            state.startDate = dateStr;
            state.startTime = null;
            if (state.endDate && state.endDate <= state.startDate) {
              state.endDate = null;
              state.endTime = null;
            }
          } else {
            state.endDate = dateStr;
            state.endTime = null;
          }

          renderCalendar("start");
          renderCalendar("end");
          renderTimeSlots("start");
          renderTimeSlots("end");
          updateSummary("start");
          updateSummary("end");
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
    state.startCalViewYear = today.getFullYear();
    state.startCalViewMonth = today.getMonth();
    state.endCalViewYear = today.getFullYear();
    state.endCalViewMonth = today.getMonth();

    clearRangeErrors();
    renderCalendar("start");
    renderCalendar("end");
    renderTimeSlots("start");
    renderTimeSlots("end");
    updateSummary("start");
    updateSummary("end");
  }

  function bindCalendarNavigation(kind) {
    const prevBtn = document.getElementById(`${kind}-cal-prev`);
    const nextBtn = document.getElementById(`${kind}-cal-next`);

    if (!prevBtn || !nextBtn) return;

    prevBtn.addEventListener("click", function () {
      const target = kind === "start" ? state.startCalViewMonth : state.endCalViewMonth;
      const year = kind === "start" ? state.startCalViewYear : state.endCalViewYear;
      let newMonth = target - 1;
      let newYear = year;

      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }

      if (kind === "start") {
        state.startCalViewMonth = newMonth;
        state.startCalViewYear = newYear;
      } else {
        state.endCalViewMonth = newMonth;
        state.endCalViewYear = newYear;
      }
      renderCalendar(kind);
    });

    nextBtn.addEventListener("click", function () {
      const target = kind === "start" ? state.startCalViewMonth : state.endCalViewMonth;
      const year = kind === "start" ? state.startCalViewYear : state.endCalViewYear;
      let newMonth = target + 1;
      let newYear = year;

      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }

      if (kind === "start") {
        state.startCalViewMonth = newMonth;
        state.startCalViewYear = newYear;
      } else {
        state.endCalViewMonth = newMonth;
        state.endCalViewYear = newYear;
      }
      renderCalendar(kind);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindCalendarNavigation("start");
    bindCalendarNavigation("end");
    resetBoardingDateRange();
  });

  window.boardingDateRange = state;
  window.resetBoardingDateRange = resetBoardingDateRange;
})();
