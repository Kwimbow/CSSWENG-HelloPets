const Slot = require("../schemas/Slot");

const timeSlots = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

// either creates the slots for a date or leaves them alone if they exist already
async function ensureSlotsExistForDate(dateStr) {
  const day = new Date(dateStr).getDay();
  if (day === 1) {
    return; // no slots on mondays
  }
  const ops = timeSlots.map((time) => ({
    updateOne: {
      filter: { date: dateStr, time },
      update: { $setOnInsert: { date: dateStr, time, status: "open" } },
      upsert: true,
    },
  }));
  await Slot.bulkWrite(ops);
}

module.exports = { ensureSlotsExistForDate, timeSlots };
