import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
import Select from "react-select"
import axios from "axios";
import Swal from "sweetalert2"
import Dropzone from 'react-dropzone'
import moment from "moment"

import { getProductList } from "../utils/getApis"

const Inventory = () => {

    const [productList, setProductList] = useState([])
    const [currentPage, setCurrentPage] = useState(0)
    const [searchValue, setSearchValue] = useState(null)

    const [importProductModalShow, setImportProductModalShow] = useState(false)
    const [startingRow, setStartingRow] = useState(1)
    const [endingRow, setEndingRow] = useState(1)
    const [selectedFile, setSelectedFile] = useState(null)
    const [isImportApiLoading, setIsImportApiLoading] = useState(false)

    // const [addProductModalShow, setAddProductModalShow] = useState(false)
    // const [productName, setProductName] = useState("")
    // const [manufacturerName, setManufacturerName] = useState("")
    // const [mrp, setMrp] = useState(0)
    // const [selectedProductType, setSelectedProductType] = useState(null)
    // const [serialArray, setSerialArray] = useState([])
    // const [serialInput, setSerialInput] = useState("")
    // const [isApiLoading, setIsApiLoading] = useState(false)

    const dropDownStyle = {
        option: (styles) => {
            return {
                ...styles,
                color: 'black'
            };
        }
    }

    useEffect(() => {
        getProductList(setProductList)
    }, [])

    // const handleSerialAdd = () => {
    //     if (serialInput.trim() === "") {
    //         Swal.fire('Oops!', 'Enter a serial first', 'warning');
    //         return
    //     }
    //     if (serialArray.includes(serialInput.trim())) {
    //         Swal.fire('Oops!', 'Duplicate serial entered', 'warning');
    //         return
    //     }
    //     setSerialArray([...serialArray, serialInput]);
    //     setSerialInput("");
    // }

    // const addNewProduct = () => {
    //     if (productName.trim() === "") {
    //         Swal.fire('Oops!!', 'Product Name cannot be empty', 'warning');
    //         return
    //     }
    //     if (manufacturerName.trim() === "") {
    //         Swal.fire('Oops!!', 'Manufacturer Name cannot be empty', 'warning');
    //         return
    //     }
    //     if (mrp <= 0) {
    //         Swal.fire('Oops!!', 'Product MRP has to be greater than 0', 'warning');
    //         return
    //     }
    //     if (selectedProductType === null) {
    //         Swal.fire('Oops!!', 'Choose a Product Type', 'warning');
    //         return
    //     }
    //     if (serialArray.length === 0) {
    //         Swal.fire('Oops!!', 'Add atleast 1 Product serial number', 'warning');
    //         return
    //     }

    //     let data = {
    //         product_name: productName,
    //         manufacturer_name: manufacturerName,
    //         mrp: mrp,
    //         product_type: selectedProductType.value,
    //         serial_array: serialArray
    //     }

    //     setIsApiLoading(true)
    //     axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/add-product`, data, { headers: { 'Content-Type': 'application/json' } })
    //         .then((res) => {
    //             setIsApiLoading(false)
    //             handleAddProductModalClose()
    //             if (res.data.operation === "success") {
    //                 Swal.fire('Success!', res.data.message, 'success');
    //             }
    //             else {
    //                 Swal.fire('Oops!', res.data.message, 'error');
    //             }
    //         })
    //         .catch((err) => {
    //             console.log(err)
    //             Swal.fire('Error!!', err.message, 'error');
    //         })

    // }

    // const handleAddProductModalClose = () => {
    //     setAddProductModalShow(false)

    //     setProductName("")
    //     setManufacturerName("")
    //     setMrp(0)
    //     setSelectedProductType(null)
    //     setSerialArray([])
    //     setSerialInput("")
    // }

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

        let data = new FormData()
        data.append("starting_row", startingRow)
        data.append("ending_row", endingRow)
        data.append("selected_file", selectedFile)

        // setIsImportApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/import-products`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then((res) => {
                setIsImportApiLoading(false)
                // handleImportProductModalClose()
                if (res.data.operation === "success") {
                    if (res.data.info.length === 0) {
                        Swal.fire('Success!', res.data.message, 'success');
                    }
                    else {
                        Swal.fire('Success!', `These serials were not added to database: ${res.data.info.join(", ")}`, 'success');
                    }
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

        setStartingRow(0)
        setEndingRow(0)
        setSelectedFile(null)
    }

    let tp = Math.ceil(productList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    return (
        <>
            <div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fs-5 p-3">Inventory List</span>
                    <div>
                        <button className="btn btn-info mx-2" onClick={() => { setImportProductModalShow(true) }}>Import</button>
                        <button className="btn btn-info mx-2" onClick={() => { console.log("exporting products") }}>Export</button>
                        {/* <button className="btn btn-primary mx-2" onClick={() => { setAddProductModalShow(true) }}>+ Add Product</button> */}
                    </div>
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
                            productList.length === 0 ? <tr><td colSpan={8} className="fs-4 text-center text-secondary">No products added</td></tr> :
                                productList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
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
                                            <td>{moment(x.created_at._seconds * 1000).format("lll")}</td>
                                            <td><button className="btn btn-primary">test</button></td>
                                        </tr>
                                    )
                                })
                        }
                    </tbody>
                    {
                        productList.length != 0 &&
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

            <Modal show={importProductModalShow} onHide={() => { handleImportProductModalClose() }} size="lg" centered >
                <Modal.Header closeButton>
                    <Modal.Title>Import Products</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="container">
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="col-form-label my-1" htmlFor="startingRow">Starting Row</label>
                                    <input type="number" id="startingRow" className="form-control" value={startingRow.toString()} onChange={(e) => { setStartingRow(e.target.value === "" ? 0 : parseInt(e.target.value)) }} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="col-form-label my-1" htmlFor="endingRow">Ending Row</label>
                                    <input type="number" id="endingRow" className="form-control" value={endingRow.toString()} onChange={(e) => { setEndingRow(e.target.value === "" ? 0 : parseInt(e.target.value)) }} />
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
                    <Button variant="success" disabled={isImportApiLoading} onClick={() => { !isImportApiLoading && importProducts() }}> {isImportApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : 'Submit'} </Button>
                    <Button onClick={() => { handleImportProductModalClose() }}>Close</Button>
                </Modal.Footer>
            </Modal >

            {/* <Modal show={addProductModalShow} onHide={() => { handleAddProductModalClose() }} size="lg" centered >
                <Modal.Header closeButton>
                    <Modal.Title>Add Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="container">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="col-form-label my-1" htmlFor="productName">Product Name</label>
                                    <input type="text" id="productName" className="form-control" value={productName} onChange={(e) => { setProductName(e.target.value) }} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="col-form-label my-1" htmlFor="manufacturerName">Manufacturer Name</label>
                                    <input type="text" id="manufacturerName" className="form-control" value={manufacturerName} onChange={(e) => { setManufacturerName(e.target.value) }} />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="col-form-label my-1" htmlFor="mrp">MRP</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input type="number" id="mrp" className="form-control" min="0" value={mrp.toString()} onChange={(e) => { setMrp(e.target.value === "" ? 0 : parseFloat(e.target.value)) }} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="col-form-label my-1" >Product Type</label>
                                    <Select
                                        options={["BTE", "RIC", "ITC", "CIC", "IIC"].map(x => ({ label: x, value: x }))}
                                        value={selectedProductType}
                                        onChange={(val) => { setSelectedProductType(val) }}
                                        styles={dropDownStyle}
                                        isClearable
                                        placeholder="Select Product Type"
                                    />
                                </div>
                            </div>
                        </div>

                        <label className="col-form-label my-1" >Serials</label>
                        <div className="row">
                            <div className="col-9">
                                <input type="text" className="form-control" style={{ flex: "9" }} value={serialInput}
                                    onChange={(e) => { setSerialInput(e.target.value) }}
                                    onKeyUp={(e) => {
                                        if (e.key === "Enter") {
                                            handleSerialAdd()
                                        }
                                    }}
                                    placeholder="Enter a Serial"
                                />
                            </div>
                            <div className="col-3">
                                <button className="btn btn-success" onClick={() => { handleSerialAdd() }} >+ Add</button>
                            </div>
                        </div>

                        <div className="d-flex flex-wrap">
                            {
                                serialArray.length === 0 ? <div className="p-2">No serials added</div> :
                                    serialArray.map((s, i) => {
                                        return (
                                            <div key={i} className="p-2">
                                                <button className="btn btn-outline-dark" onClick={() => {
                                                    let t = [...serialArray]
                                                    t.splice(i, 1)
                                                    setSerialArray(t)
                                                }}>
                                                    <span className="me-2">{s}</span>
                                                    <span className="text-danger">✖</span>
                                                </button>
                                            </div>
                                        )
                                    })
                            }
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" disabled={isApiLoading} onClick={() => { !isApiLoading && addNewProduct() }}> {isApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : 'Submit'} </Button>
                    <Button onClick={() => { handleAddProductModalClose() }}>Close</Button>
                </Modal.Footer>
            </Modal> */}

        </>
    )
}

export default Inventory