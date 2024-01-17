import React, { useState, useEffect } from "react"
import Select from "react-select"
import moment from "moment"

import { getInvoiceList, getBranchList } from "../utils/getApis"
import { printInvoice } from "../utils/printInvoice"

const SalesReport = () => {

    const [branchList, setBranchList] = useState([])

    const [invoiceList, setInvoiceList] = useState([])
    const [currentPage, setCurrentPage] = useState(0) 
    // const [searchValue, setSearchValue] = useState(null)
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
                    <span className="fs-5 p-3">Inventory List</span>
                    <div className=" flex-grow-1 d-flex align-items-center">
                        <label className="form-label m-1">Branch</label>
                        <Select
                            options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                            value={branchFilter}
                            onChange={(val) => { setBranchFilter(val) }}
                            styles={dropDownStyle}
                            placeholder="Select a Branch..."
                        />
                        {/* <button className="btn btn-info mx-2" onClick={() => { console.log("exporting products") }}>Export</button> */}
                    </div>
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
                            invoiceList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                return (
                                    <tr key={i} className={i % 2 ? "table-secondary" : "table-light"}>
                                        <td>{(currentPage * 10) + i + 1}</td>
                                        <td>{x.patient_name}</td>
                                        <td>{x.contact_number}</td>
                                        <td>{x.invoice_number}</td>
                                        <td>{(x.line_items.reduce((p, o) => p + o.product_rate, 0) - x.discount_amount) + x.accessory_items.reduce((p, o) => p + o.quantity * o.accessory_rate, 0)}</td>
                                        <td>{x.mode_of_payment}</td>
                                        <td>{moment(x.date._seconds * 1000).format("DD-MM-YYYY")}</td>
                                        <td><button className="btn btn-primary" onClick={()=>{printInvoice(x.patient_name,x.patient_address,x.contact_number,branchList.find(b=>b.id===x.branch_id).branch_name,x.invoice_number,moment(x.date._seconds * 1000).format("DD-MM-YYYY"),x.mode_of_payment,x.discount_percentage,x.discount_amount,x.line_items,x.accessory_items)}}>Print</button></td>
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
            </div>
        </>
    )
}

export default SalesReport