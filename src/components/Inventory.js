import React, { useState, useEffect } from "react"
import { Modal, Button, Dropdown } from "react-bootstrap"
import Select from "react-select"
import axios from "axios";
import Swal from "sweetalert2"
import Dropzone from 'react-dropzone'
import moment from "moment"
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

import { useFirebase } from "../contexts/firebase-context";
import { getProductList, getBranchList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";
import NewFeatureModal from "./NewFeatureModal";

const Inventory = () => {
    const { currentUserInfo } = useFirebase()

    const navigate = useNavigate()

    const [branchList, setBranchList] = useState([])
    const [productList, setProductList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [branchFilter, setBranchFilter] = useState(null)

    const [configureProductModalShow, setConfigureProductModalShow] = useState(false)
    const [configureProductModalMode, setConfigureProductModalMode] = useState("ADD")
    const [productId, setProductId] = useState(null)
    const [productName, setProductName] = useState("")
    const [serialNumber, setSerialNumber] = useState("")
    const [manufacturer, setManufacturer] = useState("")
    const [mrp, setMrp] = useState(0)
    const [selectedBranch, setSelectedBranch] = useState(null)
    const [isConfigureProductApiLoading, setIsConfigureProductApiLoading] = useState(false)

    const [importProductModalShow, setImportProductModalShow] = useState(false)
    const [startingRow, setStartingRow] = useState(1)
    const [endingRow, setEndingRow] = useState(1)
    const [selectedFile, setSelectedFile] = useState(null)
    const [isImportApiLoading, setIsImportApiLoading] = useState(false)


    const [selectedProductId, setSelectedProductId] = useState(null)
    const [selectedProductName, setSelectedProductName] = useState(null)
    const [selectedProductSerialNumber, setSelectedProductSerialNumber] = useState(null)

    const [transferProductModalShow, setTransferProductModalShow] = useState(false)
    const [selectedProductCurrentBranch, setSelectedProductCurrentBranch] = useState(null)
    const [selectedTransferToBranch, setSelectedTransferToBranch] = useState(null)
    const [isTransferApiLoading, setIsTransferApiLoading] = useState(false)

    const [productLogHistoryModalShow, setProductLogHistoryModalShow] = useState(false)
    const [productLogHistoryData, setProductLogHistoryData] = useState([])
    const [isProductLogHistoryApiLoading, setIsProductLogHistoryApiLoading] = useState(false)

    const filteredProductList = branchFilter ? productList.filter(x => x.branch_id === branchFilter.value).filter(x => {
        if (searchBarState && searchValue !== "") {
            if (((new RegExp(searchValue, "gi")).test(x.manufacturer_name)) || ((new RegExp(searchValue, "gi")).test(x.product_name)) || ((new RegExp(searchValue, "gi")).test(x.serial_number))) {
                return true
            }
            return false
        }
        else {
            return true
        }
    }) : []

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

    const excelTemplateBase64 = "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"
    const excelTemplateType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    useEffect(() => {
        if (currentUserInfo !== null) {
            getBranchList(currentUserInfo, setBranchList)
            getProductList(currentUserInfo, setProductList)
        }
    }, [currentUserInfo, navigate])

    useEffect(() => {
        if (branchList.length > 0) {
            let b = branchList.find(x => x.branch_invoice_code === "RANI")
            setBranchFilter({ label: b.branch_name, value: b.id })
        }
    }, [branchList])

    const getProductLogHistory = async (product_id) => {
        setIsProductLogHistoryApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-product-log-history`, { product_id, current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                if (res.data.operation === "success") {
                    setIsProductLogHistoryApiLoading(false)
                    setProductLogHistoryData(res.data.info)
                }
                else {
                    Swal.fire('Error!!', res.data.message, 'error');
                }
            })
            .catch((err) => {
                console.log(err)
                Swal.fire('Error!!', err.message, 'error');
            })
    }

    const configureProductModalInit = (x) => {
        setProductId(x.id)
        setProductName(x.product_name)
        setSerialNumber(x.serial_number)
        setManufacturer(x.manufacturer_name)
        setMrp(x.mrp)
        setSelectedBranch({ label: branchList.find(y => x.branch_id === y.id).branch_name, value: x.branch_id })
    }

    const configureProduct = () => {
        if (productName === "") {
            Swal.fire('Oops!!', 'Enter a valid Product Name', 'warning');
            return
        }
        if (serialNumber.trim() === "") {
            Swal.fire('Oops!!', 'Enter a valid Serial Number', 'warning');
            return
        }
        if (manufacturer === "") {
            Swal.fire('Oops!!', 'Enter a valid Manufacturer', 'warning');
            return
        }
        if (mrp <= 0) {
            Swal.fire('Oops!!', 'MRP has to be a positive number', 'warning');
            return
        }
        if (selectedBranch === null) {
            Swal.fire('Oops!!', 'Select a Branch for the product', 'warning');
            return
        }

        let data = {
            ...(configureProductModalMode === "EDIT" ? { product_id: productId } : {}),
            product_name: productName,
            serial_number: serialNumber,
            manufacturer: manufacturer,
            mrp: mrp,
            branch_id: selectedBranch.value,

            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName
        }

        let url = configureProductModalMode === "ADD" ? "add-product" : "update-product"
        setIsConfigureProductApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/${url}`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsConfigureProductApiLoading(false)
                if (res.data.operation === "success") {
                    getProductList(currentUserInfo, setProductList)
                    handleConfigureProductModalClose()
                    Swal.fire('Success!', res.data.message, 'success');
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

    const handleConfigureProductModalClose = () => {
        setConfigureProductModalShow(false)
        setConfigureProductModalMode("ADD")

        setProductId(null)
        setProductName("")
        setSerialNumber("")
        setManufacturer("")
        setMrp(0)
        setSelectedBranch(null)
    }

    const importProducts = () => {
        if (startingRow < 1) {
            Swal.fire('Oops!!', 'Starting row has to be at least 1', 'warning');
            return
        }
        if (endingRow < startingRow) {
            Swal.fire('Oops!!', 'Ending row cannot be less than Starting row', 'warning');
            return
        }
        if (selectedFile === null) {
            Swal.fire('Oops!!', 'Select a File to Import!', 'warning');
            return
        }
        if (currentUserInfo === null) {
            Swal.fire('Oops!!', 'Sign in first to use feature!', 'warning');
            return
        }

        let data = new FormData()
        data.append("starting_row", startingRow)
        data.append("ending_row", endingRow)
        data.append("selected_file", selectedFile)
        data.append("current_user_uid", currentUserInfo.uid)
        data.append("current_user_name", currentUserInfo.displayName)

        setIsImportApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/import-products`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then((res) => {
                setIsImportApiLoading(false)
                if (res.data.operation === "success") {
                    getProductList(currentUserInfo, setProductList)
                    handleImportProductModalClose()

                    let c = `<div>
                        <span class="fw-bold">Added Serials:</span><br>
                        <div class="row gx-0">
                        ${res.data.info.added_serials.length === 0 ? "<span>No product added</span>" :
                            res.data.info.added_serials.map((x) => {
                                return (
                                    `<span class="col-4 p-1">${x}</span>`
                                )
                            }).join("")
                        }
                        </div>
                    </div>
                    <br>
                    <div>
                        <span class="fw-bold">Rejected Serials:</span><br>
                        <div class="row gx-0">
                        ${res.data.info.rejected_serials.length === 0 ? "<span>No product rejected</span>" :
                            res.data.info.rejected_serials.map((x) => {
                                return (
                                    `<span class="col-4 p-1">${x}</span>`
                                )
                            }).join("")
                        }
                        </div>
                    </div>
                    `
                    Swal.fire({
                        title: 'Success!',
                        icon: "success",
                        width: "40rem",
                        html: c
                    });
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

    const handleImportProductModalClose = () => {
        setImportProductModalShow(false)

        setStartingRow(1)
        setEndingRow(1)
        setSelectedFile(null)
    }

    const transferProduct = () => {

        let data = {
            product_id: selectedProductId,
            branch_id: selectedTransferToBranch.value,
            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName
        }

        setIsTransferApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/transfer-product`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsTransferApiLoading(false)
                if (res.data.operation === "success") {
                    getProductList(currentUserInfo, setProductList)
                    handleTransferProductModalClose()
                    Swal.fire('Success!', res.data.message, 'success');
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

    const handleTransferProductModalClose = () => {
        setTransferProductModalShow(false)

        setSelectedProductId(null)
        setSelectedProductName(null)
        setSelectedProductSerialNumber(null)
        setSelectedProductCurrentBranch(null)
        setSelectedTransferToBranch(null)
    }

    const handleProductLogHistoryModalClose = () => {
        setProductLogHistoryModalShow(false)

        setSelectedProductId(null)
        setSelectedProductName(null)
        setSelectedProductSerialNumber(null)
    }

    let tp = Math.ceil(filteredProductList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    return (
        <>
            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Inventory List</span>
                </div>

                <AuthWrapper page={"inventory"}>
                    <>
                        <div className="d-flex align-items-end px-3 py-2">
                            <label className="form-label m-0 me-2 fs-5">Filters: </label>
                            <div className="form-group">
                                <label className="form-label m-0">Branch</label>
                                <Select
                                    options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                                    value={branchFilter}
                                    onChange={(val) => { setBranchFilter(val); setCurrentPage(0); }}
                                    styles={dropDownStyle}
                                    placeholder="Select a Branch..."
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

                            <button className="btn btn-success ms-auto me-2" onClick={() => { setConfigureProductModalShow(true); setConfigureProductModalMode("ADD"); }}>+ Add</button>
                            <button className="btn btn-info mx-2" onClick={() => { setImportProductModalShow(true) }}>Import</button>
                            <button className="btn btn-info mx-2" onClick={() => { Swal.fire('Oops!!', 'This feature is not ready yet', 'warning'); console.log("exporting products"); }}>Export</button>
                        </div>

                        <table className="table table-hover m-auto align-middle" style={{ width: "97%" }}>
                            <thead>
                                <tr className="table-dark">
                                    <th scope="col">Sl. No.</th>
                                    <th scope="col">Manufacturer</th>
                                    <th scope="col">Product Name</th>
                                    <th scope="col">Serial Number</th>
                                    <th scope="col">MRP</th>
                                    <th scope="col">In Stock</th>
                                    <th scope="col">Added On</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    filteredProductList.length === 0 ? <tr><td colSpan={8} className="fs-4 text-center text-secondary">No products added</td></tr> :
                                        filteredProductList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                            return (
                                                <tr key={i} className={i % 2 ? "table-secondary" : "table-light"}>
                                                    <td>{(currentPage * 10) + i + 1}</td>
                                                    <td>{x.manufacturer_name}</td>
                                                    <td>{x.product_name}</td>
                                                    <td>{x.serial_number}</td>
                                                    <td>{x.mrp}</td>
                                                    <td>
                                                        {
                                                            x.instock ?
                                                                <svg viewBox="0 0 48 48" width="32px" height="32px"><path fill="#4caf50" d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z" /><path fill="#ccff90" d="M34.602,14.602L21,28.199l-5.602-5.598l-2.797,2.797L21,33.801l16.398-16.402L34.602,14.602z" /></svg> :
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32px" height="32px"><path fill="#f44336" d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z" /><path fill="#fff" d="M29.656,15.516l2.828,2.828l-14.14,14.14l-2.828-2.828L29.656,15.516z" /><path fill="#fff" d="M32.484,29.656l-2.828,2.828l-14.14-14.14l2.828-2.828L32.484,29.656z" /></svg>
                                                        }
                                                    </td>
                                                    <td>{moment.unix(x.created_at._seconds).format("lll")}</td>
                                                    <td>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="primary">
                                                                <svg width="16" height="16" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                                                                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                                                                </svg>
                                                            </Dropdown.Toggle>

                                                            <Dropdown.Menu>
                                                                {
                                                                    x.instock &&
                                                                    <>
                                                                        <Dropdown.Item onClick={() => { setConfigureProductModalShow(true); setConfigureProductModalMode("EDIT"); configureProductModalInit(x); }} >Edit </Dropdown.Item>
                                                                        <Dropdown.Item onClick={() => { setTransferProductModalShow(true); setSelectedProductId(x.id); setSelectedProductName(x.product_name); setSelectedProductSerialNumber(x.serial_number); setSelectedProductCurrentBranch(x.branch_id); }} >Transfer</Dropdown.Item>
                                                                        <Dropdown.Item
                                                                            onClick={() => {
                                                                                Swal.fire({
                                                                                    title: "Are you sure? Enter a reason",
                                                                                    input: "text",
                                                                                    inputAttributes: { autocapitalize: "off" },
                                                                                    showCancelButton: true,
                                                                                    confirmButtonText: "Submit",
                                                                                    showLoaderOnConfirm: true,
                                                                                    preConfirm: async (reason) => {
                                                                                        let data = {
                                                                                            product_id: x.id,
                                                                                            reason: reason,
                                                                                            current_user_uid: currentUserInfo.uid,
                                                                                            current_user_name: currentUserInfo.displayName
                                                                                        }

                                                                                        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/return-product`, data, { headers: { 'Content-Type': 'application/json' } })
                                                                                            .then((res) => {
                                                                                                if (res.data.operation === "success") {
                                                                                                    getProductList(currentUserInfo, setProductList)
                                                                                                    Swal.fire('Success!', res.data.message, 'success');
                                                                                                }
                                                                                                else {
                                                                                                    Swal.fire('Oops!', res.data.message, 'error');
                                                                                                }
                                                                                            })
                                                                                            .catch((err) => {
                                                                                                console.log(err)
                                                                                                Swal.fire('Error!!', err.message, 'error');
                                                                                            })
                                                                                    },
                                                                                    allowOutsideClick: () => !Swal.isLoading()
                                                                                })
                                                                            }}
                                                                        >Return Product</Dropdown.Item>
                                                                    </>
                                                                }
                                                                <Dropdown.Item onClick={() => { setProductLogHistoryModalShow(true); setSelectedProductId(x.id); setSelectedProductName(x.product_name); setSelectedProductSerialNumber(x.serial_number); getProductLogHistory(x.id); }} >View Log History</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                }
                            </tbody>
                            {
                                filteredProductList.length !== 0 &&
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

            <Modal show={configureProductModalShow} onHide={() => { handleConfigureProductModalClose() }} size="lg" centered >
                <Modal.Header closeButton>
                    <Modal.Title>{configureProductModalMode === "ADD" ? "Add" : "Update"} a Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="container">
                        <div className="row mb-1">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="productName">Product Name</label>
                                    <input type="text" id="productName" className="form-control" value={productName} onChange={(e) => { setProductName(e.target.value) }} placeholder="Enter Product Name" />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="serialNumber">Serial Number</label>
                                    <input type="text" id="serialNumber" className="form-control" value={serialNumber} onChange={(e) => { setSerialNumber(e.target.value) }} placeholder="Enter Serial Number" />
                                </div>
                            </div>
                        </div>

                        <div className="row mb-1">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="manufacturer">Manufacturer</label>
                                    <input type="text" id="manufacturer" className="form-control" value={manufacturer} onChange={(e) => { setManufacturer(e.target.value) }} placeholder="Enter Manufacturer" />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="mrp">MRP</label>
                                    <input type="number" id="mrp" className="form-control" min={0} value={mrp.toString()} onChange={(e) => { setMrp(e.target.value === "" ? 0 : parseFloat(e.target.value)) }} />
                                </div>
                            </div>
                        </div>

                        <div className="row mb-1">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1 required">Branch</label>
                                    <Select
                                        options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                                        value={selectedBranch}
                                        onChange={(val) => { setSelectedBranch(val); }}
                                        isDisabled={configureProductModalMode === "EDIT"}
                                        styles={dropDownStyle}
                                        placeholder="Select a Branch..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" disabled={isConfigureProductApiLoading} onClick={() => { !isConfigureProductApiLoading && configureProduct() }}> {isConfigureProductApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : 'Submit'} </Button>
                    <Button onClick={() => { handleConfigureProductModalClose() }}>Close</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={importProductModalShow} onHide={() => { handleImportProductModalClose() }} size="lg" centered >
                <Modal.Header closeButton>
                    <Modal.Title>Import Products</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="container">
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="startingRow">Starting Row</label>
                                    <input type="number" id="startingRow" className="form-control" min={1} value={startingRow.toString()} onChange={(e) => { setStartingRow(e.target.value === "" ? 0 : parseInt(e.target.value)) }} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="endingRow">Ending Row</label>
                                    <input type="number" id="endingRow" className="form-control" min={1} value={endingRow.toString()} onChange={(e) => { setEndingRow(e.target.value === "" ? 0 : parseInt(e.target.value)) }} />
                                </div>
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-12">
                                {
                                    selectedFile === null ?
                                        <Dropzone maxFiles={1} onDrop={acceptedFiles => { setSelectedFile(acceptedFiles[0]) }}
                                            accept={{
                                                "application/vnd.ms-excel": [".xls"],
                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
                                            }}
                                        >
                                            {({ getRootProps, getInputProps }) => (
                                                <section>
                                                    <div {...getRootProps()} style={{ border: "2px dotted green", borderRadius: "10px", fontSize: "x-large", fontWeight: "bolder", padding: "20px" }}>
                                                        <input {...getInputProps()} />
                                                        <span>Drag 'n' drop some files here, or click to select files</span>
                                                    </div>
                                                </section>
                                            )}
                                        </Dropzone>
                                        :
                                        <div className="fs-5">
                                            <span className="me-3 fw-bold">Selected File:</span> {selectedFile.path}
                                            <button className="btn btn-outline-danger ms-3 rounded-pill" onClick={() => { setSelectedFile(null) }}>🗙</button>
                                        </div>
                                }

                            </div>
                        </div>

                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" className="me-auto"
                        onClick={() => {
                            fetch(`data:${excelTemplateType};base64,${excelTemplateBase64}`)
                                .then(res => res.blob())
                                .then(blob => saveAs(blob, "Product Import.xlsx"))
                        }}
                    >Get Template</Button>
                    <Button variant="success" disabled={isImportApiLoading} onClick={() => { !isImportApiLoading && importProducts() }}> {isImportApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : 'Submit'} </Button>
                    <Button onClick={() => { handleImportProductModalClose() }}>Close</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={transferProductModalShow} onHide={() => { handleTransferProductModalClose() }} centered >
                <Modal.Header closeButton>
                    <Modal.Title>Choose Transfer to Branch</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="container">
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1">Selected Product: </label>
                                    <div><span className="fw-bold" style={{ fontSize: "larger" }}>{selectedProductName} {selectedProductSerialNumber}</span></div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="form-label my-1 required" >Transfer To Branch</label>
                                    <Select
                                        options={branchList.filter(x => x.id !== selectedProductCurrentBranch).map(x => ({ label: x.branch_name, value: x.id }))}
                                        value={selectedTransferToBranch}
                                        onChange={(val) => { setSelectedTransferToBranch(val); }}
                                        styles={dropDownStyle}
                                        placeholder="Select a Branch..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" disabled={isTransferApiLoading} onClick={() => { !isTransferApiLoading && transferProduct() }}> {isImportApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : 'Submit'} </Button>
                    <Button onClick={() => { handleTransferProductModalClose() }}>Close</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={productLogHistoryModalShow} onHide={() => { handleProductLogHistoryModalClose() }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Product History - {selectedProductName} {selectedProductSerialNumber}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="container">
                        {
                            isProductLogHistoryApiLoading ?
                                <div className="text-center"><div className="spinner-border text-success" style={{ width: "3rem", height: "3rem" }}></div></div> :
                                <div className="vertical-timeline vertical-timeline--animate vertical-timeline--one-column">
                                    {
                                        productLogHistoryData.map((x, i) => {
                                            return (
                                                <div key={i} className="vertical-timeline-item vertical-timeline-element">
                                                    <div>
                                                        <span className="vertical-timeline-element-icon bounce-in"><i className="badge badge-dot badge-dot-xl badge-success"></i></span>
                                                        <div className="vertical-timeline-element-content bounce-in">
                                                            <h4 className="timeline-title">{x.operation} <span className="badge bg-success ms-3 text-black" style={{ fontSize: "13px" }}>{branchList.find(y => y.id === x.branch_id).branch_name}</span></h4>
                                                            <p>
                                                                {x.reason}<br />
                                                                by: <span className="fw-bold">{x.added_by_user_name}</span>
                                                            </p>
                                                            <span className="vertical-timeline-element-date">{moment.unix(x.created_at._seconds).format("YYYY-MM-DD")}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                        }
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => { handleProductLogHistoryModalClose() }}>Close</Button>
                </Modal.Footer>
            </Modal>

            <NewFeatureModal />
        </>
    )
}

export default Inventory