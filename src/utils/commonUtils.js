import Swal from "sweetalert2"

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

function viewLocation({ latitude, longitude }){
    if (!latitude || !longitude) {
        Swal.fire("Oops!", "Map-coordinates not available", "info")
        return
    }

    window.open(`https://maps.google.com/?q=${latitude},${longitude}`)
}

export { escapeRegex, dropDownStyle, formatPatientNumber, formatAmount, viewLocation }