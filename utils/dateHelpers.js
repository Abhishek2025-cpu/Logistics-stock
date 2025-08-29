// utils/dateHelpers.js
exports.getMonthDateRange = (monthStr) => {
  // monthStr = "YYYY-MM"
  const [y, m] = monthStr.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // last day of month
  return { start, end };
};

exports.listMonthDates = (monthStr) => {
  const dates = [];
  const { start, end } = exports.getMonthDateRange(monthStr);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
};

exports.toYMD = (date) => new Date(date).toISOString().split("T")[0];
