function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

const dropDownStyle = {
    option: (styles) => {
        return {
            ...styles,
            color: 'black'
        };
    },
    menu: (styles) => {
        return {
            ...styles,
            minWidth: "max-content"
        };
    }
}

function formatPatientNumber(number) {
    return `PAT${String(number).padStart(4, "0")}`;
}

function formatAmount(amount) {
    let [integerPart, decimalPart] = amount.toString().split(".");

    integerPart = integerPart.replace(/\B(?=(\d{2})+(?!\d))/g, ",").replace(/^(\d+),/, "$1,");

    return decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;
}

export { escapeRegex, dropDownStyle, formatPatientNumber, formatAmount }