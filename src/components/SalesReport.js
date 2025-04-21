import React, { useState, useEffect, useMemo } from "react"
import { Modal, Button, Dropdown, Tab, Tabs, OverlayTrigger, Tooltip } from "react-bootstrap"
import Select from "react-select"
import moment from "moment"
import Swal from "sweetalert2"
import axios from "axios";
import { ResponsivePie } from '@nivo/pie'
import { Helmet } from "react-helmet-async";

import { useFirebase } from "../contexts/firebase-context";
import { useModal } from "../contexts/modal-context"
import { getInvoiceList, getBranchList, getSalespersonList, getPatientList } from "../utils/getApis"
import { printInvoice } from "../utils/printInvoice"
import AuthWrapper from "./AuthWrapper";
import { escapeRegex, dropDownStyle, formatPatientNumber, formatAmount } from "../utils/commonUtils"

const SalesReport = () => {
    const { currentUserInfo } = useFirebase()
    const { openModal, setModalView, setModalData } = useModal()

    const [currentTab, setCurrentTab] = useState("tab1")

    const [branchList, setBranchList] = useState([])
    const [salespersonList, setSalespersonList] = useState([])
    const [invoiceList, setInvoiceList] = useState([])
    const [patientList, setPatientList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [branchFilter, setBranchFilter] = useState(null)
    const [salespersonFilter, setSalespersonFilter] = useState({ label: "All", value: "All" })

    const [reportMonthYear, setReportMonthYear] = useState(moment().format("YYYY-MM"))
    const [selectedSalespersonReport, setSelectedSalespersonReport] = useState(null)


    const [editInvoiceModalShow, setEditInvoiceModalShow] = useState(false)
    const [invoiceData, setInvoiceData] = useState(null)
    const [date, setDate] = useState(moment().format("YYYY-MM-DD"))
    const [selectedModeOfPayment, setSelectedModeOfPayment] = useState({ label: "Cash", value: "Cash" })
    const [selectedSalesperson, setSelectedSalesperson] = useState(null)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [accessoryItems, setAccessoryItems] = useState([{ accessory: "", quantity: 0, accessory_rate: 0 }])
    const [isSaveApiLoading, setIsSaveApiLoading] = useState(false)


    const filteredInvoiceList = useMemo(() => {
        return branchFilter ? invoiceList.filter(x => x.branch_id === branchFilter.value).filter(x => salespersonFilter.value === "All" ? true : x.salesperson_id === salespersonFilter.value).filter(x => {
            let pd = patientList.find(p => p.id === x.patient_id)
            let reg = new RegExp(escapeRegex(searchValue), "gi")

            if (searchBarState && searchValue !== "") {
                if ((reg.test(pd.patient_number)) || (reg.test(pd.patient_name)) || (reg.test(pd.contact_number)) || (reg.test(x.invoice_number)) || (reg.test(x.mode_of_payment))) {
                    return true
                }
                return false
            }
            else {
                return true
            }
        }) : []
    }, [branchFilter, salespersonFilter, searchBarState, searchValue, invoiceList, patientList])

    const reportData = useMemo(() => {
        if (!reportMonthYear || !invoiceList.length) return [];

        const sd = moment(reportMonthYear);
        const ed = moment(reportMonthYear).add(1, "month");

        // Filter invoices into a temporary variable
        const filteredInvoices = invoiceList.filter((invData) => {
            const d = moment.unix(invData.date._seconds);
            return d.isBetween(sd, ed);
        });

        // Helper function to calculate products sold (excluding chargers)
        const calculateProductsSold = (lineItems) => lineItems.filter((item) => !(item.product_name.toLowerCase().includes("charger") || item.product_name.toLowerCase().includes("chgr"))).length;

        const data = [];
        const undefinedSalesperson = {
            salesperson_id: undefined,
            salesperson_name: "N/A",
            no_of_invoices: 0,
            no_of_products_sold: 0,
            net_total: 0,
        };

        // Process filtered invoices
        filteredInvoices.forEach((invData) => {
            const gt =
                invData.line_items.reduce((p, o) => p + o.product_rate, 0) -
                invData.discount_amount +
                invData.accessory_items.reduce((p, o) => p + o.quantity * o.accessory_rate, 0);

            if (!invData.salesperson_id) {
                undefinedSalesperson.no_of_invoices += 1;
                undefinedSalesperson.no_of_products_sold += calculateProductsSold(invData.line_items);
                undefinedSalesperson.net_total += gt;
            } else {
                const existingSalesperson = data.find((x) => x.salesperson_id === invData.salesperson_id);

                if (existingSalesperson) {
                    existingSalesperson.no_of_invoices += 1;
                    existingSalesperson.no_of_products_sold += calculateProductsSold(invData.line_items);
                    existingSalesperson.net_total += gt;
                } else {
                    data.push({
                        salesperson_id: invData.salesperson_id,
                        salesperson_name: salespersonList.find((x) => x.id === invData.salesperson_id)?.salesperson_name,
                        no_of_invoices: 1,
                        no_of_products_sold: calculateProductsSold(invData.line_items),
                        net_total: gt,
                    });
                }
            }
        });

        // Ensure all salespersons are present in the final data
        salespersonList.forEach((salesperson) => {
            if (!data.some((x) => x.salesperson_id === salesperson.id)) {
                data.push({
                    salesperson_id: salesperson.id,
                    salesperson_name: salesperson.salesperson_name,
                    no_of_invoices: 0,
                    no_of_products_sold: 0,
                    net_total: 0,
                });
            }
        });

        data.push(undefinedSalesperson);

        data.sort((a, b) => {
            return a.salesperson_name.localeCompare(b.salesperson_name);
        });

        return data;
    }, [reportMonthYear, invoiceList, salespersonList]);

    const incentiveReportData = useMemo(() => {
        if (!reportMonthYear || !invoiceList.length || !selectedSalespersonReport?.value) return [];

        const sd = moment(reportMonthYear);
        const ed = moment(reportMonthYear).add(1, "month");

        // Filter invoices by month and salesperson
        const filteredInvoices = invoiceList.filter((invData) => {
            const d = moment.unix(invData.date._seconds);
            return (
                d.isBetween(sd, ed) &&
                invData.salesperson_id === selectedSalespersonReport.value
            );
        });

        // Calculate fields for each invoice
        const report = filteredInvoices.map((invData) => {
            const productMrpValue = invData.line_items.reduce((p, o) => p + o.product_rate, 0);
            const productSellValue = productMrpValue - invData.discount_amount;
            const invoiceAmount = productSellValue + invData.accessory_items.reduce((p, o) => p + o.quantity * o.accessory_rate, 0);
            const incentivePercentage = 5; // get from chart
            const incentiveAmount = (productSellValue * incentivePercentage) / 100;

            return {
                patient_id: invData.patient_id,
                patient_name: patientList.find((x) => x.id === invData.patient_id).patient_name,
                invoice_number: invData.invoice_number,
                invoice_amount: invoiceAmount,
                product_mrp_value: productMrpValue,
                product_sell_value: productSellValue,
                incentive_percentage: incentivePercentage,
                incentive_amount: incentiveAmount,
            };
        });

        return report;
    }, [reportMonthYear, invoiceList, selectedSalespersonReport, patientList]);


    useEffect(() => {
        if (currentUserInfo !== null) {
            getBranchList(currentUserInfo, setBranchList)
            getSalespersonList(currentUserInfo, setSalespersonList)
            getInvoiceList(currentUserInfo, setInvoiceList)
            getPatientList(currentUserInfo, setPatientList)
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
        setDate(moment().format("YYYY-MM-DD"))
        setSelectedModeOfPayment({ label: "Cash", value: "Cash" })
        setSelectedSalesperson(null)
        setDiscountAmount(0)
        setAccessoryItems([{ accessory: "", quantity: 0, accessory_rate: 0 }])
    }

    return (
        <>
            <Helmet>
                <meta name="description" content="Happy Ears Kolkata is a React-powered app for efficient hearing care management, offering seamless invoice creation, inventory control, and secure patient data storage with integrated location tracking, created by Hritwick De. Report Page to manage the recorded invoices of the business and check out monthly profits" />
                <title>Sales Report | Happy Ears Kolkata Invoicing</title>
            </Helmet>

            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Sales Report</span>
                </div>

                <AuthWrapper page={"sales_report"}>
                    <>
                        <div className="container-fluid">
                            <Tabs className="mb-3" activeKey={currentTab} onSelect={(k) => { setCurrentTab(k); }} >
                                <Tab eventKey="tab1" title="Records">

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

                                    <div className="table-responsive" style={{ minHeight: "250px" }}>
                                        <table className="table table-hover table-striped border border-light align-middle" style={{ minWidth: "1330px" }}>
                                            <thead>
                                                <tr className="table-dark">
                                                    <th scope="col">Sl. No.</th>
                                                    <th scope="col">Patient Number</th>
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
                                                    !patientList.length || !filteredInvoiceList.length ? <tr><td colSpan={10} className="fs-4 text-center text-secondary">No invoices added</td></tr> :
                                                        filteredInvoiceList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                                            let patientDetails = patientList.find(p => p.id === x.patient_id)

                                                            return (
                                                                <tr key={i}>
                                                                    <td>{(currentPage * 10) + i + 1}</td>
                                                                    <td>{formatPatientNumber(patientDetails.patient_number)}</td>
                                                                    <td>{patientDetails.patient_name}</td>
                                                                    <td>{patientDetails.contact_number}</td>
                                                                    <td>{x.invoice_number}</td>
                                                                    <td>₹&nbsp;{formatAmount((x.line_items.reduce((p, o) => p + o.product_rate, 0) - x.discount_amount) + x.accessory_items.reduce((p, o) => p + o.quantity * o.accessory_rate, 0))}</td>
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
                                                                                    setModalView("PRINT_CONFIG_MODAL");
                                                                                    setModalData({
                                                                                        submitCallback: (printConfigData) => {
                                                                                            printInvoice(patientDetails, x.branch_id, x.invoice_number, moment.unix(x.date._seconds).format("DD-MM-YYYY"), x.mode_of_payment, x.discount_amount, x.line_items, x.accessory_items, printConfigData, branchList)
                                                                                        }
                                                                                    })
                                                                                    openModal()
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
                                                        <td colSpan={10}>
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
                                    </div>

                                </Tab>
                                <Tab eventKey="tab2" title="Sales Report">

                                    <div className="container-fluid">
                                        <div className="row">
                                            <div className="col-4 d-flex gap-2">
                                                <div className="form-group flex-grow-1">
                                                    <label className="form-label my-1" htmlFor="reportMonthYear">Select Month</label>
                                                    <input type="month" id="reportMonthYear" className="form-control" value={reportMonthYear} onChange={(e) => { setReportMonthYear(e.target.value); }} />
                                                </div>
                                                <div className="align-self-end">
                                                    <button className="btn btn-danger rounded" onClick={() => { setReportMonthYear("") }}>&#x2716;</button>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="form-group">
                                                    <label className="form-label my-1">Salesperson</label>
                                                    <Select
                                                        options={salespersonList.map(x => ({ label: x.salesperson_name, value: x.id }))}
                                                        value={selectedSalespersonReport}
                                                        onChange={(val) => { setSelectedSalespersonReport(val) }}
                                                        isClearable
                                                        styles={dropDownStyle}
                                                        placeholder="Select Salesperson..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-3 align-self-end">
                                                <button className="btn btn-info ms-auto me-2" onClick={() => { Swal.fire('Oops!!', 'This feature is not ready yet', 'warning'); console.log("exporting report data"); }}>Export Report</button>
                                            </div>
                                        </div>

                                        <table className="table table-hover table-striped border border-light align-middle mt-5">
                                            <thead>
                                                <tr className="table-dark">
                                                    <th scope="col">Salesperson</th>
                                                    <th scope="col">No. of Invoices</th>
                                                    <th scope="col">No. of Products</th>
                                                    <th scope="col">Net Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    !reportMonthYear ? <tr><td colSpan={4} className="fs-4 text-center text-secondary">Select a Month</td></tr> :
                                                        reportData.map((row, index) => (
                                                            <tr key={index}>
                                                                <td>{row.salesperson_name}</td>
                                                                <td>{row.no_of_invoices}</td>
                                                                <td>{row.no_of_products_sold}</td>
                                                                <td>₹&nbsp;{formatAmount(row.net_total)}</td>
                                                            </tr>
                                                        ))
                                                }
                                            </tbody>
                                        </table>

                                        <div className="mx-auto" style={{ width: "750px", height: "330px" }}>
                                            <ResponsivePie
                                                data={[
                                                    ...salespersonList.map(x => ({ id: x.salesperson_name, label: x.salesperson_name, value: reportData.find(y => y.salesperson_id === x.id)?.no_of_invoices || 0 })),
                                                    { id: "N/A", label: "N/A", value: reportData.find(y => y.salesperson_id === undefined)?.no_of_invoices || 0 }
                                                ]}
                                                colors={{ scheme: "set1" }}
                                                margin={{ top: 20, right: 20, bottom: 60, left: 140 }}
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
                                                        anchor: 'left',
                                                        direction: 'column',
                                                        justify: false,
                                                        translateX: -50,
                                                        translateY: 0,
                                                        itemsSpacing: 10,
                                                        itemWidth: 100,
                                                        itemHeight: 20,
                                                        itemTextColor: '#fff',
                                                        itemDirection: 'left-to-right',
                                                        itemOpacity: 1,
                                                        symbolSize: 20,
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

                                        <div className="table-responsive">
                                            <table className="table table-hover table-striped border border-light align-middle mb-5" style={{ minWidth: "1300px" }}>
                                                <thead>
                                                    <tr className="table-dark">
                                                        <th scope="col">Patient Name</th>
                                                        <th scope="col">Invoice Number</th>
                                                        <th scope="col">Invoice Amount</th>
                                                        <th scope="col">Product MRP Value <CustomTooltipWrapper msg="Product MRP Value is the total of all the products' mrp in this Invoice" /></th>
                                                        <th scope="col">Product Sell Value <CustomTooltipWrapper msg="Product Sell Value = Product MRP Value - Discount on Products" /></th>
                                                        <th scope="col">Incentive Percentage</th>
                                                        <th scope="col">Incentive Amount <CustomTooltipWrapper msg="Incentive Amount = Product Sell Value * Incentive Percentage" /></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        !reportMonthYear || !selectedSalespersonReport ? <tr><td colSpan={7} className="fs-4 text-center text-secondary">Select a Month and Salesperson</td></tr> :
                                                            incentiveReportData.map((row, index) => (
                                                                <tr key={index}>
                                                                    <td>{row.patient_name}</td>
                                                                    <td>{row.invoice_number}</td>
                                                                    <td>₹&nbsp;{formatAmount(row.invoice_amount)}</td>
                                                                    <td>₹&nbsp;{formatAmount(row.product_mrp_value)}</td>
                                                                    <td>₹&nbsp;{formatAmount(row.product_sell_value)}</td>
                                                                    <td>{row.incentive_percentage}%</td>
                                                                    <td>₹&nbsp;{formatAmount(row.incentive_amount)}</td>
                                                                </tr>
                                                            ))
                                                    }
                                                    {
                                                        reportMonthYear && selectedSalespersonReport &&
                                                        <tr>
                                                            <td colSpan={2} className="table-light text-center">TOTAL</td>
                                                            <td>₹&nbsp;{formatAmount(incentiveReportData.reduce((p, o) => p + o.invoice_amount, 0))}</td>
                                                            <td>₹&nbsp;{formatAmount(incentiveReportData.reduce((p, o) => p + o.product_mrp_value, 0))}</td>
                                                            <td>₹&nbsp;{formatAmount(incentiveReportData.reduce((p, o) => p + o.product_sell_value, 0))}</td>
                                                            <td></td>
                                                            <td>₹&nbsp;{formatAmount(incentiveReportData.reduce((p, o) => p + o.incentive_amount, 0))}</td>
                                                        </tr>
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                </Tab>
                            </Tabs>
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
        </>
    )
}

const CustomTooltipWrapper = ({ msg }) => {
    return (
        <OverlayTrigger
            placement={"top"}
            overlay={<Tooltip>{msg}</Tooltip>}
        >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ margin: "0 0 1px 5px" }}>
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
            </svg>
        </OverlayTrigger>
    )
}

export default SalesReport