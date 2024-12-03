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
    let formattedNumber = parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 20
    });

    return formattedNumber;
}

export { escapeRegex, dropDownStyle, formatPatientNumber, formatAmount }