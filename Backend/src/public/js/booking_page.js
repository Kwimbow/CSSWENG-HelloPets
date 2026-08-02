// rads --> group of radio buttons
// chks --> group of checkboxes
radsPetSelection = document.getElementsByName("pet-selection"); // dog or cat

// STEP 3 PET INFO (Dogs)
inpPetName = document.getElementById("pet-name");
inpPetWeight = document.getElementById("pet-weight");
inpPetBreed = document.getElementById("pet-breed");

// STEPm 3 PET INFO (cats)
inpPetNameCat = document.getElementById("pet-name-cat");
inpPetWeightCat = document.getElementById("pet-weight-cat");

// STEP 4 SELECTED SERVICE (Dog layout 5 options, cat 2)
radsSelectedService = document.getElementsByName("pet-service");
radsSelectedServiceCat = document.getElementsByName("pet-service-cat");

// STEP 5-6
// checkboxes for add-ons (dematting, deshedding)
chksAddOn = document.querySelectorAll(".addon-list input");
// checkboxes for a la carte services
chksALaCarte = document.querySelectorAll(".alac-list input");

// STEP 7 CUSTOMER INFO
inpFirstName = document.getElementById("first-name");
inpLastName = document.getElementById("last-name");
inpEmail = document.getElementById("email");
inpMobileNumber = document.getElementById("mobile");
inpNotes = document.getElementById("optional-notes");

btnConfirmBooking = document.getElementById("confirm-booking"); // actually a span

// Below is for dog and cat field selection, the rest of the steps are hidden until a pet type is selected
// steps 3 & 4 swap between the dog layout and the cat layout
sectionPostPetType = document.getElementById("post-pet-type");
elsDogOnly = document.querySelectorAll(".dog-only");
elsCatOnly = document.querySelectorAll(".cat-only");
// only the fields belonging to the active pet type should ever be required,
// otherwise the hidden set for the *other* pet type blocks submission
inpsDogRequired = [inpPetName, inpPetWeight, inpPetBreed];
inpsCatRequired = [inpPetNameCat, inpPetWeightCat];

allInputs = document.querySelectorAll("input");
allTextInputs = document.querySelectorAll("input[type='text'], input[type='email']");
allCheckboxInputs = document.querySelectorAll("input[type='checkbox']");

// accepts a collection of radio buttons and returns the value of the selected one
const getRadioButtonsValue = function(radButtons) {
	for (const btn of radButtons) {
		if (btn.checked) {
			return btn.value;
		}
	}
	return null;
}

// accepts a collection of checkboxes and returns an array containing the ones checked
const getCheckboxesValue = function(chkButtons) {
	checkedArr = []
	for (const btn of chkButtons) {
		if (btn.checked) {
			checkedArr.push(btn.name);
		}
	}
	return checkedArr;
}

// verifies form elements (like required inputs, as well as email formatting)
// returns true if form inputs are valid
const verifyForm = function() {
	if (!selectedDate || !selectedTime) {
		appointmentError.style.display = "";
		return false;
	}
	appointmentError.style.display = "none";

	for (const btn of allInputs) {
		// informs the user of the first invalid form input
		isValid = btn.reportValidity();
		if (!isValid) {
			return false;
		}
	}
	return true;
}

// accepts a group of radio buttons and a value
// and checks the one with that value
const checkRadioButton = function(radButtons, value) {
	for (const btn of radButtons) {
		if (btn.value === value) {
			btn.checked = true;
			return;
		}
	}
}

// shows/hides steps 3-7 based on whether a pet type has been picked yet,
// and swaps steps 3 & 4 between the dog layout and the cat layout
const updatePetTypeSections = function() {
	selectedPetType = getRadioButtonsValue(radsPetSelection);

	if (!selectedPetType) {
		// nothing picked yet
		sectionPostPetType.classList.remove("visible");
		for (const inp of inpsDogRequired) { inp.required = false; }
		for (const inp of inpsCatRequired) { inp.required = false; }
		return;
	}

	// somethign is selected
	sectionPostPetType.classList.add("visible");

	isDogSelected = selectedPetType === "dog";

	for (const el of elsDogOnly) {
		el.style.display = isDogSelected ? "" : "none";
	}
	for (const el of elsCatOnly) {
		el.style.display = isDogSelected ? "none" : "";
	}

	// only the active pet type's fields should be required
	for (const inp of inpsDogRequired) { inp.required = isDogSelected; }
	for (const inp of inpsCatRequired) { inp.required = !isDogSelected; }
}

