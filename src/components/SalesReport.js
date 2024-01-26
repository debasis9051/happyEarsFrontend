import React, { useState, useEffect } from "react"
import Select from "react-select"
import moment from "moment"
import Swal from "sweetalert2"

import { getInvoiceList, getBranchList } from "../utils/getApis"
import { printInvoice } from "../utils/printInvoice"

import AuthWrapper from "./AuthWrapper";

const SalesReport = () => {

    const [branchList, setBranchList] = useState([])

    const [invoiceList, setInvoiceList] = useState([])
    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [branchFilter, setBranchFilter] = useState(null)

    const dropDownStyle = {
        option: (styles) => {
            return {
                ...styles,
                color: 'black'
            };
        }
    }

    useEffect(() => {
        getBranchList(setBranchList)
    }, [])

    useEffect(() => {
        if (branchList.length > 0) {
            let b = branchList.find(x => x.branch_invoice_code === "RANI")
            setBranchFilter({ label: b.branch_name, value: b.id })
        }
    }, [branchList])

    useEffect(() => {
        if (branchFilter !== null) {
            getInvoiceList(setInvoiceList, branchFilter.value)
        }
    }, [branchFilter])

    let tp = Math.ceil(invoiceList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    return (
        <>
            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Sales Report</span>
                </div>

                <AuthWrapper>
                    <>
                        <div className="d-flex align-items-center px-3 py-2">
                            <label className="form-label m-1 me-3 fs-5">Branch</label>
                            <Select
                                options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                                value={branchFilter}
                                onChange={(val) => { setBranchFilter(val); setCurrentPage(0); }}
                                styles={dropDownStyle}
                                placeholder="Select a Branch..."
                            />
                            <div className="d-flex mx-2">
                                <button className="btn btn-secondary rounded-pill me-1" onClick={() => { setSearchBarState(!searchBarState); setSearchValue("") }}>
                                    <svg width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                    </svg>
                                </button>
                                <input type="text" className="form-control" style={searchBarState ? { transition: "all 1s" } : { transition: "all 1s", width: "0", padding: "0", opacity: "0", visibility: "hidden" }} placeholder="Search..." onChange={(e) => { setSearchValue(e.target.value) }} />
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
                                    <th scope="col">Invoice Date</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    invoiceList.length === 0 ? <tr><td colSpan={8} className="fs-4 text-center text-secondary">No invoices added</td></tr> :
                                        invoiceList.filter(x => {
                                            if (searchBarState && searchValue !== "") {
                                                if(((new RegExp(searchValue,"gi")).test(x.patient_name)) || ((new RegExp(searchValue,"gi")).test(x.contact_number)) || ((new RegExp(searchValue,"gi")).test(x.invoice_number)) || ((new RegExp(searchValue,"gi")).test(x.mode_of_payment))) {
                                                    return true
                                                }
                                                return false
                                            }
                                            else{
                                                return true
                                            }
                                        }).slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                            return (
                                                <tr key={i} className={i % 2 ? "table-secondary" : "table-light"}>
                                                    <td>{(currentPage * 10) + i + 1}</td>
                                                    <td>{x.patient_name}</td>
                                                    <td>{x.contact_number}</td>
                                                    <td>{x.invoice_number}</td>
                                                    <td>{(x.line_items.reduce((p, o) => p + o.product_rate, 0) - x.discount_amount) + x.accessory_items.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)}</td>
                                                    <td>{x.mode_of_payment}</td>
                                                    <td>{moment(x.date._seconds * 1000).format("DD-MM-YYYY")}</td>
                                                    <td><button className="btn btn-primary" onClick={() => { printInvoice(x.patient_name, x.patient_address, x.contact_number, branchList.find(b => b.id === x.branch_id).branch_name, x.invoice_number, moment(x.date._seconds * 1000).format("DD-MM-YYYY"), x.mode_of_payment, x.discount_percentage, x.discount_amount, x.line_items, x.accessory_items) }}>Print</button></td>
                                                </tr>
                                            )
                                        })
                                }
                            </tbody>
                            {
                                invoiceList.length !== 0 &&
                                <tfoot>
                                    <tr>
                                        <td colSpan={8}>
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
                    </>
                </AuthWrapper>
            </div>
        </>
    )
}

export default SalesReport