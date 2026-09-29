// Date helpers. All app dates are plain "YYYY-MM-DD" strings (same as the frontend).
export function todayStr() {
    return formatDate(new Date());
}
export function addDaysStr(base, days) {
    const d = new Date(`${base}T00:00:00`);
    d.setDate(d.getDate() + days);
    return formatDate(d);
}
export function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
//# sourceMappingURL=date.js.map