for (const rad of radsPetSelection) {
	rad.addEventListener("change", updatePetTypeSections);
}

// run once on load in
// case the browser restored a previous selection via back/forward cache
updatePetTypeSections();

// clearing/resetting the form after submitting
const clearForm = function() {
	for (const btn of allTextInputs) {
		btn.value = "";
	}

	for (const btn of allCheckboxInputs) {
		btn.checked = false;
	}

	// uncheck pet type entirely so the form goes back to its initial
	// state (only steps 1 & 2 visible) instead of defaulting to dog
	for (const rad of radsPetSelection) {
		rad.checked = false;
	}
	updatePetTypeSections();

	// checking the default option for radio buttons
	checkRadioButton(radsPetSelection, "dog")
	checkRadioButton(radsSelectedService, "essential-bath");
	resetCalendarSelection();
}

function goBackHome(){
	window.location.replace("/")
}


const buildBookingObj = function() {
	petSelection = getRadioButtonsValue(radsPetSelection);
    
    isDogSelected = petSelection === "dog";

    return {
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        petSelection: petSelection,
        petName: isDogSelected ? inpPetName.value : inpPetNameCat.value,
        petWeight: isDogSelected ? inpPetWeight.value : inpPetWeightCat.value,
        petBreed: isDogSelected ? inpPetBreed.value : null,
        selectedService: isDogSelected
        ? getRadioButtonsValue(radsSelectedService)
        : getRadioButtonsValue(radsSelectedServiceCat),
        addOnServices: getCheckboxesValue(chksAddOn),
        aLaCarteServices: getCheckboxesValue(chksALaCarte),
        customer: {
        firstName: inpFirstName.value,
        lastName: inpLastName.value,
        email: inpEmail.value,
        mobileNumber: inpMobileNumber.value,
        },
        optionalNotes: inpNotes.value,
        createdAt: new Date().toISOString(),
      };
}


const submitForm = async function() {
	isValid = verifyForm();
	if (!isValid) {
		return;
	}

	payloadObj = buildBookingObj();

	const response = await fetch("/submit-booking", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payloadObj)
	});

	const responseObj = await response.json();
	const success = responseObj.success;

	if (success) {
		alert("Form successfully submitted.");
		clearForm();
		goBackHome();
	} else {
		alert("There was an error submitting the form.");
	}
}

btnConfirmBooking.addEventListener("click", submitForm);


// STEP 1 CALENDAR / TIME SLOT PICKER
const manuallyUnavailableDates = new Set();
const manuallyUnavailableSlots = {};

const timeSlots = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const calMonthLabel = document.getElementById("cal-month-label");
const calPrevBtn = document.getElementById("cal-prev");
const calNextBtn = document.getElementById("cal-next");
const calDaysGrid = document.getElementById("cal-days-grid");
const timeSlotsGrid = document.getElementById("time-slots-grid");
const selectedAppointmentDisplay = document.getElementById("selected-appointment-display");
const appointmentError = document.getElementById("appointment-error");

const today = new Date();
today.setHours(0, 0, 0, 0);

let calViewYear = today.getFullYear();
let calViewMonth = today.getMonth(); // 0-indexed
let selectedDate = null; // "YYYY-MM-DD"
let selectedTime = null; // "HH:MM"

