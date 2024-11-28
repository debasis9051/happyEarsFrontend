import { ToWords } from 'to-words';
import { formatPatientNumber } from './commonUtils';

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

const printInvoice = ({patient_name, patient_number, patient_address, contact_number}, branch_name, branch_id, invoice_number, date, mode_of_payment, discount_amount, line_items, accessory_items, headerVisible, branchList) => {

    let header_image = "/happy_ears_invoice_header_" + branch_name.toLowerCase() + ".png"

    let toWords = new ToWords()
    let html = `
        <div class="container-fluid position-relative my-4 fw-bold" style="height:90%;">
            <div>
                <img src="${headerVisible ? header_image : "/happy_ears_invoice_header_empty.jpg"}" alt="header_image" style="width:100%;" >
            </div> 

            <div class="mt-2 text-end mx-4">Branch:- ${branch_name}</div>
            
            <table class="table table-bordered border-dark" style="font-weight: bold; text-align:center;">
                <tr>
                    <td colspan="3">
                        Customer Name: ${patient_name}<br>
                        Patient Number: ${formatPatientNumber(patient_number)}
                    </td>
                    <td colspan="4">Customer Address & Contact No.: <br>${patient_address}<br>PHONE: ${contact_number}</td>
                </tr>
                <tr>
                    <td colspan="2">Invoice No.: ${invoice_number}</td>
                    <td colspan="1">Date: ${date}</td>
                    <td colspan="4">Mode / Terms of Payment: <br>${mode_of_payment} Payment</td>
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
                <tr>
                ${designParticulars(discount_amount,line_items,accessory_items)}
                </tr>
                <tr>
                    <td>${(line_items.reduce((p, o) => p + o.product_rate, 0) - discount_amount) + accessory_items.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)}</td>
                </tr>
            </table>

            <div class="d-flex justify-content-between">
                <h5 class="text-decoration-underline" style="max-width:450px;">Amount: ${toWords.convert((line_items.reduce((p, o) => p + o.product_rate, 0) - discount_amount) + accessory_items.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)).toUpperCase()} ONLY</h5>
                <div>E. & O.E.<br>For Happy Ears Kolkata</div>
            </div>

            <div class="position-absolute w-100" style="bottom:-82px; border-top:solid 1px black;">
                <div class="d-flex">Branches:
                    <div class="d-flex justify-content-around flex-grow-1">
                        ${branchList.filter(x=> x.id !== branch_id && x.branch_name !== "Ranikuthi").map(x=>`<span>
                            <svg width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>
                            ${x.branch_name}
                        </span>`).join("")}
                    </div>
                </div>
                <div class="text-center" >Copyright © 2024 Happy Ears Kolkata</div>
            </div>
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

export { printInvoice }