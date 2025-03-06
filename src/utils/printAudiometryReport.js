import moment from "moment"
import { formatPatientNumber } from "./commonUtils";
import { calculateHearingLoss } from "../components/Audiometry";

const drawMarker = (ctx, x, y, marker, markerColor, arrowFlag) => {
    if (marker === "circle") {
        ctx.strokeStyle = markerColor;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, 2 * Math.PI);
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    else if (marker === "cross") {
        ctx.beginPath();
        ctx.moveTo(x - 9, y - 9)
        ctx.lineTo(x + 9, y + 9)
        ctx.moveTo(x + 9, y - 9)
        ctx.lineTo(x - 9, y + 9)
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    else if (marker === "left_arrow") {
        ctx.beginPath();
        ctx.moveTo(x + 18, y - 9)
        ctx.lineTo(x, y)
        ctx.lineTo(x + 18, y + 9)
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    else if (marker === "right_arrow") {
        ctx.beginPath();
        ctx.moveTo(x - 18, y - 9)
        ctx.lineTo(x, y)
        ctx.lineTo(x - 18, y + 9)
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    else if (marker === "triangle") {
        ctx.beginPath();
        ctx.moveTo(x, y - 9)
        ctx.lineTo(x + 9, y + 9)
        ctx.lineTo(x - 9, y + 9)
        ctx.lineTo(x, y - 9)
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    else if (marker === "rectangle") {
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 9)
        ctx.lineTo(x + 12, y - 9)
        ctx.lineTo(x + 12, y + 9)
        ctx.lineTo(x - 12, y + 9)
        ctx.lineTo(x - 12, y - 10)
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    else if (marker === "left_bracket") {
        ctx.beginPath();
        ctx.moveTo(x + 9, y - 9)
        ctx.lineTo(x, y - 9)
        ctx.lineTo(x, y + 9)
        ctx.lineTo(x + 9, y + 9)
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    else if (marker === "right_bracket") {
        ctx.beginPath();
        ctx.moveTo(x - 9, y - 9)
        ctx.lineTo(x, y - 9)
        ctx.lineTo(x, y + 9)
        ctx.lineTo(x - 9, y + 9)
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    }


    if (arrowFlag) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y)
        ctx.lineTo(x - 23, y + 21)
        ctx.lineTo(x - 21, y + 7)
        ctx.moveTo(x - 23, y + 21)
        ctx.lineTo(x - 8, y + 19)
        ctx.stroke();
    }
}

const setupChart = (ctx) => {
    ctx.font = "15px Arial"
    ctx.textAlign = "center"

    ctx.beginPath();
    ctx.strokeRect(60, 60, 420, 420)
    ctx.stroke();

    ctx.strokeText("Hz", 35, 30);
    ctx.strokeText("dB", 20, 50);
    ctx.beginPath();
    ctx.moveTo(15, 25);
    ctx.lineTo(40, 45)
    ctx.stroke();

    //drawing colored sections in chart
    // let temp = [
    //     { range: 20, color: "#b8eeaa" },
    //     { range: 40, color: "#d5eaae" },
    //     { range: 70, color: "#e9d1af" },
    //     { range: 90, color: "#f5d6da" },
    //     { range: 120, color: "#f6a2b3" }
    // ];

    let temp = [
        { range: 20, color: "#d3f4c7" },
        { range: 40, color: "#e4f3b7" },
        { range: 70, color: "#f0e2b8" },
        { range: 90, color: "#f8d7db" },
        { range: 120, color: "#f8b7c1" } 
    ];

    let y1 = 60
    let y2

    ctx.beginPath();
    temp.forEach((obj, i, arr) => {
        y2 = 60 + (420 - 10) / (((120 + 10) / 10 + 1) - 1) * ((obj.range - (-10)) / 10)
        ctx.fillStyle = obj.color
        ctx.fillRect(60, y1, 420, y2 - y1 + (i === arr.length - 1 ? 10 : 0))
        y1 = y2
    })
    ctx.stroke();

    //drawing lines
    let x_labels = [250, 500, 1000, 2000, 4000, 6000, 8000]
    ctx.beginPath();
    x_labels.forEach((elem, i, arr) => {
        let x = 60 + 420 / (arr.length - 1) * i
        let y = 60 - 10 + 0

        ctx.strokeText(elem, x, y - 5);

        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 420 + 10)
    })
    ctx.stroke();

    let y_labels = Array.from({ length: (120 + 10) / 10 + 1 }, (_, index) => index * 10 - 10);
    ctx.beginPath();
    y_labels.forEach((elem, i, arr) => {
        let x = 60 - 10 + 0
        let y = 60 + (420 - 10) / (arr.length - 1) * i

        ctx.strokeText(elem, x - 15, y + 5);

        ctx.moveTo(x, y);
        ctx.lineTo(x + 420 + 10, y)
    })
    ctx.stroke();
}

const drawChartData = (ctx, ptaData, lineType, lineColor, marker) => {
    ctx.lineWidth = 4

    if (lineType === "solid") {
        ctx.setLineDash([]);
    }
    else if (lineType === "dashed") {
        ctx.setLineDash([5, 10]);
    }

    ctx.strokeStyle = lineColor

    ctx.beginPath()
    ptaData.data.forEach((elem, i, arr) => {
        let pos = (elem.decibal === null ? ptaData.config.find(a => a.frequency === elem.frequency).max : elem.decibal)
        let x = 60 + 420 / 6 * i
        let y = 60 + (420 - 10) / (120 + 10) * (pos + 10)

        if (i === 0 || elem.decibal === null || arr[i - 1].decibal === null) {
            ctx.moveTo(x, y);
        }
        else {
            ctx.lineTo(x, y)
        }
    })
    ctx.stroke();
    ctx.setLineDash([]);

    ptaData.data.forEach((elem, i) => {
        let pos = (elem.decibal === null ? ptaData.config.find(a => a.frequency === elem.frequency).max : elem.decibal)
        let x = 60 + 420 / 6 * i
        let y = 60 + (420 - 10) / (120 + 10) * (pos + 10)

        drawMarker(ctx, x, y, marker, lineColor, (elem.decibal === null ? true : false))
    })
}

const printAudiometryReport = (reportData, patientDetails, printConfigData, doctor_details, branchList) => {

    let header_image = "/happy_ears_invoice_header_" + branchList.find(x=>x.id===reportData.branch_id).branch_name.toLowerCase() + ".png"

    let ac_lhl_data = calculateHearingLoss(reportData.ac_left_ear_pta.data)
    let ac_rhl_data = calculateHearingLoss(reportData.ac_right_ear_pta.data)

    let html = `
        <div class="container-fluid position-relative my-4 fw-bold" style="height:90%;">

            <div>
                <img src="${printConfigData.header ? header_image : "/happy_ears_invoice_header_empty.jpg"}" alt="header_image" style="width:100%;" >
            </div> 

            <h2 class="text-center text-decoration-underline text-uppercase m-2" style="color:navy;">${reportData.trial_mode ? "Audiogram Hearing Aid Trial" : "Pure Tone Audiogram"} </h2>
            <div class="d-flex my-2 align-items-center">
                <span class="mx-2 text-nowrap fs-5" style="flex:2;">Patient Name : </span>
                <span class="mx-2 text-nowrap border-bottom border-dark fs-5" style="flex:7;" >${patientDetails.patient_name}</span>
                <span class="mx-2 text-nowrap fs-5" style="flex:1;">Patient Number : </span>
                <span class="mx-2 text-nowrap border-bottom border-dark fs-5" style="flex:1;" >${formatPatientNumber(patientDetails.patient_number)}</span>
                <span class="mx-2 text-nowrap fs-5" style="flex:1;">Age/Sex :</span>
                <span class="mx-2 text-nowrap border-bottom border-dark fs-5" style="flex:1;" >${patientDetails.age}/${patientDetails.sex[0].toUpperCase()}</span>
            </div>

            ${reportData.trial_mode ?
                `<div class="d-flex my-2 align-items-center">
                    <span class="mx-2 text-nowrap fs-5 ">Recommended Machine: </span>
                    <span class="mx-2 text-nowrap border-bottom border-dark fs-5 flex-grow-1">${reportData.recommended_machine}</span>
                    <span class="mx-2 text-nowrap fs-5 ">Client Chosen Machine: </span>
                    <span class="mx-2 text-nowrap border-bottom border-dark fs-5 flex-grow-1">${reportData.client_chosen_machine}</span>
                </div>`
                :
                `<div class="d-flex my-2 align-items-center">
                    <span class="mx-2 text-nowrap fs-5">Referred By: </span>
                    <span class="mx-2 text-nowrap border-bottom border-dark fs-5 flex-grow-1">${reportData.referred_by}</span>
                    <span class="mx-2 text-nowrap fs-5">Audiometer: </span>
                    <span class="mx-2 text-nowrap border-bottom border-dark fs-5 flex-grow-1">${reportData.audiometer}</span>
                </div>`
            }

            <div class="d-flex my-2 align-items-center">
                <span class="mx-2 text-nowrap fs-5">Date: </span>
                <span class="mx-2 text-nowrap flex-grow-1 border-bottom border-dark fs-5">${moment.unix(reportData.date._seconds).format("DD-MM-YYYY")}</span>
            </div>

            ${!reportData.trial_mode ?
                `<div class="d-flex my-2">
                    <span class="mx-2 text-nowrap fs-5">Complaint: </span>
                    <span class="mx-2 text-nowrap flex-grow-1 border-bottom border-dark fs-5">${reportData.complaint}</span>
                </div>` : ""
            }

            <div class="d-flex text-center" style="gap:10px;">
                <div class="flex-grow-1">
                    <h2 style="color:blue; margin:0;">Left</h2>
                    <canvas id="acLeftEarChart" style="width: 400px; height: 400px" width="500" height="500"></canvas>
                    <div>
                        <span style="color:blue;">PTA (LT EAR) </span> =
                        <span class="border-bottom border-dark">${ac_lhl_data.unit} db</span>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <h2 style="color:red; margin:0;">Right</h2>
                    <canvas id="acRightEarChart" style="width: 400px; height: 400px" width="500" height="500"></canvas>
                    <div>
                        <span style="color:red;">PTA (RT EAR) </span> =
                        <span class="border-bottom border-dark">${ac_rhl_data.unit} db</span>
                    </div>
                </div>
                <div>
                    <table class="table table-bordered border-dark text-center" style="margin-top: 60px;">
                        <tr><td class="py-1 bg-primary text-white">AC</td></td>
                        <tr><td class="py-1"><span class="me-5">L</span><span>&#128936;</span></td></td>
                        <tr><td class="py-1"><span class="me-5">R</span><span>&#9675;</span></td></td>
                        <tr><td class="py-1 bg-primary text-white">BC</td></td>
                        <tr><td class="py-1"><span class="me-5">L</span><span>></span></td></td>
                        <tr><td class="py-1"><span class="me-5">R</span><span><</span></td></td>
                        <tr><td class="py-1 bg-primary text-white">MASKED&nbsp;AC</td></td>
                        <tr><td class="py-1"><span class="me-5">L</span><span>&#9645;</span></td></td>
                        <tr><td class="py-1"><span class="me-5">R</span><span>&#9651;</span></td></td>
                        <tr><td class="py-1 bg-primary text-white">MASKED&nbsp;BC</td></td>
                        <tr><td class="py-1"><span class="me-5">L</span><span>]</span></td></td>
                        <tr><td class="py-1"><span class="me-5">R</span><span>[</span></td></td>
                    </table>
                </div>
            </div>

            ${!reportData.trial_mode ?
                `<div class="d-flex align-items-center gap-3 my-2">
                    <div class="d-flex flex-wrap mb-1 align-items-center">
                        <span class="fs-5">Tuning Fork: </span>
                        <span class="mx-2 border-bottom border-dark fs-5">${reportData.tuning_fork}</span>
                    </div>
                    <div class="flex-grow-1">
                        <table class="table table-sm table-bordered border-dark m-0">
                            <tr>
                                <td></td>
                                <td><span class="fw-bold" style="color:blue;">Left</span></td>
                                <td><span class="fw-bold" style="color:red;">Right</span></td>
                            </tr>
                            <tr>
                                <td><span class="fw-bold">Rinne</span></td>
                                <td>${reportData.rinne.left}</td>
                                <td>${reportData.rinne.right}</td>
                            </tr>
                            <tr>
                                <td><span class="fw-bold">Weber</span></td>
                                <td colspan="2">${reportData.weber}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                <div class="my-1 d-flex align-items-center">
                    <span class="fs-5">Provisional Diagnosis: </span>
                    <div class="w-100">
                        <div class="mx-2 border-bottom border-dark fs-5 text-nowrap" style="color:red;"><span class="fst-italic">Rt.</span> ${reportData.provisional_diagnosis.right}</div>
                        <div class="mx-2 border-bottom border-dark fs-5 text-nowrap" style="color:blue;"><span class="fst-italic">Lt.</span> ${reportData.provisional_diagnosis.left}</div>
                    </div>
                </div>
                <div class="my-1">
                    <span class="fs-5">Recommendations: </span>
                    <span class="mx-2 fs-5">${reportData.recommendations.map((x, i) => `<div class="border-bottom border-dark"><span style="color:blue;">${i + 1}. </span>${x}</div>`).join("")}</span>
                </div>` : ""
            }

            ${!reportData.trial_mode ?
                `<div class="ms-auto d-flex flex-column align-items-center" style="width:max-content; margin-right: 6rem" >
                    ${doctor_details? `<div class="text-center"><img src=${doctor_details.doctor_signature} alt="doctor_signature" height="60"></div>` : `<div style="height:60px;"></div>`}
                    <span style="font-size:smaller;">Clinical Audiologist & Speech Therapist </span>
                    ${doctor_details? `<span style="font-size:smaller;">${doctor_details.doctor_qualification}</span>`: ""} 
                    ${doctor_details? `<span style="font-size:smaller;">RCI Reg No.: ${doctor_details.doctor_registration_number}</span>`: ""} 
                </div>` : ""
            }

            ${reportData.trial_mode ?
                `<div class="my-5">
                <span>Disclaimer :: </span>
                <span class="text-danger">This is just a trial report based on patient response. This cannot be or should not be treated as medical audiogram report(PTA)</span>
                </div>` : ""
            }
            
            ${printConfigData.footer ?
                `<div class="position-absolute w-100" style="bottom:-110px; border-top:solid 1px black;">
                    <div class="d-flex">Branches:
                        <div class="d-flex justify-content-around flex-grow-1">
                            ${branchList.filter(x=> x.id !== reportData.branch_id && x.branch_name !== "Ranikuthi").map(x=>`<span>
                                <svg width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>
                                ${x.branch_name}
                            </span>`).join("")}
                        </div>
                    </div>
                    <div class="text-center" >Copyright © 2024 Happy Ears Kolkata</div>
                </div>`: ""
            }

        </div>
    `

    let nw = window.open()
    nw.document.head.innerHTML = `
    <title>Audiogram</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    `
    nw.document.body.innerHTML = html

    let ctx1 = nw.document.getElementById('acLeftEarChart').getContext("2d")
    let ctx2 = nw.document.getElementById('acRightEarChart').getContext("2d")
    setupChart(ctx1)
    setupChart(ctx2)

    drawChartData(ctx1, reportData.ac_left_ear_pta, "solid", "blue", reportData.ac_left_ear_pta.masked ? "rectangle" : "cross")
    drawChartData(ctx2, reportData.ac_right_ear_pta, "solid", "red", reportData.ac_right_ear_pta.masked ? "triangle" : "circle")
    if (reportData.bc_input) {
        drawChartData(ctx1, reportData.bc_left_ear_pta, "dashed", "blue", reportData.bc_left_ear_pta.masked ? "right_bracket" : "right_arrow")
        drawChartData(ctx2, reportData.bc_right_ear_pta, "dashed", "red", reportData.bc_right_ear_pta.masked ? "left_bracket" : "left_arrow")
    }

    setTimeout(() => { nw.print() }, 2000);
}

export { printAudiometryReport }