import { ToWords } from 'to-words';

const designParticulars = (discount_amount,line_items,accessory_items) => {
    let f = [[], [], [], [], [], [], []]

    f[0].push(`<br>`)
    f[1].push(`<span class="fw-bold">Products :-</span><br>`)
    f[2].push(`<br>`)
    f[3].push(`<br>`)
    f[4].push(`<br>`)
    f[5].push(`<br>`)
    f[6].push(`<br>`)

    f = line_items.reduce((p, o, i) => {
        let t = p.map(x => { return [...x] })
        t[0].push(`${i + 1}<br><br>`)
        t[1].push(`${o.product_name}<br>S/N:-${o.serial_number}<br>`)
        t[2].push(`${o.manufacturer_name}<br><br>`)
        t[3].push(`${o.product_type}<br><br>`)
        t[4].push(`${1}<br><br>`)
        t[5].push(`${o.product_rate}/-<br><br>`)
        t[6].push(`${o.product_rate}/-<br><br>`)
        return t
    }, f)

    f[0].push(`<br>`)
    f[1].push(`<br>`)
    f[2].push(`<br>`)
    f[3].push(`<br>`)
    f[4].push(`<br>`)
    f[5].push(`Discount (RS.) :-<br>`)
    f[6].push(`${discount_amount}<br>`)

    if (accessory_items.find(x => x.accessory !== "")) {
        f[0].push(`<br>`)
        f[1].push(`<span class="fw-bold">Accessories :-</span><br>`)
        f[2].push(`<br>`)
        f[3].push(`<br>`)
        f[4].push(`<br>`)
        f[5].push(`<br>`)
        f[6].push(`<br>`)

        f = accessory_items.reduce((p, o, i) => {
            let t = p.map(x => { return [...x] })
            t[0].push(`${i + 1}<br>`)
            t[1].push(`${o.accessory}<br>`)
            t[2].push(`<br>`)
            t[3].push(`<br>`)
            t[4].push(`${o.quantity}${(o.accessory.trim().toLowerCase().includes("battery") || o.accessory.trim().toLowerCase().includes("batteries"))?" Strips":""}<br>`)
            t[5].push(`${o.accessory_rate === 0 ? "Free" : o.accessory_rate + "/-"}<br>`)
            t[6].push(`${(o.quantity * o.accessory_rate) === 0 ? "Free" : (o.quantity * o.accessory_rate) + "/-"}<br>`)
            return t
        }, f)
    }

    f.forEach(x => {
        x.push(`<br><br><br>`)
    })

    f[5].push(`Final Amount : (Rs )`)

    return f.map((x, i, a) => {
        return `<td ${i !== a.length - 1 ? "rowspan='2'" : ""} class="text-nowrap" >${x.join("<br>")}</td>`
    }).join("")
}

const printAudiometryReport = (patient_name,age,sex,date,test_machine,left_ear_pta,right_ear_pta,lhl_text,rhl_text) => {

    let html = `
        <div class="container-fluid my-4 fw-bold">
            <div>
                <img src="/happy_ears_invoice_header.jpg" alt="header_image" style="width:85%;" >
            </div> 
            
            <div class="text-end  mx-4 mt-1" style="font-size:12px;"> Rajpur Sonarpur Branch : </div>
            <div class="text-end mx-4" style="font-size:12px;"> MAATARA APARTMENT </div>
            <div class="text-end mx-4" style="font-size:12px;">  
            
            121, N.S.C, Bose Road, RAJPUR, PIN-700149 

            </div>
            <div class="text-end mx-4" style="font-size:12px;"> Contact : 8100998309 / 310 </div>


            <h2 class="text-center text-decoration-underline text-primary m-2">Audiogram Hearing Aid Trial</h2>
            <div class="d-flex my-2">
                <span class="mx-2">Patient Name : </span>
                <span class="mx-2 flex-grow-1 border-bottom border-dark">${patient_name}</span>
                <span class="mx-2">Age/Sex :</span>
                <span class="mx-2 border-bottom border-dark">${age}/${sex[0].toUpperCase()}</span>
            </div>
            <div class="d-flex my-2">
                <span class="mx-2">Date: </span>
                <span class="mx-2 flex-grow-1 border-bottom border-dark">${date}<span>
            </div>

            <div class="row">
                <div class="col-6">
                    <div>
                        <canvas id="leftEarChart"></canvas>
                    </div>
                    <div>
                        <span>PTA (LT EAR) = </span>
                        <span class="border-bottom border-dark">${left_ear_pta} db Hz</span>
                    </div>
                    <div>
                        <span>Degree of Hearing Loss: </span>
                        <span>${lhl_text}</span>
                    </div>
                </div>
                <div class="col-6">
                    <div>
                        <canvas id="rightEarChart"></canvas>
                    </div>
                    <div>
                        <span>PTA (RT EAR) = </span>
                        <span class="border-bottom border-dark">${right_ear_pta} db Hz</span>
                    </div>
                    <div>
                        <span>Degree of Hearing Loss: </span>
                        <span>${rhl_text}</span>
                    </div>
                </div>
            </div>

            <div>
                <span>Test Machine</span>
                <span>${test_machine}</span>
            </div>

            <div>
                <span>Disclaimer : </span>
                <span class="text-danger">This is just a trial report based on patient response. This cannot be or should not be treated as medical audiogram report(PTA)</span>
            </div>
                
        </div>
    `

    let nw = window.open()
    nw.document.head.innerHTML = `
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script defer>
        new Chart(document.getElementById('leftEarChart'), {
            type: 'bar',
            data: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
    `
    nw.document.body.innerHTML = html
    nw.print()
}

export { printAudiometryReport }