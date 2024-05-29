import moment from "moment"

const drawMarker = (ctx, x, y, marker, arrowFlag) => {
    if (marker === "circle") {
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
    }
    else if (marker === "cross") {
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 5)
        ctx.lineTo(x + 5, y + 5)
        ctx.moveTo(x + 5, y - 5)
        ctx.lineTo(x - 5, y + 5)
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    else if (marker === "left_arrow") {
        ctx.beginPath();
        ctx.moveTo(x + 5, y - 5)
        ctx.lineTo(x - 5, y)
        ctx.lineTo(x + 5, y + 5)
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    else if (marker === "right_arrow") {
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 5)
        ctx.lineTo(x + 5, y)
        ctx.lineTo(x - 5, y + 5)
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    else if (marker === "triangle") {
        ctx.beginPath();
        ctx.moveTo(x, y - 5)
        ctx.lineTo(x + 5, y + 5)
        ctx.lineTo(x - 5, y + 5)
        ctx.lineTo(x, y - 5)
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    else if (marker === "rectangle") {
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 5)
        ctx.lineTo(x + 8, y - 5)
        ctx.lineTo(x + 8, y + 5)
        ctx.lineTo(x - 8, y + 5)
        ctx.lineTo(x - 8, y - 6)
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    else if (marker === "left_bracket") {
        ctx.beginPath();
        ctx.moveTo(x + 5, y - 5)
        ctx.lineTo(x, y - 5)
        ctx.lineTo(x, y + 5)
        ctx.lineTo(x + 5, y + 5)
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    else if (marker === "right_bracket") {
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 5)
        ctx.lineTo(x, y - 5)
        ctx.lineTo(x, y + 5)
        ctx.lineTo(x - 5, y + 5)
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    

    if (arrowFlag) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y)
        ctx.lineTo(x - 9, y + 9)
        ctx.lineTo(x - 5, y)
        ctx.moveTo(x - 9, y + 9)
        ctx.lineTo(x, y + 5)
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

    let x_labels = [250, 500, 1000, 2000, 4000, 6000, 8000]
    ctx.beginPath();
    x_labels.forEach((elem, i, arr) => {
        let x = 60 + 420 / (arr.length - 1) * i
        let y = 50 + 0

        ctx.strokeText(elem, x, y - 5);

        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 420 + 10)
    })
    ctx.stroke();

    let y_labels = Array.from({ length: (120 + 10) / 10 + 1 }, (_, index) => index * 10 - 10);
    ctx.beginPath();
    y_labels.forEach((elem, i, arr) => {
        let x = 50 + 0
        let y = 60 + (420 - 10) / (arr.length - 1) * i

        ctx.strokeText(elem, x - 15, y + 5);

        ctx.moveTo(x, y);
        ctx.lineTo(x + 420 + 10, y)
    })
    ctx.stroke();
}

const drawChartData = (ctx, data, marker) => {
    ctx.strokeStyle = "black"
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(60 + 0, 60 + (420 - 10) / (120 + 10) * (data[0] + 10));
    data.slice(1, data.length).forEach((elem, i, arr) => {
        let x = 60 + 420 / (arr.length) * (i + 1)
        let y = 60 + (420 - 10) / (120 + 10) * ((elem === null ? 120 : elem) + 10)

        ctx.lineTo(x, y)
    })
    ctx.stroke();

    data.forEach((elem, i, arr) => {
        let x = 60 + 420 / (arr.length - 1) * i
        let y = 60 + (420 - 10) / (120 + 10) * ((elem === null ? 120 : elem) + 10)

        drawMarker(ctx, x, y, marker, (elem === null ? true : false))
    })
}

const printAudiometryReport = (reportData, calculateHearingLoss, signature) => {

    let ac_lhl_data = calculateHearingLoss(reportData.ac_left_ear_pta.data)
    let ac_rhl_data = calculateHearingLoss(reportData.ac_right_ear_pta.data)

    let html = `
        <div class="container-fluid my-4 fw-bold">

            <h2 class="text-center text-decoration-underline text-uppercase m-2" style="color:navy;">${reportData.trial_mode ? "Audiogram Hearing Aid Trial" : "Pure Tone Audiogram"} </h2>
            <div class="d-flex my-2 align-items-center">
                <span class="mx-2">Patient Name : </span>
                <span class="mx-2 flex-grow-1 border-bottom border-dark fs-4">${reportData.patient_name}</span>
                <span class="mx-2">Age/Sex :</span>
                <span class="mx-2 border-bottom border-dark fs-4">${reportData.age}/${reportData.sex[0].toUpperCase()}</span>
            </div>
            ${
                reportData.trial_mode ?
                `<div class="row gx-0 my-2">
                    <div class="col-6 d-flex align-items-center">
                        <span class="mx-2">Recommended Machine: </span>
                        <span class="mx-2 border-bottom border-dark fs-4 flex-grow-1">${reportData.recommended_machine}</span>
                    </div>
                    <div class="col-6 d-flex align-items-center">
                        <span class="mx-2">Client Chosen Machine: </span>
                        <span class="mx-2 border-bottom border-dark fs-4 flex-grow-1">${reportData.client_chosen_machine}</span>
                    </div>
                </div>`
                :
                `<div class="row gx-0 my-2">
                    <div class="col-6 d-flex align-items-center">
                        <span class="mx-2">Referred By: </span>
                        <span class="mx-2 border-bottom border-dark fs-4 flex-grow-1">${reportData.referred_by}</span>
                    </div>
                    <div class="col-6 d-flex align-items-center">
                        <span class="mx-2">Audiometer: </span>
                        <span class="mx-2 border-bottom border-dark fs-4 flex-grow-1">${reportData.audiometer}</span>
                    </div>
                </div>`
            }
            <div class="d-flex my-2 align-items-center">
                <span class="mx-2">Date: </span>
                <span class="mx-2 flex-grow-1 border-bottom border-dark fs-4">${moment(reportData.created_at).format("DD-MM-YYYY")}</span>
            </div>
            ${
                !reportData.trial_mode ?
                `<div class="d-flex flex-wrap my-2 align-items-center">
                    <span class="mx-2">Complaint: </span>
                    <span class="mx-2 flex-grow-1 border-bottom border-dark fs-4">${reportData.complaint}</span>
                </div>` : ""
            }

            <div class="d-flex text-center" style="gap:30px;">
                <div>
                    <h2 style="color:blue; margin:30px 0">Left</h2>
                    <canvas id="acLeftEarChart" style="width: 400px; height: 400px" width="500" height="500"></canvas>
                    <div style="margin-top:30px">
                        <span>PTA (LT EAR) = </span>
                        <span class="border-bottom border-dark">${ac_lhl_data.unit} db Hz</span>
                    </div>
                    <div style="margin-bottom:30px; margin-top:15px;">
                        <span>Degree of Hearing Loss: </span>
                        <span class="p-2 rounded" style="background-color:${ac_lhl_data.color}">${ac_lhl_data.text}</span>
                    </div>
                </div>
                <div>
                    <h2 style="color:red; margin:30px 0">Right</h2>
                    <canvas id="acRightEarChart" style="width: 400px; height: 400px" width="500" height="500"></canvas>
                    <div style="margin-top:30px">
                        <span>PTA (RT EAR) = </span>
                        <span class="border-bottom border-dark">${ac_rhl_data.unit} db Hz</span>
                    </div>
                    <div style="margin-bottom:30px; margin-top:15px;">
                        <span>Degree of Hearing Loss: </span>
                        <span class="p-2 rounded" style="background-color:${ac_rhl_data.color}">${ac_rhl_data.text}</span>
                    </div>
                </div>
                <div>
                    <table class="table table-bordered text-center" style="margin-top: 130px;">
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

            ${
                !reportData.trial_mode ?
                `<div class="d-flex align-items-center gap-3">
                    <div class="d-flex flex-wrap mb-1 align-items-center">
                        <span class="mx-2">Tuning Fork: </span>
                        <span class="mx-2 border-bottom border-dark fs-4">${reportData.tuning_fork}</span>
                    </div>
                    <div class="flex-grow-1">
                        <table class="table table-bordered border-dark">
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
                                <td>${reportData.weber.left}</td>
                                <td>${reportData.weber.right}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                <div class="my-4">
                    <span class="mx-2">Provisional Diagnosis: </span>
                    <div class="mx-2 border-bottom border-dark fs-4"><span class="fst-italic">Lt.</span> ${reportData.provisional_diagnosis.left}</div>
                    <div class="mx-2 border-bottom border-dark fs-4"><span class="fst-italic">Rt.</span> ${reportData.provisional_diagnosis.right}</div>
                </div>
                <div class="d-flex flex-wrap my-2 align-items-center">
                    <span class="mx-2">Recommendations: </span>
                    <span class="mx-2 flex-grow-1 border-bottom border-dark fs-4">${reportData.recommendations}</span>
                </div>` : ""
            }

            ${
                !reportData.trial_mode ?
                `<div class="my-2 ms-auto" style="width:max-content; margin-right: 6rem" >
                    <img class="d-block" src=${signature} alt="doctor_signature" height="60">
                    <span>Clinical Audiologist <br> & Speech Therapist </span>
                </div>` : ""
            }
            ${
                reportData.trial_mode ?
                `<div class="my-5">
                    <span>Disclaimer :: </span>
                    <span class="text-danger">This is just a trial report based on patient response. This cannot be or should not be treated as medical audiogram report(PTA)</span>
                </div>` : ""
            }

            <div>Domain: ${window.location.href}</div>
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

    drawChartData(ctx1, reportData.ac_left_ear_pta.data.map(x => x.decibal), reportData.ac_left_ear_pta.masked ? "rectangle" : "cross")
    drawChartData(ctx2, reportData.ac_right_ear_pta.data.map(x => x.decibal), reportData.ac_right_ear_pta.masked ? "triangle" : "circle")
    if (reportData.bc_input) {
        drawChartData(ctx1, reportData.bc_left_ear_pta.data.map(x => x.decibal), reportData.bc_left_ear_pta.masked ? "right_bracket" : "right_arrow")
        drawChartData(ctx2, reportData.bc_right_ear_pta.data.map(x => x.decibal), reportData.bc_right_ear_pta.masked ? "left_bracket" : "left_arrow")
    }

    setTimeout(() => { nw.print() }, 2000);
}

export { printAudiometryReport }