export const calculateFine = (dueDate) => {
    const finePerHour = 0.1; // 10 cents
    const centToRupee = 0.83; // 1 cent = 0.83 INR
    const today = new Date();

    if (today > dueDate) {
        const lateHours = Math.ceil((today - dueDate) / (1000 * 60 * 60));
        const fineInCents = lateHours * finePerHour;
        const fineInRupees = fineInCents * centToRupee;
        return fineInRupees;
    }
    
    return 0;
}
