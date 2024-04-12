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

const printAudiometryReport = (patient_name,patient_address,contact_number,test_machine,left_ear_pta,right_ear_pta) => {
    
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


            
            <table class="table table-bordered border-dark" style="font-weight: bold; text-align:center;">
                <tr>
                    <td colspan="3">Customer Name: ${patient_name}</td>
                    <td colspan="4">Customer Address & Contact No.: <br>${patient_address}<br>PHONE: ${contact_number}</td>
                </tr>
                <tr>
                    <td colspan="7"></td>
                </tr>
                <tr>
                    <td>Sl No.</td>
                    <td>Particulars</td>
                    <td>Manufacturer</td>
                    <td>Type</td>
                    <td>Quantity</td>
                    <td>Rate</td>
                    <td>Amount</td>
                </tr>   
                
            </table>
            
        </div>
    `

    let nw = window.open()
    nw.document.head.innerHTML = `
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    `
    nw.document.body.innerHTML = html
    nw.print()
}

export { printAudiometryReport }