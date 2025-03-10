import React, { useState, useEffect } from "react"
import moment from "moment"
import Select from "react-select"
import Swal from "sweetalert2"
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { useFirebase } from "../contexts/firebase-context";
import { useModal } from "../contexts/modal-context";
import { getProductList, getBranchList, getSalespersonList, getPatientList } from "../utils/getApis"
import { printInvoice } from "../utils/printInvoice"
import AuthWrapper from "./AuthWrapper";
import { dropDownStyle } from "../utils/commonUtils";


const GenerateInvoice = () => {
    const { currentUserInfo } = useFirebase()
    const { openModal, setModalView, setModalData } = useModal()

    const navigate = useNavigate()
    const { audiometryId } = useParams()

    const [branchList, setBranchList] = useState([])
    const [salespersonList, setSalespersonList] = useState([])
    const [productList, setProductList] = useState([])
    const [patientList, setPatientList] = useState([])

    const [selectedBranch, setSelectedBranch] = useState(null)
    const [date, setDate] = useState(moment().format("YYYY-MM-DD"))
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [selectedModeOfPayment, setSelectedModeOfPayment] = useState({ label: "Cash", value: "Cash" })
    const [selectedSalesperson, setSelectedSalesperson] = useState(null)
    const [discountAmount, setDiscountAmount] = useState(0)

    const [lineItems, setLineItems] = useState([{ product: null, product_data: null, product_type: null, product_rate: 0 }])
    const [accessoryItems, setAccessoryItems] = useState([{ accessory: "", quantity: 0, accessory_rate: 0 }])

    const [isSaveApiLoading, setIsSaveApiLoading] = useState(false)
    const [isInvoiceSaved, setIsInvoiceSaved] = useState(false)


    const filteredProductList = selectedBranch ? productList.filter(x => x.instock).filter(x => x.branch_id === selectedBranch.value) : []


    const getInvoiceNumber = (branch_id, date) => {
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-invoice-number`, { branch_id: branch_id, date: date, current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
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
        if (currentUserInfo !== null) {
            getBranchList(currentUserInfo, setBranchList)
            getSalespersonList(currentUserInfo, setSalespersonList)
            getProductList(currentUserInfo, setProductList)
            getPatientList(currentUserInfo, setPatientList)
        }
    }, [currentUserInfo])

    useEffect(() => {
        if (!currentUserInfo || !audiometryId || !patientList.length) return;

        const fetchData = async () => {
            try {
                // Fetch audiometry report
                const audiometryResponse = await axios.post(
                    `${process.env.REACT_APP_BACKEND_ORIGIN}/get-audiometry-report-by-id`,
                    {
                        audiometry_report_id: audiometryId,
                        current_user_uid: currentUserInfo.uid,
                        current_user_name: currentUserInfo.displayName,
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                    }
                );

                if (audiometryResponse.data.operation === "success") {
                    setSelectedPatient({ label: patientList.find(p => p.id === audiometryResponse.data.info.patient_id).patient_name, value: audiometryResponse.data.info.patient_id })
                } else {
                    Swal.fire('Oops!', audiometryResponse.data.message, 'error');
                    navigate("/generate-invoice");
                    return;
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error!!', error.message, 'error');
            }
        };

        fetchData();
    }, [currentUserInfo, audiometryId, patientList, navigate])


    const verifyInvoice = () => {
        if (selectedBranch === null) {
            Swal.fire('Oops!!', 'Select a Branch', 'warning');
            return false
        }
        if (date === "") {
            Swal.fire('Oops!!', 'Date cannot be empty', 'warning');
            return false
        }
        if (selectedPatient === null) {
            Swal.fire('Oops!!', 'Select a Patient', 'warning');
            return false
        }
        if (invoiceNumber === "") {
            Swal.fire('Oops!!', 'Invoice Number cannot be empty', 'warning');
            return false
        }
        if (selectedSalesperson === null) {
            Swal.fire('Oops!!', 'Select a Salesperson', 'warning');
            return false
        }
        if (currentUserInfo === null) {
            Swal.fire('Oops!!', 'Sign in first to use feature!', 'warning');
            return
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
            branch_id: selectedBranch.value,
            date: date,
            patient_id: selectedPatient.value,
            invoice_number: invoiceNumber,
            mode_of_payment: selectedModeOfPayment.value,
            salesperson_id: selectedSalesperson.value,
            discount_amount: discountAmount,
            line_items: lineItems.map(x => {
                return {
                    product_id: x.product_data.id,
                    product_name: x.product_data.product_name,
                    manufacturer_name: x.product_data.manufacturer_name,
                    serial_number: x.product_data.serial_number,
                    product_type: x.product_type,
                    product_rate: x.product_rate
                }
            }),
            accessory_items: accessoryItems,
            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName
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

    return (
        <>
            <Helmet>
                <meta name="description" content="Happy Ears Kolkata is a React-powered app for efficient hearing care management, offering seamless invoice creation, inventory control, and secure patient data storage with integrated location tracking, created by Hritwick De. Invoicing page where invoices with products can be created for the customers of the business" />
                <title>Generate Invoice | Happy Ears Kolkata Invoicing</title>
            </Helmet>

            <div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fs-3 px-3 pt-3">Generate Invoice</span>
                </div>

                <AuthWrapper page={"generate_invoice"}>
                    <div className="mx-5">
                        <div className="row">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label className="form-label my-1 required">Branch</label>
                                    <Select
                                        options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                                        value={selectedBranch}
                                        onChange={(val) => { setSelectedBranch(val); getInvoiceNumber(val.value, date); setLineItems([{ product: null, product_data: null, product_type: null, product_rate: 0 }]) }}
                                        styles={dropDownStyle}
                                        placeholder="Select a Branch..."
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="date">Date</label>
                                    <input type="date" id="date" className="form-control" value={date}
                                        onChange={(e) => {
                                            if (!moment(e.target.value).isValid()) {
                                                Swal.fire('Oops!', "Enter a valid date", 'warning');
                                                return
                                            }

                                            setDate(e.target.value);
                                            if (selectedBranch) {
                                                getInvoiceNumber(selectedBranch.value, e.target.value);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="col-4 d-flex gap-2">
                                <div className="form-group flex-grow-1">
                                    <label className="form-label my-1 required">Patient</label>
                                    <Select
                                        options={patientList.map(x => ({ label: x.patient_name, value: x.id }))}
                                        value={selectedPatient}
                                        onChange={(val) => { setSelectedPatient(val); }}
                                        styles={dropDownStyle}
                                        placeholder="Select a Patient..."
                                    />
                                </div>
                                <div className="align-self-end">
                                    <button className="btn btn-success p-1" title="Add Patient"
                                        onClick={() => {
                                            setModalView("PATIENT_MODAL");
                                            setModalData({
                                                currentUserInfo,
                                                apiEndCallback: (responseData) => {
                                                    getPatientList(currentUserInfo, setPatientList);
                                                    setSelectedPatient({ label: responseData.patient_name, value: responseData.patient_id });
                                                }
                                            });
                                            openModal()
                                        }}
                                    >
                                        <svg width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="invoiceNumber">Invoice Number</label>
                                    <input type="text" id="invoiceNumber" className="form-control" value={invoiceNumber} onChange={(e) => { setInvoiceNumber(e.target.value) }} />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label className="form-label my-1 required">Mode of Payment</label>
                                    <Select
                                        options={["Cash", "Cheque", "Online", "Card", "Bajaj Finance"].map(x => ({ label: x, value: x }))}
                                        value={selectedModeOfPayment}
                                        onChange={(val) => { setSelectedModeOfPayment(val) }}
                                        styles={dropDownStyle}
                                        placeholder="Select Mode of Payment..."
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label className="form-label my-1 required">Salesperson</label>
                                    <Select
                                        options={salespersonList.map(x => ({ label: x.salesperson_name, value: x.id }))}
                                        value={selectedSalesperson}
                                        onChange={(val) => { setSelectedSalesperson(val) }}
                                        styles={dropDownStyle}
                                        placeholder="Select Salesperson..."
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
                                                    options={filteredProductList.map(x => ({ label: x.product_name + " - " + x.serial_number, value: x.id }))}
                                                    value={x.product}
                                                    onChange={(val) => {
                                                        if (lineItems.find(a => a.product?.value === val?.value)) {
                                                            Swal.fire('Oops!', "Duplicate item cannot be selected", 'error');
                                                            return
                                                        }

                                                        let pd = filteredProductList.find(a => a.id === val.value)
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
                                                    options={["BTE", "BTE-R", "RIC", "RIC-R", "ITC", "ITC-R", "CIC", "IIC", "Charger"].map(x => ({ label: x, value: x }))}
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
                                                        <span className="">✖</span>
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
                                <div className="col-md-5">
                                    <input type="number" className="form-control" value={discountAmount.toString()} onChange={(e) => { setDiscountAmount(e.target.value === "" ? 0 : parseFloat(e.target.value)) }} />
                                </div>
                                <div className="col-md-1"></div>
                            </div>

                            <div className="mt-3">
                                <label className="form-label my-1">Accessory Items<span className="fw-bold ms-5">**To apply "strips" during print, write "Battery" and no. of strips **</span></label>
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
                                                    {(x.accessory.trim().toLowerCase().includes("battery") || x.accessory.trim().toLowerCase().includes("batteries")) && <div style={{ fontSize: "smaller", color: "dimgray" }}>strips</div>}
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
                                                            <span className="">✖</span>
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
                                        let t = lineItems.map(x => {
                                            return {
                                                product_id: x.product_data.id,
                                                product_name: x.product_data.product_name,
                                                manufacturer_name: x.product_data.manufacturer_name,
                                                serial_number: x.product_data.serial_number,
                                                product_type: x.product_type,
                                                product_rate: x.product_rate
                                            }
                                        })

                                        setModalView("PRINT_CONFIG_MODAL");
                                        setModalData({
                                            submitCallback: (printConfigData) => {
                                                let patientDetails = patientList.find(p => p.id === selectedPatient.value)

                                                if (!isInvoiceSaved) {
                                                    Swal.fire({
                                                        title: "This Invoice is not saved yet. Are you sure?",
                                                        showCancelButton: true,
                                                        confirmButtonText: "Print",
                                                    }).then((result) => {
                                                        if (result.isConfirmed) {
                                                            printInvoice(patientDetails, selectedBranch.value, invoiceNumber, moment(date).format("DD-MM-YYYY"), selectedModeOfPayment.value, discountAmount, t, accessoryItems, printConfigData, branchList)
                                                        }
                                                    });
                                                }
                                                else {
                                                    printInvoice(patientDetails, selectedBranch.value, invoiceNumber, moment(date).format("DD-MM-YYYY"), selectedModeOfPayment.value, discountAmount, t, accessoryItems, printConfigData, branchList)
                                                }
                                            }
                                        })
                                        openModal()
                                    }
                                }}
                            >Print</button>
                        </div>
                    </div>
                </AuthWrapper>

            </div>
        </>
    )
}

export default GenerateInvoice