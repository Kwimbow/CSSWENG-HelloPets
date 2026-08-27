const BoardingSlot = require("../schemas/BoardingSlot");

// shared cap across dogs and cats combined - the day just has 10 spots, regardless of species
const MAX_ANIMALS_PER_DAY = 10;

// either creates the boarding slot for a date or leaves it alone if it exists already
async function ensureBoardingSlotExistsForDate(dateStr) {
	const day = new Date(dateStr).getDay();
	if (day === 1) {
		return;
	}
	await BoardingSlot.updateOne(
		{ date: dateStr },
		{ $setOnInsert: { date: dateStr, animalCount: 0, blocked: false } },
		{ upsert: true },
	);
}

// ensures a boarding slot exists for every date from startDateStr to endDateStr
async function ensureBoardingSlotsExistForRange(startDateStr, endDateStr) {
	const dates = getDateRangeInclusive(startDateStr, endDateStr);
	for (const dateStr of dates) {
		await ensureBoardingSlotExistsForDate(dateStr);
	}
}

// returns an array of "YYYY-MM-DD" strings for every date from start to end
function getDateRangeInclusive(startDateStr, endDateStr) {
	const dates = [];
	let current = new Date(`${startDateStr}T00:00:00`);
	const end = new Date(`${endDateStr}T00:00:00`);

	while (current <= end) {
		const year = current.getFullYear();
		const month = String(current.getMonth() + 1).padStart(2, "0");
		const day = String(current.getDate()).padStart(2, "0");
		dates.push(`${year}-${month}-${day}`);
		current.setDate(current.getDate() + 1);
	}

	return dates;
}

// checks whether every day in [startDateStr, endDateStr] has room for one more animal, and isn't manually blocked
async function hasBoardingCapacity(startDateStr, endDateStr, petType) {
	await ensureBoardingSlotsExistForRange(startDateStr, endDateStr);
	const dates = getDateRangeInclusive(startDateStr, endDateStr);
	const slots = await BoardingSlot.find({ date: { $in: dates } });

	if (slots.length !== dates.length) {
		return false;
	}

	return slots.every((slot) => !slot.blocked && slot.animalCount < MAX_ANIMALS_PER_DAY);
}

// increments the combined animal count on every day in the range and links the booking to each of those slots
async function claimBoardingDates(startDateStr, endDateStr, petType, bookingId) {
	const dates = getDateRangeInclusive(startDateStr, endDateStr);

	await BoardingSlot.updateMany(
		{ date: { $in: dates } },
		{ $inc: { animalCount: 1 }, $push: { bookings: bookingId } },
	);
}

// reverses claimBoardingDates used when a boarding booking is deleted
async function releaseBoardingDates(startDateStr, endDateStr, petType, bookingId) {
	const dates = getDateRangeInclusive(startDateStr, endDateStr);

	await BoardingSlot.updateMany(
		{ date: { $in: dates } },
		{ $inc: { animalCount: -1 }, $pull: { bookings: bookingId } },
	);
}

module.exports = {
	ensureBoardingSlotExistsForDate,
	ensureBoardingSlotsExistForRange,
	getDateRangeInclusive,
	hasBoardingCapacity,
	claimBoardingDates,
	releaseBoardingDates,
	MAX_ANIMALS_PER_DAY,
};