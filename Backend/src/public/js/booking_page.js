// rads --> group of radio buttons
// chks --> group of checkboxes
radsPetSelection = document.getElementsByName("pet-selection"); // dog or cat

// STEP 3 PET INFO (Dogs)
inpPetName = document.getElementById("pet-name");
inpPetWeight = document.getElementById("pet-weight");
inpPetBreed = document.getElementById("pet-breed");

// weight (kg) cutoffs used to estimate pet size, which in turn affects pricing
petSizeTiers = [
	{ minWeight: 0, maxWeight: 7, letter: "S", label: "Small" },
	{ minWeight: 7, maxWeight: 15, letter: "M", label: "Medium" },
	{ minWeight: 15, maxWeight: 25, letter: "L", label: "Large" },
	{ minWeight: 25, maxWeight: 35, letter: "XL", label: "Extra Large" },
	{ minWeight: 35, maxWeight: Infinity, letter: "XXL", label: "Extra Extra Large" },
];

petSizeBanner = document.getElementById("pet-size-banner");
petSizeValue = document.getElementById("pet-size-value");

// STEPm 3 PET INFO (cats)
inpPetNameCat = document.getElementById("pet-name-cat");
inpPetWeightCat = document.getElementById("pet-weight-cat");

// STEP 4 SELECTED SERVICE (Dog layout 5 options, cat 2)
radsSelectedService = document.getElementsByName("pet-service");
radsSelectedServiceCat = document.getElementsByName("pet-service-cat");
serviceDescriptionText = document.getElementById("service-description-text");
priceCellEls = {
	S: document.getElementById("price-s"),
	M: document.getElementById("price-m"),
	L: document.getElementById("price-l"),
	XL: document.getElementById("price-xl"),
	XXL: document.getElementById("price-xxl"),
};

// pricing/description for dog services
// pricing/description for dog services
dogServiceData = {
	"essential-bath": {
		label: "Essential Bath",
		description: "Classic shampoo & conditioner, blow-dry",
		prices: { S: 250, M: 350, L: 450, XL: 600, XXL: 800 },
	},
	"premium-bath": {
		label: "Premium Bath",
		description: "Show-grade shampoo & conditioner, blow-dry",
		prices: { S: 350, M: 450, L: 550, XL: 700, XXL: 900 },
	},
	"classic-grooming": {
		label: "Classic Grooming",
		description: "Essential bath, nail cut, ear clean, sanitary trim, basic cut (summer cut/ semi-bald/ bald)",
		prices: { S: 550, M: 650, L: 800, XL: 1000, XXL: 1300 },
	},
	"luxe-grooming": {
		label: "Luxe Grooming",
		description: "Premium bath, nail cut, ear clean, sanitary trim, basic cut (summer cut/ semi-bald/ bald)",
		prices: { S: 650, M: 750, L: 1000, XL: 1200, XXL: 1500 },
	},
	"special-cut": {
		label: "Special Cut",
		description: "Get a special cut for your doggy!",
		prices: { S: 150, M: 150, L: 150, XL: 150, XXL: 150 },
	},
};

// pricing/label for cat services
catServiceData = {
	"kitty-grooming": { label: "Kitty Grooming", price: 700 },
	"kitty-special-cut": { label: "Kitty Special Cut", price: 200 },
};

// STEP 5-6
// checkboxes for add-ons (dematting, deshedding)
chksAddOn = document.querySelectorAll(".addon-list > .addon-item > .custom-checkbox input");
// checkboxes for a la carte services
chksALaCarte = document.querySelectorAll(".alac-list input");

// STEP 7 CUSTOMER INFO
inpFirstName = document.getElementById("first-name");
inpLastName = document.getElementById("last-name");
inpEmail = document.getElementById("email");
inpMobileNumber = document.getElementById("mobile");
inpNotes = document.getElementById("optional-notes");

btnConfirmBooking = document.getElementById("confirm-booking"); // actually a span

// summary modal elements
summaryModalOverlay = document.getElementById("summary-modal-overlay");
btnSummaryModalClose = document.getElementById("summary-modal-close");
btnSummaryCancel = document.getElementById("summary-cancel-btn");
btnSummaryConfirm = document.getElementById("summary-confirm-btn");

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

