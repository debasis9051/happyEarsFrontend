import React, { useState, useEffect } from "react"
import moment from "moment"
import Select from "react-select"
import Swal from "sweetalert2"
import axios from "axios";
import { ToWords } from 'to-words';

import { getProductList, getBranchList } from "../utils/getApis"

const GenerateInvoice = () => {

    const [productList, setProductList] = useState([])
    const [branchList, setBranchList] = useState([])

    const [patientName, setPatientName] = useState("")
    const [patientAddress, setPatientAddress] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [selectedBranch, setSelectedBranch] = useState(null)
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [date, setDate] = useState(moment().format("YYYY-MM-DD"))
    const [selectedModeOfPayment, setSelectedModeOfPayment] = useState({ label: "Cash", value: "Cash" })
    const [discountPercentage, setDiscountPercentage] = useState(0)
    const [discountAmount, setDiscountAmount] = useState(0)

    const [lineItems, setLineItems] = useState([{ product: null, product_data: null, product_type: null, product_rate: 0 }])
    const [accessoryItems, setAccessoryItems] = useState([{ accessory: "", quantity: 0, accessory_rate: 0 }])

    const [isSaveApiLoading, setIsSaveApiLoading] = useState(false)
    const [isInvoiceSaved, setIsInvoiceSaved] = useState(false)

    const dropDownStyle = {
        option: (styles) => {
            return {
                ...styles,
                color: 'black'
            };
        }
    }

    const getInvoiceNumber = (branch_id) => {
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-invoice-number`, {branch_id: branch_id}, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                if (res.data.operation === "success") {
                    setInvoiceNumber(res.data.info)
                }
                else {
                    Swal.fire('Oops!', res.data.message, 'error');
                }
            })
            .catch((err) => {
                console.log(err)
                Swal.fire('Error!!', err.message, 'error');
            })
    }

    useEffect(() => {
        getBranchList(setBranchList)
    }, [])

    useEffect(() => {
        setDiscountAmount(lineItems.reduce((p, o) => p + o.product_rate, 0) * discountPercentage / 100)
    }, [lineItems, discountPercentage])

    const verifyInvoice = () => {
        if (patientName === "") {
            Swal.fire('Oops!!', 'Patient name cannot be empty', 'warning');
            return false
        }
        if (patientAddress === "") {
            Swal.fire('Oops!!', 'Patient address cannot be empty', 'warning');
            return false
        }
        if (contactNumber === "") {
            Swal.fire('Oops!!', 'Contact Number cannot be empty', 'warning');
            return false
        }
        if (selectedBranch === null) {
            Swal.fire('Oops!!', 'Select a Branch', 'warning');
            return false
        }
        if (invoiceNumber === "") {
            Swal.fire('Oops!!', 'Invoice Number cannot be empty', 'warning');
            return false
        }
        if (date === "") {
            Swal.fire('Oops!!', 'Date cannot be empty', 'warning');
            return false
        }

        for (let i = 0; i < lineItems.length; i++) {
            if (lineItems[i].product === null) {
                Swal.fire('Oops!!', 'Line item product cannot be empty', 'warning');
                return false
            }
            if (lineItems[i].product_type === null) {
                Swal.fire('Oops!!', 'Line item product type cannot be empty', 'warning');
                return false
            }
        }

        for (let i = 0; i < accessoryItems.length; i++) {
            if ((accessoryItems[i].accessory !== "") && (accessoryItems[i].quantity <= 0)) {
                Swal.fire('Oops!!', 'Accessory item quantity cannot be empty', 'warning');
                return false
            }
        }

        return true
    }

    const saveInvoice = () => {

        let data = {
            patient_name: patientName,
            patient_address: patientAddress,
            contact_number: contactNumber,
            branch_id: selectedBranch.value,
            invoice_number: invoiceNumber,
            date: date,
            mode_of_payment: selectedModeOfPayment.value,
            discount_percentage: discountPercentage,
            discount_amount: discountAmount,
            line_items: lineItems.map(x => {
                return {
                    product_id: x.product_data.id,
                    product_name: x.product_data.product_name,
                    serial_number: x.product_data.serial_number,
                    product_type: x.product_type,
                    product_rate: x.product_rate
                }
            }),
            accessory_items: accessoryItems
        }

        setIsSaveApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/save-invoice`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsSaveApiLoading(false)

                if (res.data.operation === "success") {
                    Swal.fire('Success!', res.data.message, 'success');
                    setIsInvoiceSaved(true)
                }
                else {
                    Swal.fire('Oops!', res.data.message, 'error');
                }
            })
            .catch((err) => {
                console.log(err)
                Swal.fire('Error!!', err.message, 'error');
            })
    }

    const designParticulars = () => {
        let f = [[], [], [], [], [], [], []]

        f[0].push(`<br>`)
        f[1].push(`<span class="fw-bold">Products</span><br>`)
        f[2].push(`<br>`)
        f[3].push(`<br>`)
        f[4].push(`<br>`)
        f[5].push(`<br>`)
        f[6].push(`<br>`)

        f = lineItems.reduce((p, o, i) => {
            let t = p.map(x => { return [...x] })
            t[0].push(`${i + 1}<br><br>`)
            t[1].push(`${o.product_data.product_name}<br>S/N:-${o.product_data.serial_number}<br>`)
            t[2].push(`${o.product_data.manufacturer_name}<br><br>`)
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
        f[5].push(`Discount(${discountPercentage}%)<br>`)
        f[6].push(`${discountAmount}<br>`)

        if (accessoryItems.find(x => x.accessory !== "")) {
            f[0].push(`<br>`)
            f[1].push(`<span class="fw-bold">Accessories</span><br>`)
            f[2].push(`<br>`)
            f[3].push(`<br>`)
            f[4].push(`<br>`)
            f[5].push(`<br>`)
            f[6].push(`<br>`)

            f = accessoryItems.reduce((p, o, i) => {
                let t = p.map(x => { return [...x] })
                t[0].push(`${i + 1}<br>`)
                t[1].push(`${o.accessory}<br>`)
                t[2].push(`<br>`)
                t[3].push(`<br>`)
                t[4].push(`${o.quantity}<br>`)
                t[5].push(`${o.accessory_rate === 0 ? "Free" : o.accessory_rate + "/-"}<br>`)
                t[6].push(`${(o.quantity * o.accessory_rate) === 0 ? "Free" : (o.quantity * o.accessory_rate) + "/-"}<br>`)
                return t
            }, f)
        }

        f.forEach(x => {
            x.push(`<br><br><br><br><br><br>`)
        })

        f[5].push(`Final Amount`)

        return f.map((x, i, a) => {
            return `<td ${i !== a.length - 1 ? "rowspan='2'" : ""}>${x.join("<br>")}</td>`
        }).join("")
    }

    const printInvoice = () => {
        let toWords = new ToWords()
        let html = `
            <div class="container-fluid my-4">
                <div>
                    <img src="/happy_ears_invoice_header.jpg" alt="header_image" style="width:100%;" >
                </div>
                <div class="mt-5 text-end">Branch:- ${selectedBranch.label}</div>
                <table class="table table-bordered border-dark">
                    <tr>
                        <td colspan="3">Customer Name: ${patientName}</td>
                        <td colspan="4">Customer Address & Contact No.: <br>${patientAddress}<br>PHONE: ${contactNumber}</td>
                    </tr>
                    <tr>
                        <td colspan="2">Invoice No.: ${invoiceNumber}</td>
                        <td colspan="1">Date: ${date}</td>
                        <td colspan="4">Mode / Terms of Payment: <br>${selectedModeOfPayment.value} Payment</td>
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
                    ${designParticulars()}
                    </tr>
                    <tr>
                        <td>${(lineItems.reduce((p, o) => p + o.product_rate, 0) - discountAmount) + accessoryItems.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)}</td>
                    </tr>
                </table>
                <div class="d-flex justify-content-between">
                    <div>Amount: ${toWords.convert((lineItems.reduce((p, o) => p + o.product_rate, 0) - discountAmount) + accessoryItems.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)).toUpperCase()} ONLY<br><br>______________________________________________________________</div>
                    <div>E. & O.E.<br><br>For Happy Ears</div>
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

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center">
                <span className="fs-5 p-3">Generate Invoice</span>
                <div>
                    {/*
                        <button className="btn btn-info mx-2" onClick={() => { setImportProductModalShow(true) }}>Import</button>
                        <button className="btn btn-info mx-2" onClick={() => { console.log("exporting products") }}>Export</button>
                    */}
                </div>
            </div>

            <div className="container" style={{ marginBottom: "10rem" }}>

                <div className="row">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1 required" htmlFor="patientName">Patient Name</label>
                            <input type="text" id="patientName" className="form-control" value={patientName} onChange={(e) => { setPatientName(e.target.value) }} />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1 required" htmlFor="contactNumber">Contact Number</label>
                            <input type="text" id="contactNumber" className="form-control" value={contactNumber} onChange={(e) => { setContactNumber(e.target.value) }} />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12">
                        <div className="form-group">
                            <label className="form-label my-1 required" htmlFor="patientAddress">Patient Address</label>
                            <textarea id="patientAddress" rows={3} className="form-control" value={patientAddress} onChange={(e) => { setPatientAddress(e.target.value) }} />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1 required">Branch</label>
                            <Select
                                options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                                value={selectedBranch}
                                onChange={(val) => { setSelectedBranch(val); getInvoiceNumber(val.value); getProductList(setProductList, true, val.value) }}
                                styles={dropDownStyle}
                                placeholder="Select a Branch..."
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1 required" htmlFor="invoiceNumber">Invoice Number</label>
                            <input type="text" id="invoiceNumber" className="form-control" value={invoiceNumber} onChange={(e) => { setInvoiceNumber(e.target.value) }} />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1 required" htmlFor="date">Date</label>
                            <input type="date" id="date" className="form-control" value={date} onChange={(e) => { setDate(e.target.value) }} />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1 required">Mode of Payment</label>
                            <Select
                                options={["Cash", "Cheque", "Online"].map(x => ({ label: x, value: x }))}
                                value={selectedModeOfPayment}
                                onChange={(val) => { setSelectedModeOfPayment(val) }}
                                styles={dropDownStyle}
                                placeholder="Select Mode of Payment..."
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-3">
                    <label className="form-label my-1 required">Line Items</label>
                    <div className="row mb-2" style={{ fontSize: "smaller" }}>
                        <div className="col-md-4">
                            <label className="form-label my-1">Product</label>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label my-1">Product Type</label>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label my-1">Rate</label>
                        </div>
                        <div className="col-md-1"></div>
                    </div>

                    {
                        lineItems.map((x, i) => {
                            return (
                                <div key={i} className="row my-2">
                                    <div className="col-md-4">
                                        <Select
                                            options={productList.map(x => ({ label: x.product_name + " - " + x.serial_number, value: x.id }))}
                                            value={x.product}
                                            onChange={(val) => {
                                                if (lineItems.find(a => a.product?.value === val?.value)) {
                                                    Swal.fire('Oops!', "Duplicate item cannot be selected", 'error');
                                                    return
                                                }

                                                let pd = productList.find(a => a.id === val.value)
                                                let t = lineItems.map(a => { return { ...a } })
                                                t[i].product = val
                                                t[i].product_data = pd
                                                t[i].product_rate = pd.mrp
                                                setLineItems(t)
                                            }}
                                            styles={dropDownStyle}
                                            placeholder="Select a Product..."
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <Select
                                            options={["BTE", "RIC", "ITC", "CIC", "IIC"].map(x => ({ label: x, value: x }))}
                                            value={x.product_type == null ? null : { label: x.product_type, value: x.product_type }}
                                            onChange={(val) => {
                                                let t = lineItems.map(a => { return { ...a } })
                                                t[i].product_type = val.value
                                                setLineItems(t)
                                            }}
                                            styles={dropDownStyle}
                                            placeholder="Select Product Type..."
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <input type="number" className="form-control" value={x.product_rate.toString()}
                                            onChange={(e) => {
                                                let t = lineItems.map(a => { return { ...a } })
                                                t[i].product_rate = e.target.value === "" ? 0 : parseFloat(e.target.value)
                                                setLineItems(t)
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-1">
                                        {
                                            lineItems.length > 1 &&
                                            <button className="btn btn-outline-danger rounded-pill" onClick={() => {
                                                let t = lineItems.map(a => { return { ...a } })
                                                t.splice(i, 1)
                                                setLineItems(t)
                                            }}>
                                                <span className="text-danger">✖</span>
                                            </button>
                                        }
                                    </div>
                                </div>
                            )
                        })
                    }
                    <div className="row my-2">
                        <div className="col-md-2">
                            <button className="btn btn-primary" onClick={() => {
                                let t = lineItems.map(a => { return { ...a } })
                                t.push({ product: null, product_data: null, product_type: null, product_rate: 0 })
                                setLineItems(t)
                            }}>+ Add</button>
                        </div>
                        <div className="col-md-6 text-end my-auto">
                            <span>Products Total</span>
                        </div>
                        <div className="col-md-3 my-auto">
                            <span>{lineItems.reduce((p, o) => p + o.product_rate, 0)}</span>
                        </div>
                        <div className="col-md-1"></div>
                    </div>
                    <div className="row my-2">
                        <div className="col-md-6 text-end my-auto">
                            <span>Discount on Products</span>
                        </div>
                        <div className="col-md-2">
                            <input type="number" className="form-control" value={discountPercentage.toString()} onChange={(e) => { setDiscountPercentage(e.target.value === "" ? 0 : parseFloat(e.target.value)); }} />
                        </div>
                        <div className="col-md-3">
                            <input type="number" className="form-control" value={discountAmount.toString()}
                                onChange={(e) => {
                                    if (e.target.value === "") {
                                        setDiscountPercentage(0)
                                        setDiscountAmount(0)
                                    }
                                    else {
                                        setDiscountPercentage(parseFloat(e.target.value) * 100 / lineItems.reduce((p, o) => p + o.product_rate, 0));
                                        setDiscountAmount(parseFloat(e.target.value))
                                    }
                                }}
                            />
                        </div>
                        <div className="col-md-1"></div>
                    </div>

                    <div className="mt-3">
                        <label className="form-label my-1">Accessory Items</label>
                        <div className="row mb-2" style={{ fontSize: "smaller" }}>
                            <div className="col-md-4">
                                <label className="form-label my-1">Accessory</label>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label my-1">Quantity</label>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label my-1">Rate</label>
                            </div>
                            <div className="col-md-1"></div>
                        </div>

                        {
                            accessoryItems.map((x, i) => {
                                return (
                                    <div key={i} className="row my-2">
                                        <div className="col-md-4">
                                            <input type="text" className="form-control" value={x.accessory} placeholder="Enter an Accessory..."
                                                onChange={(e) => {
                                                    let t = accessoryItems.map(a => { return { ...a } })
                                                    t[i].accessory = e.target.value
                                                    setAccessoryItems(t)
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <input type="number" className="form-control" value={x.quantity.toString()}
                                                onChange={(e) => {
                                                    let t = accessoryItems.map(a => { return { ...a } })
                                                    t[i].quantity = e.target.value === "" ? 0 : parseFloat(e.target.value)
                                                    setAccessoryItems(t)
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <input type="number" className="form-control" value={x.accessory_rate.toString()}
                                                onChange={(e) => {
                                                    let t = accessoryItems.map(a => { return { ...a } })
                                                    t[i].accessory_rate = e.target.value === "" ? 0 : parseFloat(e.target.value)
                                                    setAccessoryItems(t)
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-1">
                                            {
                                                accessoryItems.length > 1 &&
                                                <button className="btn btn-outline-danger rounded-pill" onClick={() => {
                                                    let t = accessoryItems.map(a => { return { ...a } })
                                                    t.splice(i, 1)
                                                    setAccessoryItems(t)
                                                }}>
                                                    <span className="text-danger">✖</span>
                                                </button>
                                            }
                                        </div>
                                    </div>
                                )
                            })
                        }
                        <div className="row my-2">
                            <div className="col-md-2">
                                <button className="btn btn-primary" onClick={() => {
                                    let t = accessoryItems.map(a => { return { ...a } })
                                    t.push({ accessory: "", quantity: 0, accessory_rate: 0 })
                                    setAccessoryItems(t)
                                }}>+ Add</button>
                            </div>
                            <div className="col-md-6 text-end my-auto">
                                <span>Accessory Total</span>
                            </div>
                            <div className="col-md-3 my-auto">
                                <span>{accessoryItems.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)}</span>
                            </div>
                            <div className="col-md-1"></div>
                        </div>
                        <div className="row my-2" style={{ fontSize: "larger" }}>
                            <div className="col-md-8 text-end my-auto">
                                <span>Grand Total</span>
                            </div>
                            <div className="col-md-3 my-auto">
                                <span>{(lineItems.reduce((p, o) => p + o.product_rate, 0) - discountAmount) + accessoryItems.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)}</span>
                            </div>
                            <div className="col-md-1"></div>
                        </div>

                    </div>

                    <button className="btn btn-primary my-3 mx-1" disabled={isSaveApiLoading}
                        onClick={() => {
                            if (verifyInvoice() && !isSaveApiLoading) {
                                Swal.fire({
                                    title: "Are you sure?",
                                    showCancelButton: true,
                                    confirmButtonText: "Save",
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        saveInvoice()
                                    }
                                });
                            }
                        }}
                    > {isSaveApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : 'Save Invoice'} </button>
                    <button className="btn btn-primary my-3 mx-1"
                        onClick={() => {
                            if (verifyInvoice()) {
                                if (!isInvoiceSaved) {
                                    Swal.fire({
                                        title: "This Invoice is not saved yet. Are you sure?",
                                        showCancelButton: true,
                                        confirmButtonText: "Print",
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            printInvoice()
                                        }
                                    });
                                }
                                else {
                                    printInvoice()
                                }
                            }
                        }}
                    >Print</button>
                </div>
            </div>
        </div>
    )
}

export default GenerateInvoice