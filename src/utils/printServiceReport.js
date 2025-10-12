import { formatPatientNumber } from './commonUtils';
import moment from 'moment';

const printServiceReport = (serviceReportData, patientDetails, printConfigData) => {

    let header_image = "/happy_ears_invoice_header_ranikuthi.png"

    // Format timestamps using moment
    const createdAt = moment.unix(serviceReportData.created_at._seconds).format('LLLL');
    const closedAt = (serviceReportData.status === 'COMPLETED' || serviceReportData.status === 'CANCELLED') && serviceReportData.closed_at
        ? moment.unix(serviceReportData.closed_at._seconds).format('LLLL')
        : 'N/A';

    // Build HTML for attachments
    const attachmentHtml = serviceReportData.file_references ? serviceReportData.file_references.map(file => `
        <div class="attachment mb-3 text-center">
            <img src="${file.downloadUrl}" alt="${file.originalName}" style="max-width:200px; max-height:200px; display:block; margin:auto;" />
            <div style="font-size:0.8rem; margin-top:4px;">Image taken at: ${file.takenAt ? moment(file.takenAt).format('LLLL') : 'N/A'}</div>
        </div>
    `).join('')
    : '<div>No attachments available.</div>';

    let html = `
        <div class="container-fluid position-relative my-4 fw-bold" style="height:90%;">
            <div>
                <img src="${printConfigData.header ? header_image : "/happy_ears_invoice_header_empty.jpg"}" alt="header_image" style="width:100%;" >
            </div> 
            
            <div class="report-content mt-3 px-3" style="font-weight:bold;">
                <div class="mb-2"><span style="width:180px; display:inline-block;">Patient Number:</span> ${formatPatientNumber(patientDetails.patient_number)}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Patient Name:</span> ${patientDetails.patient_name}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Patient Address:</span> ${patientDetails.patient_address}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Request Created On:</span> ${createdAt}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Date of Visit:</span> ${closedAt}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Reported Problem:</span> ${serviceReportData.problem_description || 'N/A'}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Solution Provided:</span> ${serviceReportData.outcome_details || 'N/A'}</div>
                <div class="mb-2"><span style="width:180px; display:inline-block;">Service Status:</span> ${serviceReportData.status}</div>
            </div>

            <div class="attachments-section mt-4 d-flex flex-wrap justify-content-start">
                ${attachmentHtml}
            </div>

            ${printConfigData.footer ?
            `<div class="position-absolute w-100" style="bottom:-82px; border-top:solid 1px black;">
                    <div class="text-center" >Copyright © 2024 Happy Ears Kolkata</div>
                </div>` : ""
        }

        </div>
    `

    let nw = window.open()
    nw.document.head.innerHTML = `
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    `
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
        .then(() => {
            setTimeout(() => { nw.print() }, 2000);
        })
        .catch((err) => {
            console.error("Error while waiting for images:", err);
            nw.print(); // fallback
        });
}

export { printServiceReport }