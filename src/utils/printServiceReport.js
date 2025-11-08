import { formatPatientNumber } from './commonUtils';
import moment from 'moment';

const generateServiceReportHTML = (serviceReportData, patientDetails, printConfigData) => {
    let header_image = "/happy_ears_invoice_header_ranikuthi.png"

    const createdAt = moment.unix(serviceReportData.created_at._seconds).format('LLLL');
    const closedAt = (serviceReportData.status === 'COMPLETED' || serviceReportData.status === 'CANCELLED') && serviceReportData.closed_at
        ? moment.unix(serviceReportData.closed_at._seconds).format('LLLL')
        : 'N/A';

    const attachmentHtml = serviceReportData.file_references ? serviceReportData.file_references.map(file => `
        <div style="text-align:center;">
            <img src="${file.downloadUrl}" width="150" height="auto" style="border:1px solid #ccc; border-radius:8px; padding:4px;">
            <div style="font-size:12px; margin-top:4px;">Image taken: ${file.takenAt ? moment(file.takenAt).format('LLLL') : 'N/A'}</div>
        </div>
    `).join('') : '<div>No attachments available.</div>';

    // <div class="container-fluid position-relative my-4 fw-bold" style="height:90%; page-break-after: always;">
    return `
        <div class="container-fluid d-flex flex-column my-4 fw-bold" style="min-height:95vh; page-break-after: always; position:relative;">
            <div>
                <img src="${printConfigData.header ? header_image : "/happy_ears_invoice_header_empty.jpg"}" alt="header_image" style="width:100%;" >
            </div> 
            
            <div class="report-content mt-3 px-3" style="font-weight:bold;">
                <div class="mb-2"><span style="width:180px; display:inline-block;">Service ID:</span> ${serviceReportData.service_id}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Patient Number:</span> ${formatPatientNumber(patientDetails.patient_number)}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Patient Name:</span> ${patientDetails.patient_name}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Patient Address:</span> ${patientDetails.patient_address}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Request Created On:</span> ${createdAt}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Date of Visit:</span> ${closedAt}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Reported Problem:</span> ${serviceReportData.problem_description || 'N/A'}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Solution Provided:</span> ${serviceReportData.outcome_details || 'N/A'}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Service Status:</span>
                    <span style="color:${serviceReportData.status === "COMPLETED" ? "green" : serviceReportData.status === "CANCELLED" ? "red" : "orange"};">${serviceReportData.status}</span>
                </div>
            </div>

            <div style="border-top: 1px solid #ccc; margin-top: 16px; padding-top: 8px;">
                <h4 style="text-align:center; font-weight:600;">Images from Service Visit</h4>
                <div style="display:flex; justify-content:space-around; margin-top:8px;">
                    ${attachmentHtml}
                </div>
            </div>

            ${printConfigData.footer ? `
                <footer style="border-top:1px solid black; text-align:center; padding-top:4px; margin-top:auto;">
                    <div>Copyright © 2024 Happy Ears Kolkata</div>
                </footer>
            ` : ""}

        </div>
    `;
};


const printServiceReport = (serviceReportData, patientDetails, printConfigData) => {

    let html = generateServiceReportHTML(serviceReportData, patientDetails, printConfigData);

    let nw = window.open()
    nw.document.head.innerHTML = `
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    `
    nw.document.title = `ServiceReport_${serviceReportData.service_id}_${patientDetails.patient_name}_${moment().format('DD-MM-YYYY')}`;
    nw.document.body.innerHTML = html

    // Promise-based image load handling
    const waitForImagesToLoad = () => {
        const images = nw.document.images;
        if (images.length === 0) return Promise.resolve();

        return Promise.all(
            Array.from(images).map(
                (img) =>
                    new Promise((resolve) => {
                        img.onload = img.onerror = () => resolve();
                    })
            )
        );
    };

    waitForImagesToLoad()
        .then(() => { setTimeout(() => { nw.print() }, 2000); })
        .catch((err) => {
            console.error("Error while waiting for images:", err);
            nw.print(); // fallback
        });
}

const printCumulativeServiceReport = (serviceReportsArray, patientDetails, printConfigData) => {
    if (!Array.isArray(serviceReportsArray) || serviceReportsArray.length === 0) return;

    // Build all reports
    let allReportsHtml = serviceReportsArray.map(report =>
        generateServiceReportHTML(report, patientDetails, printConfigData, moment, formatPatientNumber)
    ).join('');

    // Add a final summary page
    const totalReports = serviceReportsArray.length;
    const completed = serviceReportsArray.filter(r => r.status === 'COMPLETED').length;
    const cancelled = serviceReportsArray.filter(r => r.status === 'CANCELLED').length;
    const pending = totalReports - completed - cancelled;
    const paidVisits = serviceReportsArray.filter(r => r.service_type === 'PAID').length;
    const freeVisits = serviceReportsArray.filter(r => r.service_type === 'FREE').length;

    const summaryPageHtml = `
        <div class="container-fluid d-flex flex-column justify-content-between my-4 fw-bold" 
            style="min-height:100vh; page-break-before: always;">

            <!-- Header -->
            <div>
                <img src="${printConfigData.header ? "/happy_ears_invoice_header_ranikuthi.png" : "/happy_ears_invoice_header_empty.jpg"}" 
                    alt="header_image" style="width:100%;">
            </div>

            <!-- Summary Content -->
            <div class="text-center mt-4 px-3" style="font-weight:bold;">
                <h2 class="mb-3">Service Summary</h2>
                <div class="mb-2">Total Visits: ${totalReports}</div>
                <div class="mb-2" style="color:green;">Completed: ${completed}</div>
                <div class="mb-2" style="color:red;">Cancelled: ${cancelled}</div>
                <div class="mb-2" style="color:orange;">Pending: ${pending}</div>
                <div class="mb-2">No. of Paid Visits: ${paidVisits}</div>
                <div class="mb-2">No. of Free Visits: ${freeVisits}</div>
            </div>

            <!-- Footer -->
            ${printConfigData.footer ? `
                <footer style="border-top:1px solid black; text-align:center; padding-top:4px; margin-top:auto;">
                    <div>Copyright © 2024 Happy Ears Kolkata</div>
                </footer>
            ` : ""}
        </div>
    `;


    const fullHtml = allReportsHtml + summaryPageHtml;

    // Create print window
    let nw = window.open();
    nw.document.head.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    `;
    nw.document.title = `CumulativeServiceReport_${patientDetails.patient_name}_${moment().format('DD-MM-YYYY')}`;
    nw.document.body.innerHTML = fullHtml;

    const waitForImagesToLoad = () => {
        const images = nw.document.images;
        if (images.length === 0) return Promise.resolve();
        return Promise.all(Array.from(images).map(img => new Promise(resolve => {
            img.onload = img.onerror = () => resolve();
        })));
    };

    waitForImagesToLoad()
        .then(() => setTimeout(() => nw.print(), 2000))
        .catch(err => {
            console.error("Error while waiting for images:", err);
            nw.print();
        });
};

export { printServiceReport, printCumulativeServiceReport };