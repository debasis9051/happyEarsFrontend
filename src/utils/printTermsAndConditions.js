export const handlePrintTermsAndConditions = () => {
    const pdfUrl = "/tandc.pdf";
    const printWindow = window.open(pdfUrl, "_blank");

    // Wait for PDF to load before printing
    if (printWindow) {
        printWindow.addEventListener("load", () => {
            printWindow.focus();
            printWindow.print();
        });
    }
};