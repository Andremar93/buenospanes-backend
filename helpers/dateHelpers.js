export const formatDateForSheets = (date) => {
    const dateObj = new Date(date);
    return (dateObj - new Date("1899-12-30")) / (1000 * 60 * 60 * 24);
}