// formats a Date object as a local "YYYY-MM-DD" string (avoids UTC shift issues)
const formatDateStr = function(dateObj) {
	year = dateObj.getFullYear();
	month = String(dateObj.getMonth() + 1).padStart(2, "0");
	day = String(dateObj.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

// formats "HH:MM" (24hr) into a human readable 12hr label, e.g. "14:00" -> "2:00 PM"
const formatTimeLabel = function(timeStr) {
	const [hourStr, minuteStr] = timeStr.split(":");
	hour = parseInt(hourStr, 10);
	period = hour >= 12 ? "PM" : "AM";
	hour12 = hour % 12 === 0 ? 12 : hour % 12;
	return `${hour12}:${minuteStr} ${period}`;
}

// formats "YYYY-MM-DD" into a human readable label, e.g. "July 20, 2026"
const formatDateLabel = function(dateStr) {
	const [year, month, day] = dateStr.split("-").map(Number);
	dateObj = new Date(year, month - 1, day);
	return dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const updateSelectedAppointmentDisplay = function() {
	if (selectedDate && selectedTime) {
		selectedAppointmentDisplay.textContent = `Selected: ${formatDateLabel(selectedDate)} at ${formatTimeLabel(selectedTime)}`;
	} else if (selectedDate) {
		selectedAppointmentDisplay.textContent = `Selected: ${formatDateLabel(selectedDate)}`;
	} else {
		selectedAppointmentDisplay.textContent = "";
	}
}

// renders the 10am-5pm time slot buttons for whatever date is currently selected
// now fetches the time slots from the backend API
async function renderTimeSlots() {
	timeSlotsGrid.innerHTML = "";

	if (!selectedDate) {
		hint = document.createElement("div");
		hint.textContent = "Pick a date first";
		hint.style.cssText = "font-size:0.85rem;color:#9a9a9a;";
		timeSlotsGrid.appendChild(hint);
		return;
	}

    const res = await fetch(`/api/slots/${selectedDate}`);
    const data = await res.json();
    slotData = data.slots;

	for (const slot of timeSlots) {

        const matching = slotData.find((s) => s.time === slot);
		const isUnavailable = matching && matching.status !== "open";

		btn = document.createElement("button");
		btn.type = "button";
		btn.textContent = formatTimeLabel(slot);

		if (isUnavailable) {
			btn.className = "time-slot-btn";
			btn.disabled = true;
		} else {
			btn.className = "time-slot-btn" + (selectedTime === slot ? " selected" : "");
			btn.addEventListener("click", function() {
				selectedTime = slot;
				renderTimeSlots();
				updateSelectedAppointmentDisplay();
			});
		}

		timeSlotsGrid.appendChild(btn);
	}
}

// renders the day grid for calViewYear/calViewMonth
const renderCalendar = function() {
	firstOfMonth = new Date(calViewYear, calViewMonth, 1);
	calMonthLabel.textContent = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

	// grid starts on Monday, so figure out how many blank cells precede day 1
	// (JS getDay(): Sun=0..Sat=6, shift so Mon=0..Sun=6)
	leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
	daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();

	calDaysGrid.innerHTML = "";

	for (let i = 0; i < leadingBlanks; i++) {
		blank = document.createElement("div");
		blank.className = "cal-day-cell";
		calDaysGrid.appendChild(blank);
	}

	for (let day = 1; day <= daysInMonth; day++) {
		let dateObj = new Date(calViewYear, calViewMonth, day);
		let dateStr = formatDateStr(dateObj);
		let isMonday = dateObj.getDay() === 1;
		let isPast = dateObj < today;
		let isManuallyBlocked = manuallyUnavailableDates.has(dateStr);

		let cell = document.createElement("div");
		cell.className = "cal-day-cell";

		let dayEl;
		if (isMonday || isPast || isManuallyBlocked) {
			dayEl = document.createElement("span");
			dayEl.className = "cal-day-disabled";
			dayEl.textContent = day;
		} else {
			dayEl = document.createElement("button");
			dayEl.type = "button";
			dayEl.className = "cal-day" + (selectedDate === dateStr ? " selected" : "");
			dayEl.textContent = day;
			dayEl.addEventListener("click", function() {
				selectedDate = dateStr;
				selectedTime = null;
				renderCalendar();
				renderTimeSlots();
				updateSelectedAppointmentDisplay();
			});
		}

		cell.appendChild(dayEl);
		calDaysGrid.appendChild(cell);
	}

	// don't allow navigating to months before the current one
	calPrevBtn.disabled = (calViewYear === today.getFullYear() && calViewMonth === today.getMonth());
}

calPrevBtn.addEventListener("click", function() {
	calViewMonth -= 1;
	if (calViewMonth < 0) {
		calViewMonth = 11;
		calViewYear -= 1;
	}
	renderCalendar();
});

calNextBtn.addEventListener("click", function() {
	calViewMonth += 1;
	if (calViewMonth > 11) {
		calViewMonth = 0;
		calViewYear += 1;
	}
	renderCalendar();
});

renderCalendar();
renderTimeSlots();

// resets the calendar/time selection back to nothing and jumps back to the current month
const resetCalendarSelection = function() {
	selectedDate = null;
	selectedTime = null;
	calViewYear = today.getFullYear();
	calViewMonth = today.getMonth();
	appointmentError.style.display = "none";
	renderCalendar();
	renderTimeSlots();
	updateSelectedAppointmentDisplay();
}