// maps each add-on checkbox's id to its Light/Medium/Heavy severity pill group,
// so the group can be shown/hidden and read alongside that checkbox
addonSeverityGroups = {
	dematting: document.getElementById("dematting-severity"),
	deshedding: document.getElementById("deshedding-severity"),
};

// display labels + pricing for the summary modal
addOnLabels = {
	dematting: "Dematting",
	deshedding: "Deshedding",
};
addOnPricing = {
	light: 200,
	medium: 400,
	heavy: 600,
};
aLaCartePricing = {
	"face-trim": { label: "Face Trim", price: 150 },
	"poodle-feet": { label: "Poodle Feet", price: 150 },
	"nail-trim": { label: "Nail Trim", price: 100 },
	"ear-clean": { label: "Ear Clean", price: 100 },
	"teeth-brushing": { label: "Teeth Brushing", price: 100 },
	"anal-sac-draining": { label: "Anal Sac Draining", price: 150 },
	cologne: { label: "Cologne", price: 50 },
};

// accepts a collection of radio buttons and returns the value of the selected one
const getRadioButtonsValue = function(radButtons) {
	for (const btn of radButtons) {
		if (btn.checked) {
			return btn.value;
		}
	}
	return null;
}

// renders the prices, mostly makes the objects where the prices are gonna be loaded on, just defaults here
const renderStaticPriceDisplays = function() {
	for (const [key, info] of Object.entries(catServiceData)) {
		el = document.getElementById(`cat-price-${key}`);
		if (el) el.textContent = `₱${info.price.toLocaleString()}`;
	}

	for (const [severity, price] of Object.entries(addOnPricing)) {
		el = document.getElementById(`addon-price-${severity}`);
		if (el) el.textContent = `₱${price.toLocaleString()}`;
	}

	for (const [key, info] of Object.entries(aLaCartePricing)) {
		el = document.getElementById(`alac-price-${key}`);
		if (el) el.textContent = `₱${info.price.toLocaleString()}`;
	}
}

renderStaticPriceDisplays();

// actual fetching of the values in the server then overwriting watever was put in the objects abve
const loadPricingOverrides = async function() {
	try {
		const response = await fetch("/api/pricing");
		if (!response.ok) return;

		const { pricing } = await response.json();
		if (!pricing) return;

		for (const [serviceKey, info] of Object.entries(dogServiceData)) {
			for (const size of Object.keys(info.prices)) {
				key = `dog:${serviceKey}:${size}`;
				if (Object.hasOwn(pricing, key)) {
					info.prices[size] = pricing[key];
				}
			}
		}

		for (const [serviceKey, info] of Object.entries(catServiceData)) {
			key = `cat:${serviceKey}`;
			if (Object.hasOwn(pricing, key)) {
				info.price = pricing[key];
			}
		}

		for (const severity of Object.keys(addOnPricing)) {
			key = `addon:${severity}`;
			if (Object.hasOwn(pricing, key)) {
				addOnPricing[severity] = pricing[key];
			}
		}

		for (const [itemKey, info] of Object.entries(aLaCartePricing)) {
			key = `alac:${itemKey}`;
			if (Object.hasOwn(pricing, key)) {
				info.price = pricing[key];
			}
		}

		updateDogServiceDetails();
		renderStaticPriceDisplays();
	} catch (error) {
		console.error("Error: ", error);
	}
}

// returns the size tier for a given weight input, or null if th value is empty 
const getPetSizeFromWeight = function(weightStr) {
	weightNum = parseFloat(weightStr);
	if (isNaN(weightNum) || weightNum <= 0) {
		return null;
	}
	for (const tier of petSizeTiers) {
		if (weightNum >= tier.minWeight && weightNum < tier.maxWeight) {
			return tier;
		}
	}
	return petSizeTiers[petSizeTiers.length - 1];
}

// updates the "Estimated pet size" banner based on the dog weight field
// stays hidden until a valid weight is entered
const updatePetSizeBanner = function() {
	tier = getPetSizeFromWeight(inpPetWeight.value);
	if (!tier) {
		petSizeBanner.style.display = "none";
		return;
	}
	petSizeValue.textContent = `${tier.label} (${tier.letter})`;
	petSizeBanner.style.display = "";
}

inpPetWeight.addEventListener("input", updatePetSizeBanner);
updatePetSizeBanner();

