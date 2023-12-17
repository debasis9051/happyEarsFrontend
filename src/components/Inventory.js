import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
import Select from "react-select"
import axios from "axios";
import Swal from "sweetalert2"

const Inventory = () => {

    const [productList, setProductList] = useState([])

    const [addProductModalShow, setAddProductModalShow] = useState(false)
    const [productName, setProductName] = useState("")
    const [manufacturerName, setManufacturerName] = useState("")
    const [mrp, setMrp] = useState(0)
    const [selectedProductType, setSelectedProductType] = useState(null)
    const [serialArray, setSerialArray] = useState([])
    const [serialInput, setSerialInput] = useState("")
    const [isApiLoading, setIsApiLoading] = useState(false)

    const dropDownStyle = {
        option: (styles) => {
            return {
                ...styles,
                color: 'black'
            };
        }
    }

    useEffect(() => {
        //api call to get products
        // setProductList()
    }, [])

    const handleSerialAdd = () => {
        if (serialInput.trim() === "") {
            Swal.fire('Oops!', 'Enter a serial first', 'warning');
            return
        }
        if (serialArray.includes(serialInput.trim())) {
            Swal.fire('Oops!', 'Duplicate serial entered', 'warning');
            return
        }
        setSerialArray([...serialArray, serialInput]);
        setSerialInput("");
    }

    const addNewProduct = () => {
        if (productName.trim() === "") {
            Swal.fire('Oops!!', 'Product Name cannot be empty', 'warning');
            return
        }
        if (manufacturerName.trim() === "") {
            Swal.fire('Oops!!', 'Manufacturer Name cannot be empty', 'warning');
            return
        }
        if (mrp <= 0) {
            Swal.fire('Oops!!', 'Product MRP has to be greater than 0', 'warning');
            return
        }
        if (selectedProductType === null) {
            Swal.fire('Oops!!', 'Choose a Product Type', 'warning');
            return
        }
        if (serialArray.length === 0) {
            Swal.fire('Oops!!', 'Add atleast 1 Product serial number', 'warning');
            return
        }

        let data = {
            product_name: productName,
            manufacturer_name: manufacturerName,
            mrp: mrp,
            product_type: selectedProductType.value,
            serial_array: serialArray
        }

        setIsApiLoading(true)
        axios.post("http://localhost:4000/add-product", data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsApiLoading(false)
                handleAddProductModalClose()
                if (res.data.operation === "success") {
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

    const handleAddProductModalClose = () => {
        setAddProductModalShow(false)

        setProductName("")
        setManufacturerName("")
        setMrp(0)
        setSelectedProductType(null)
        setSerialArray([])
        setSerialInput("")
    }

    return (
        <>
            <div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fs-5 p-3">Inventory List</span>
                    <div>
                        <button className="btn btn-info mx-2" onClick={() => { console.log("importing products") }}>Import</button>
                        <button className="btn btn-info mx-2" onClick={() => { console.log("exporting products") }}>Export</button>
                        <button className="btn btn-primary mx-2" onClick={() => { setAddProductModalShow(true) }}>+ Add Product</button>
                    </div>
                </div>

                <table className="table table-hover rounded">
                    <thead>
                        <tr className="table-dark">
                            <th scope="col">Sl. No.</th>
                            <th scope="col">Product Name</th>
                            <th scope="col">Quantity</th>
                            <th scope="col">MRP</th>
                            <th scope="col">Type</th>
                            <th scope="col">Manufacturer</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="table-secondary">
                            {/* table-light */}
                            <td>Column content</td>
                            <td>Column content</td>
                            <td>Column content</td>
                            <td>Column content</td>
                            <td>Column content</td>
                            <td>Column content</td>
                            <td>Column content</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <Modal show={addProductModalShow} onHide={() => { handleAddProductModalClose() }} size="lg" centered >
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
            </Modal>
        </>
    )
}

export default Inventory