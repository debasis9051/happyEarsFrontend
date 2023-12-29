import React, { useState, useEffect } from "react"
import moment from "moment"
import Select from "react-select"
import Swal from "sweetalert2"

import { getProductList } from "../utils/getApis"

const GenerateInvoice = () => {

    const [productList, setProductList] = useState([])

    const [patientName, setPatientName] = useState("")
    const [patientAddress, setPatientAddress] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [date, setDate] = useState(moment().format("YYYY-MM-DD"))
    const [selectedModeOfPayment, setSelectedModeOfPayment] = useState({ label: "Cash", value: "Cash" })

    const [lineItems, setLineItems] = useState([{ product: null, product_data: null, product_type: null, product_rate: 0 }])
    const [accessoryItems, setAccessoryItems] = useState([{ accessory: "", quantity: 0, accessory_rate: 0 }])

    const dropDownStyle = {
        option: (styles) => {
            return {
                ...styles,
                color: 'black'
            };
        }
    }

    useEffect(() => {
        getProductList(setProductList, true)
    }, [])

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center">
                <span className="fs-5 p-3">Generate Invoice</span>
                {/* 
                    <div>
                        <button className="btn btn-info mx-2" onClick={() => { setImportProductModalShow(true) }}>Import</button>
                        <button className="btn btn-info mx-2" onClick={() => { console.log("exporting products") }}>Export</button>
                    </div>
                */}
            </div>

            <div className="container">

                <div className="row">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1" htmlFor="patientName">Patient Name</label>
                            <input type="text" id="patientName" className="form-control" value={patientName} onChange={(e) => { setPatientName(e.target.value) }} />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1" htmlFor="contactNumber">Contact Number</label>
                            <input type="text" id="contactNumber" className="form-control" value={contactNumber} onChange={(e) => { setContactNumber(e.target.value) }} />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12">
                        <div className="form-group">
                            <label className="form-label my-1" htmlFor="patientAddress">Patient Address</label>
                            <textarea id="patientAddress" rows={3} className="form-control" value={patientAddress} onChange={(e) => { setPatientAddress(e.target.value) }} />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1" htmlFor="invoiceNumber">Invoice Number</label>
                            <input type="text" id="invoiceNumber" className="form-control" value={invoiceNumber} onChange={(e) => { setInvoiceNumber(e.target.value) }} />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1" htmlFor="date">Date</label>
                            <input type="date" id="date" className="form-control" value={date} onChange={(e) => { setDate(e.target.value) }} />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="form-label my-1">Mode of Payment</label>
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
                    <label className="form-label my-1">Line Items</label>
                    <div className="row mb-2" style={{fontSize:"smaller"}}>
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
                                                t[i].product_rate = e.target.value == "" ? 0 : parseFloat(e.target.value)
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
                </div>
                <button className="btn btn-primary" onClick={() => {
                    let t = lineItems.map(a => { return { ...a } })
                    t.push({ product: null, product_data: null, product_type: "", product_rate: 0 })
                    setLineItems(t)
                }}>+ Add</button>


                <div className="mt-3">
                    <label className="form-label my-1">Accessory Items</label>
                    <div className="row mb-2" style={{fontSize:"smaller"}}>
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
                                        <input type="text" className="form-control" value={x.accessory}
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
                                                t[i].quantity = e.target.value == "" ? 0 : parseFloat(e.target.value)
                                                setAccessoryItems(t)
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <input type="number" className="form-control" value={x.accessory_rate.toString()}
                                            onChange={(e) => {
                                                let t = accessoryItems.map(a => { return { ...a } })
                                                t[i].accessory_rate = e.target.value == "" ? 0 : parseFloat(e.target.value)
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
                </div>
                <button className="btn btn-primary" onClick={() => {
                    let t = accessoryItems.map(a => { return { ...a } })
                    t.push({ accessory: "", quantity: 0, accessory_rate: 0 })
                    setAccessoryItems(t)
                }}>+ Add</button>

            </div>
        </div>
    )
}

export default GenerateInvoice