// swaps the description + pricing grid to match whichever dog service radio is selected
const updateDogServiceDetails = function() {
	selectedService = getRadioButtonsValue(radsSelectedService);
	data = dogServiceData[selectedService];

	serviceDescriptionText.textContent = data.description;
	for (const [size, el] of Object.entries(priceCellEls)) {
		el.textContent = `₱${data.prices[size].toLocaleString()}`;
	}
}

for (const rad of radsSelectedService) {
	rad.addEventListener("change", updateDogServiceDetails);
}

updateDogServiceDetails();
loadPricingOverrides();

// hides severity checker if service not picked
const updateAddonSeverityVisibility = function() {
	for (const [addonId, groupEl] of Object.entries(addonSeverityGroups)) {
		checkbox = document.getElementById(addonId);
		groupEl.classList.toggle("visible", checkbox.checked);
	}
}

for (const addonId of Object.keys(addonSeverityGroups)) {
	document.getElementById(addonId).addEventListener("change", updateAddonSeverityVisibility);
}

// run once on load in case the browser restored a previous checked state
updateAddonSeverityVisibility();

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

// like getCheckboxesValue, but for add-ons specifically
// pairs each checked add-on with the severity picked 
const getAddOnServicesValue = function() {
	addOnArr = []
	for (const btn of chksAddOn) {
		if (btn.checked) {
			severityGroup = addonSeverityGroups[btn.id];
			severity = getRadioButtonsValue(severityGroup.querySelectorAll("input[type='radio']"));
			addOnArr.push({ name: btn.name, severity: severity });
		}
	}
	return addOnArr;
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

	// reset each add-on's severity back to "light" and hide the pill group again
	// since its checkbox was just unchecked above
	for (const groupEl of Object.values(addonSeverityGroups)) {
		checkRadioButton(groupEl.querySelectorAll("input[type='radio']"), "light");
	}
	updateAddonSeverityVisibility();


	// checking the default option for radio buttons
	checkRadioButton(radsPetSelection, "dog")
	checkRadioButton(radsSelectedService, "essential-bath");
	updateDogServiceDetails();
	updatePetSizeBanner();
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
        addOnServices: getAddOnServicesValue(),
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
		closeSummaryModal();
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
		closeSummaryModal();
		clearForm();
		goBackHome();
	} else {
		alert("There was an error submitting the form.");
	}
}

const openSummaryModal = function() {
	summaryModalOverlay.classList.add("visible");
}

const closeSummaryModal = function() {
	summaryModalOverlay.classList.remove("visible");
}

