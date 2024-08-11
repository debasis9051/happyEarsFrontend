import React, { useState, useEffect } from "react"
import { Modal, Button, Dropdown } from "react-bootstrap"
import Select from "react-select"
import moment from "moment"
import Swal from "sweetalert2"
import axios from "axios";
import { ResponsivePie } from '@nivo/pie'

import { useFirebase } from "../contexts/firebase-context";
import { getInvoiceList, getBranchList, getSalespersonList } from "../utils/getApis"
import { printInvoice } from "../utils/printInvoice"
import AuthWrapper from "./AuthWrapper";
import NewFeatureModal from "./NewFeatureModal"

const SalesReport = () => {
    const { currentUserInfo } = useFirebase()

    const [branchList, setBranchList] = useState([])
    const [salespersonList, setSalespersonList] = useState([])
    const [invoiceList, setInvoiceList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [branchFilter, setBranchFilter] = useState(null)
    const [salespersonFilter, setSalespersonFilter] = useState({ label: "All", value: "All" })

    const [reportMonthYear, setReportMonthYear] = useState("")


    const [editInvoiceModalShow, setEditInvoiceModalShow] = useState(false)
    const [invoiceData, setInvoiceData] = useState(null)
    const [patientName, setPatientName] = useState("")
    const [patientAddress, setPatientAddress] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [date, setDate] = useState(moment().format("YYYY-MM-DD"))
    const [selectedModeOfPayment, setSelectedModeOfPayment] = useState({ label: "Cash", value: "Cash" })
    const [selectedSalesperson, setSelectedSalesperson] = useState(null)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [accessoryItems, setAccessoryItems] = useState([{ accessory: "", quantity: 0, accessory_rate: 0 }])
    const [isSaveApiLoading, setIsSaveApiLoading] = useState(false)


    const filteredInvoiceList = branchFilter ? invoiceList.filter(x => x.branch_id === branchFilter.value).filter(x => salespersonFilter.value === "All" ? true : x.salesperson_id === salespersonFilter.value).filter(x => {
        if (searchBarState && searchValue !== "") {
            if (((new RegExp(searchValue, "gi")).test(x.patient_name)) || ((new RegExp(searchValue, "gi")).test(x.contact_number)) || ((new RegExp(searchValue, "gi")).test(x.invoice_number)) || ((new RegExp(searchValue, "gi")).test(x.mode_of_payment))) {
                return true
            }
            return false
        }
        else {
            return true
        }
    }) : []


    const reportData = []
    if (reportMonthYear) {
        let sd = moment(reportMonthYear)
        let ed = moment(reportMonthYear).add(1, "month")

        for (let i = 0; i < invoiceList.length; i++) {
            let invData = invoiceList[i]
            let d = moment.unix(invData.date._seconds)

            let gt = (invData.line_items.reduce((p, o) => p + o.product_rate, 0) - invData.discount_amount) + invData.accessory_items.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)

            if (d.isBetween(sd, ed)) {

                let t = reportData.find(x => x.salesperson_id === invData?.salesperson_id)

                if (t) {
                    t.no_of_invoices += 1
                    t.no_of_products_sold += invData.line_items.filter(x => !(x.product_name.toLowerCase().includes("charger") || x.product_name.toLowerCase().includes("chgr"))).length
                    t.net_total += gt
                }
                else {
                    reportData.push({
                        salesperson_id: invData?.salesperson_id,
                        salesperson_name: invData?.salesperson_id && salespersonList.find(x => x.id === invData.salesperson_id).salesperson_name,
                        no_of_invoices: 1,
                        no_of_products_sold: invData.line_items.length,
                        net_total: gt,
                    })
                }
            }
        }
    }

    const dropDownStyle = {
        option: (styles) => {
            return {
                ...styles,
                color: 'black'
            };
        },
        menu: (styles) => {
            return {
                ...styles,
                minWidth: "max-content"
            };
        }
    }

    useEffect(() => {
        if (currentUserInfo !== null) {
            getBranchList(currentUserInfo, setBranchList)
            getSalespersonList(currentUserInfo, setSalespersonList)
            getInvoiceList(currentUserInfo, setInvoiceList)
        }
    }, [currentUserInfo])

    useEffect(() => {
        if (branchList.length > 0) {
            let b = branchList.find(x => x.branch_invoice_code === "RANI")
            setBranchFilter({ label: b.branch_name, value: b.id })
        }
    }, [branchList])

    let tp = Math.ceil(filteredInvoiceList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    const editInvoiceModalInit = (invoice_data) => {
        setEditInvoiceModalShow(true)

        setInvoiceData(invoice_data)
        setPatientName(invoice_data.patient_name)
        setPatientAddress(invoice_data.patient_address)
        setContactNumber(invoice_data.contact_number)
        setDate(moment.unix(invoice_data.date._seconds).format("YYYY-MM-DD"))
        setSelectedModeOfPayment({ label: invoice_data.mode_of_payment, value: invoice_data.mode_of_payment })
        if (invoice_data.salesperson_id) {
            let t = salespersonList.find(x => x.id === invoice_data.salesperson_id)
            setSelectedSalesperson({ label: t.salesperson_name, value: t.id })
        }
        setDiscountAmount(invoice_data.discount_amount)
        setAccessoryItems(invoice_data.accessory_items)
    }

    const updateInvoice = () => {

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
        if (date === "") {
            Swal.fire('Oops!!', 'Date cannot be empty', 'warning');
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

        for (let i = 0; i < accessoryItems.length; i++) {
            if ((accessoryItems[i].accessory !== "") && (accessoryItems[i].quantity <= 0)) {
                Swal.fire('Oops!!', 'Accessory item quantity cannot be empty', 'warning');
                return false
            }
        }

        let data = {
            patient_name: patientName,
            patient_address: patientAddress,
            contact_number: contactNumber,
            date: date,
            mode_of_payment: selectedModeOfPayment.value,
            salesperson_id: selectedSalesperson.value,
            discount_amount: discountAmount,
            accessory_items: accessoryItems,
            invoice_id: invoiceData.id,
            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName
        }

        setIsSaveApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/update-invoice`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsSaveApiLoading(false)

                if (res.data.operation === "success") {
                    Swal.fire('Success!', res.data.message, 'success');
                    handleEditInvoiceModalClose()
                    getInvoiceList(currentUserInfo, setInvoiceList)
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

    const handleEditInvoiceModalClose = () => {
        setEditInvoiceModalShow(false)

        setInvoiceData(null)
        setPatientName("")
        setPatientAddress("")
        setContactNumber("")
        setDate(moment().format("YYYY-MM-DD"))
        setSelectedModeOfPayment({ label: "Cash", value: "Cash" })
        setSelectedSalesperson(null)
        setDiscountAmount(0)
        setAccessoryItems([{ accessory: "", quantity: 0, accessory_rate: 0 }])
    }

    return (
        <>
            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Sales Report</span>
                </div>

                <AuthWrapper page={"sales_report"}>
                    <>
                        <div className="d-flex align-items-end px-3 py-2">
                            <label className="form-label m-0 me-2 fs-5">Filters: </label>
                            <div className="form-group mx-1">
                                <label className="form-label m-0">Branch</label>
                                <Select
                                    options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                                    value={branchFilter}
                                    onChange={(val) => { setBranchFilter(val); setCurrentPage(0); }}
                                    styles={dropDownStyle}
                                    placeholder="Select a Branch..."
                                />
                            </div>
                            <div className="form-group mx-1">
                                <label className="form-label m-0">Salesperson</label>
                                <Select
                                    options={[{ label: "All", value: "All" }, ...salespersonList.map(x => ({ label: x.salesperson_name, value: x.id }))]}
                                    value={salespersonFilter}
                                    onChange={(val) => { setSalespersonFilter(val); setCurrentPage(0); }}
                                    styles={dropDownStyle}
                                    placeholder="Select Salesperson..."
                                />
                            </div>
                            <div className="d-flex mx-2">
                                <button className="btn btn-secondary rounded-pill me-1" onClick={() => { setSearchBarState(!searchBarState); setSearchValue("") }}>
                                    <svg width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                    </svg>
                                </button>
                                <input type="text" className="form-control" style={searchBarState ? { transition: "all 1s" } : { transition: "all 1s", width: "0", padding: "0", opacity: "0", visibility: "hidden" }} placeholder="Search..." onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(0); }} />
                            </div>

                            <button className="btn btn-info ms-auto me-2" onClick={() => { Swal.fire('Oops!!', 'This feature is not ready yet', 'warning'); console.log("exporting products"); }}>Export</button>
                        </div>

                        <table className="table table-hover m-auto align-middle" style={{ width: "97%" }}>
                            <thead>
                                <tr className="table-dark">
                                    <th scope="col">Sl. No.</th>
                                    <th scope="col">Patient Name</th>
                                    <th scope="col">Contact Number</th>
                                    <th scope="col">Invoice Number</th>
                                    <th scope="col">Invoice Amount</th>
                                    <th scope="col">Mode of Payment</th>
                                    <th scope="col">Salesperson</th>
                                    <th scope="col">Invoice Date</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    filteredInvoiceList.length === 0 ? <tr><td colSpan={8} className="fs-4 text-center text-secondary">No invoices added</td></tr> :
                                        filteredInvoiceList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                            return (
                                                <tr key={i} className={i % 2 ? "table-secondary" : "table-light"}>
                                                    <td>{(currentPage * 10) + i + 1}</td>
                                                    <td>{x.patient_name}</td>
                                                    <td>{x.contact_number}</td>
                                                    <td>{x.invoice_number}</td>
                                                    <td>{(x.line_items.reduce((p, o) => p + o.product_rate, 0) - x.discount_amount) + x.accessory_items.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)}</td>
                                                    <td>{x.mode_of_payment}</td>
                                                    <td>{x?.salesperson_id ? salespersonList.find(y => y.id === x.salesperson_id).salesperson_name : "N/A"}</td>
                                                    <td>{moment.unix(x.date._seconds).format("DD-MM-YYYY")}</td>
                                                    <td>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="primary">
                                                                <svg width="16" height="16" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                                                                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                                                                </svg>
                                                            </Dropdown.Toggle>

                                                            <Dropdown.Menu>
                                                                <Dropdown.Item onClick={() => { editInvoiceModalInit(x) }} >Edit</Dropdown.Item>
                                                                <Dropdown.Item onClick={() => {
                                                                    Swal.fire({
                                                                        title: "Print with Header On/Off?",
                                                                        showDenyButton: true,
                                                                        showCancelButton: true,
                                                                        confirmButtonText: "On",
                                                                        denyButtonText: `Off`
                                                                    }).then((result) => {
                                                                        let h = result.isConfirmed ? true : result.isDenied ? false : null

                                                                        if (h !== null) {
                                                                            printInvoice(x.patient_name, x.patient_address, x.contact_number, branchList.find(b => b.id === x.branch_id).branch_name, x.invoice_number, moment.unix(x.date._seconds).format("DD-MM-YYYY"), x.mode_of_payment, x.discount_amount, x.line_items, x.accessory_items, h)
                                                                        }
                                                                    });
                                                                }} >Print</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                }
                            </tbody>
                            {
                                filteredInvoiceList.length !== 0 &&
                                <tfoot>
                                    <tr>
                                        <td colSpan={9}>
                                            <div className="d-flex justify-content-center">
                                                <ul className="pagination m-0">
                                                    {
                                                        currentPage + 1 !== 1 &&
                                                        <li className="page-item" onClick={() => { setCurrentPage(currentPage - 1) }}>
                                                            <div className="page-link" style={{ cursor: "pointer" }} >&laquo;</div>
                                                        </li>
                                                    }
                                                    {
                                                        Array.from({ length: e - s + 1 }, (_, i) => i + s).map((x, i) => {
                                                            return (
                                                                <li key={i} className={`page-item ${x - 1 === currentPage ? "active" : ""}`} onClick={() => { setCurrentPage(x - 1) }}>
                                                                    <div className="page-link" style={{ cursor: "pointer" }} >{x}</div>
                                                                </li>
                                                            )
                                                        })
                                                    }
                                                    {
                                                        currentPage + 1 !== tp &&
                                                        <li className="page-item" onClick={() => { setCurrentPage(currentPage + 1) }}>
                                                            <div className="page-link" style={{ cursor: "pointer" }} >&raquo;</div>
                                                        </li>
                                                    }
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            }
                        </table>

                        <div className="container my-5 p-3 rounded text-white" >
                            <div className="row g-0">
                                <div className="col-md-2 mx-2 text-end">
                                    <label className="form-label my-1 text-white" style={{ fontSize: "larger" }} htmlFor="reportMonthYear">Select Month</label>
                                </div>
                                <div className="col-md-4 mx-2">
                                    <input type="month" id="reportMonthYear" className="form-control" value={reportMonthYear} onChange={(e) => { setReportMonthYear(e.target.value); setTimeout(() => { window.scrollBy({ top: window.innerHeight, left: 0, behavior: "smooth" }) }, 1500) }} />
                                </div>
                                <div className="col-md-4 mx-2">
                                    <button className="btn btn-danger rounded" onClick={() => { setReportMonthYear("") }}>&#x2716;</button>
                                </div>
                            </div>

                            <div className="reportPanelWrapper">
                                <div className={`reportPanel ${reportMonthYear && "panelActive"}`}>
                                    <hr />
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="row mb-4 text-dark">
                                                <div className="col-md-4">Salesperson</div>
                                                <div className="col-md-3 text-end">No. of Invoices</div>
                                                <div className="col-md-3 text-end">No. of Products</div>
                                                <div className="col-md-2 text-end">Net Total</div>
                                            </div>
                                            {
                                                reportMonthYear && salespersonList.map((s, i) => {
                                                    let d = reportData.find(x => x.salesperson_id === s.id)

                                                    return (
                                                        <div key={i} className="row my-2 fs-5">
                                                            <div className="col-md-5">{s.salesperson_name}</div>
                                                            <div className="col-md-2 text-end">{d?.no_of_invoices || 0}</div>
                                                            <div className="col-md-2 text-end">{d?.no_of_products_sold || 0}</div>
                                                            <div className="col-md-3 text-end">{d?.net_total || 0}</div>
                                                        </div>
                                                    )
                                                })
                                            }
                                            <div className="row my-2 fs-5">
                                                <div className="col-md-5">N/A</div>
                                                <div className="col-md-2 text-end">{reportData.find(x => x.salesperson_id === undefined)?.no_of_invoices || 0}</div>
                                                <div className="col-md-2 text-end">{reportData.find(x => x.salesperson_id === undefined)?.no_of_products_sold || 0}</div>
                                                <div className="col-md-3 text-end">{reportData.find(x => x.salesperson_id === undefined)?.net_total || 0}</div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div style={{ width: "500px", height: "330px" }}>
                                                <ResponsivePie
                                                    data={[
                                                        ...salespersonList.map(x => ({ id: x.salesperson_name, label: x.salesperson_name, value: reportData.find(y => y.salesperson_id === x.id)?.no_of_invoices || 0 })),
                                                        { id: "N/A", label: "N/A", value: reportData.find(y => y.salesperson_id === undefined)?.no_of_invoices || 0 }
                                                    ]}
                                                    colors={{ scheme: "set1" }}
                                                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                                                    innerRadius={0.5}
                                                    padAngle={0.7}
                                                    cornerRadius={3}
                                                    activeOuterRadiusOffset={8}
                                                    borderWidth={1}
                                                    borderColor={{
                                                        from: 'color',
                                                        modifiers: [
                                                            [
                                                                'darker',
                                                                0.2
                                                            ]
                                                        ]
                                                    }}
                                                    arcLinkLabelsSkipAngle={10}
                                                    arcLinkLabelsTextColor="#999999"
                                                    arcLinkLabelsThickness={2}
                                                    arcLinkLabelsColor={{ from: 'color' }}
                                                    arcLabelsSkipAngle={10}
                                                    arcLabelsTextColor={{
                                                        from: 'color',
                                                        modifiers: [
                                                            [
                                                                'darker',
                                                                2
                                                            ]
                                                        ]
                                                    }}
                                                    tooltip={e => {
                                                        let { datum: t } = e;
                                                        return <div className="container bg-secondary rounded">{t.label}: {t.value}</div>
                                                    }}
                                                    legends={[
                                                        {
                                                            anchor: 'bottom',
                                                            direction: 'row',
                                                            justify: false,
                                                            translateX: 0,
                                                            translateY: 50,
                                                            itemsSpacing: 0,
                                                            itemWidth: 125,
                                                            itemHeight: 20,
                                                            itemTextColor: '#fff',
                                                            itemDirection: 'left-to-right',
                                                            itemOpacity: 1,
                                                            symbolSize: 18,
                                                            symbolShape: 'circle',
                                                            effects: [
                                                                {
                                                                    on: 'hover',
                                                                    style: {
                                                                        itemTextColor: '#999'
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </>
                </AuthWrapper>
            </div>

            <Modal show={editInvoiceModalShow} onHide={() => { handleEditInvoiceModalClose() }} size="lg" centered >
                <Modal.Header closeButton>
                    <Modal.Title>Edit Invoice - {invoiceData?.invoice_number}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="container">
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
                                    <label className="form-label my-1 required" htmlFor="date">Date</label>
                                    <input type="date" id="date" className="form-control" min={moment(date).startOf("month").format("YYYY-MM-DD")} max={moment(date).endOf("month").format("YYYY-MM-DD")} value={date}
                                        onChange={(e) => {
                                            if (!moment(e.target.value).isValid()) {
                                                Swal.fire('Oops!', "Enter a valid date", 'warning');
                                                return
                                            }

                                            setDate(e.target.value);
                                        }} />
                                </div>
                            </div>
                            <div className="col-md-6">
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
                        </div>
                        <div className="row">
                            <div className="col-md-6">
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
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="discountAmount">Discount on Products</label>
                                    <input type="number" id="discountAmount" className="form-control" value={discountAmount.toString()} onChange={(e) => { setDiscountAmount(e.target.value === "" ? 0 : parseFloat(e.target.value)) }} />
                                </div>
                            </div>
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
                        </div>
                        <div className="row my-2">
                            <div className="col-md-8 text-end my-auto">
                                <span>Products Total</span>
                            </div>
                            <div className="col-md-3 my-auto">
                                <span>{invoiceData !== null && invoiceData.line_items.reduce((p, o) => p + o.product_rate, 0)}</span>
                            </div>
                            <div className="col-md-1"></div>
                        </div>
                        <div className="row my-2" style={{ fontSize: "larger" }}>
                            <div className="col-md-8 text-end my-auto">
                                <span>Grand Total</span>
                            </div>
                            <div className="col-md-3 my-auto">
                                <span>{(invoiceData !== null && invoiceData.line_items.reduce((p, o) => p + o.product_rate, 0) - discountAmount) + accessoryItems.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)}</span>
                            </div>
                            <div className="col-md-1"></div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" disabled={isSaveApiLoading} onClick={() => { !isSaveApiLoading && updateInvoice() }}> {isSaveApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : 'Submit'} </Button>
                    <Button onClick={() => { handleEditInvoiceModalClose() }}>Close</Button>
                </Modal.Footer>
            </Modal>

            <NewFeatureModal/>
        </>
    )
}

export default SalesReport