// utils/workdayHelpers.js
const { defaultWorkingDays } = require("../config/payrollRules");

// Expect employee.workingDays like "Mon-Fri" or "Mon, Tue, Wed, Thu, Fri"
function parseWorkingDays(str) {
  if (!str) return defaultWorkingDays;
  const cleaned = str.replace(/\s/g, "");
  if (cleaned.includes("-")) {
    // "Mon-Fri" style
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const [start, end] = cleaned.split("-");
    const sIdx = days.indexOf(start);
    const eIdx = days.indexOf(end);
    if (sIdx === -1 || eIdx === -1) return defaultWorkingDays;
    const out = [];
    for (let i = 0; i < 7; i++) {
      const idx = (sIdx + i) % 7;
      out.push(days[idx]);
      if (idx === eIdx) break;
    }
    return out;
  }
  // "Mon,Tue,Wed" style
  return str.split(",").map(s => s.trim());
}

exports.countExpectedWorkingDays = (employee, monthDates) => {
  const wd = parseWorkingDays(employee?.workingDays);
  return monthDates.filter(d => wd.includes(["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getUTCDay()])).length;
};