// fills in the summary modal from the current form state and totals up the price
const renderBookingSummary = function() {
	petSelection = getRadioButtonsValue(radsPetSelection);
	isDogSelected = petSelection === "dog";

	document.getElementById("summary-customer-name").textContent = `${inpFirstName.value} ${inpLastName.value}`;
	document.getElementById("summary-customer-email").textContent = inpEmail.value;
	document.getElementById("summary-customer-mobile").textContent = inpMobileNumber.value;

	document.getElementById("summary-pet-type").textContent = isDogSelected ? "Dog" : "Cat";
	document.getElementById("summary-pet-name").textContent = isDogSelected ? inpPetName.value : inpPetNameCat.value;

	weightVal = isDogSelected ? inpPetWeight.value : inpPetWeightCat.value;
	document.getElementById("summary-pet-weight").textContent = `${weightVal} kg`;

	breedRow = document.getElementById("summary-pet-breed-row");
	sizeRow = document.getElementById("summary-pet-size-row");

	tier = null;
	if (isDogSelected) {
		breedRow.style.display = "";
		document.getElementById("summary-pet-breed").textContent = inpPetBreed.value;

		tier = getPetSizeFromWeight(inpPetWeight.value);
		sizeRow.style.display = "";
		document.getElementById("summary-pet-size").textContent = tier ? `${tier.label} (${tier.letter})` : "Not yet determined";
	} else {
		breedRow.style.display = "none";
		sizeRow.style.display = "none";
	}

	document.getElementById("summary-appointment").textContent =
		(selectedDate && selectedTime) ? `${formatDateLabel(selectedDate)} at ${formatTimeLabel(selectedTime)}` : "Not selected";

	servicesListEl = document.getElementById("summary-services-list");
	servicesListEl.innerHTML = "";
	totalAmount = 0;

	// appends one line to the services list, and folds its price into the running total
	const addSummaryLine = function(label, amount) {
		row = document.createElement("div");
		row.className = "summary-row";

		nameSpan = document.createElement("span");
		nameSpan.textContent = label;

		priceSpan = document.createElement("span");
		priceSpan.textContent = (amount === null) ? "TBD" : `₱${amount.toLocaleString()}`;

		row.appendChild(nameSpan);
		row.appendChild(priceSpan);
		servicesListEl.appendChild(row);

		if (amount !== null) {
			totalAmount += amount;
		}
	}

	if (isDogSelected) {
		selectedServiceValue = getRadioButtonsValue(radsSelectedService);
		serviceInfo = dogServiceData[selectedServiceValue];
		servicePrice = (serviceInfo && tier) ? serviceInfo.prices[tier.letter] : null;
		addSummaryLine(serviceInfo ? serviceInfo.label : selectedServiceValue, servicePrice);
	} else {
		selectedServiceValueCat = getRadioButtonsValue(radsSelectedServiceCat);
		catInfo = catServiceData[selectedServiceValueCat];
		addSummaryLine(catInfo ? catInfo.label : selectedServiceValueCat, catInfo ? catInfo.price : null);
	}

	addOnValues = getAddOnServicesValue();
	for (const addOn of addOnValues) {
		label = addOnLabels[addOn.name] || addOn.name;
		severityLabel = addOn.severity ? addOn.severity.charAt(0).toUpperCase() + addOn.severity.slice(1) : "";
		price = addOnPricing[addOn.severity];
		addSummaryLine(`${label} (${severityLabel})`, price === undefined ? null : price);
	}

	aLaCarteValues = getCheckboxesValue(chksALaCarte);
	for (const name of aLaCarteValues) {
		info = aLaCartePricing[name];
		addSummaryLine(info ? info.label : name, info ? info.price : null);
	}

	document.getElementById("summary-total-amount").textContent = `₱${totalAmount.toLocaleString()}`;
}

btnConfirmBooking.addEventListener("click", function() {
	isValid = verifyForm();
	if (!isValid) {
		return;
	}
	renderBookingSummary();
	openSummaryModal();
});

btnSummaryModalClose.addEventListener("click", closeSummaryModal);
btnSummaryCancel.addEventListener("click", closeSummaryModal);
btnSummaryConfirm.addEventListener("click", submitForm);


// STEP 1 CALENDAR / TIME SLOT PICKER
const manuallyUnavailableDates = new Set();
const manuallyUnavailableSlots = {};

const timeSlots = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const getCurrentTimeStr = function() {
	return new Date().toTimeString().slice(0, 5);
};

const getTodayDateStr = function() {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return formatDateStr(d);
};

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

	if (selectedDate === getTodayDateStr() && selectedTime && selectedTime <= getCurrentTimeStr()) {
		selectedTime = null;
	}

    const res = await fetch(`/api/slots/${selectedDate}`);
    const data = await res.json();
    slotData = data.slots;

	for (const slot of timeSlots) {
        const matching = slotData.find((s) => s.time === slot);
		const isUnavailable = matching && matching.status !== "open";
		const isPastTime = selectedDate === getTodayDateStr() && slot <= getCurrentTimeStr();
		const isDisabled = isUnavailable || isPastTime;

		btn = document.createElement("button");
		btn.type = "button";
		btn.textContent = formatTimeLabel(slot);

		if (isDisabled) {
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

	const activeSlot = timeSlotsGrid.querySelector(".time-slot-btn.selected");
	if (activeSlot) {
		requestAnimationFrame(() => {
			activeSlot.scrollIntoView({ block: "nearest", behavior: "auto" });
		});
	}

	updateSelectedAppointmentDisplay();
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
		const todayDateStr = getTodayDateStr();
		const allSlotsPassedToday = dateStr === todayDateStr && getCurrentTimeStr() >= timeSlots[timeSlots.length - 1];
		let isManuallyBlocked = manuallyUnavailableDates.has(dateStr);

		let cell = document.createElement("div");
		cell.className = "cal-day-cell";

		let dayEl;
		if (isMonday || isPast || isManuallyBlocked || allSlotsPassedToday) {
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

