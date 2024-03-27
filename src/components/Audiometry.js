import React, { useState, useEffect } from "react"
import { Modal, Button, Dropdown } from "react-bootstrap"
import Select from "react-select"
import axios from "axios";
import Swal from "sweetalert2"
import moment from "moment"

import { useFirebase } from "../contexts/firebase-context";
import { getAudiometryList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";

const frequencyList = [250, 500, 1000, 2000, 4000, 6000, 8000]

const Audiometry = () => {
    const { currentUserInfo } = useFirebase()

    const [audiometryList, setAudiometryList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    const [addAudiometryReportModalShow, setAddAudiometryReportModalShow] = useState(false)
    const [patientName, setPatientName] = useState("")
    const [patientAddress, setPatientAddress] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [remarks, setRemarks] = useState("")
    const [leftEarPta, setLeftEarPta] = useState(frequencyList.map(x => ({ frequency: x, decibal: 0 })))
    const [rightEarPta, setRightEarPta] = useState(frequencyList.map(x => ({ frequency: x, decibal: 0 })))
    const [isAddAudiometryReportApiLoading, setIsAddAudiometryReportApiLoading] = useState(false)

    const filteredAudiometryList = audiometryList.filter(x => {
        if (searchBarState && searchValue !== "") {
            if (((new RegExp(searchValue, "gi")).test(x.patient_name)) || ((new RegExp(searchValue, "gi")).test(x.contact_number))) {
                return true
            }
            return false
        }
        else {
            return true
        }
    })

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
            getAudiometryList(currentUserInfo, setAudiometryList)
        }
    }, [currentUserInfo])

    const addAudiometryReport = () => {
        // if (productName === "") {
        //     Swal.fire('Oops!!', 'Enter a valid Product Name', 'warning');
        //     return
        // }
        // if (serialNumber.trim() === "") {
        //     Swal.fire('Oops!!', 'Enter a valid Serial Number', 'warning');
        //     return
        // }
        // if (manufacturer === "") {
        //     Swal.fire('Oops!!', 'Enter a valid Manufacturer', 'warning');
        //     return
        // }
        // if (mrp <= 0) {
        //     Swal.fire('Oops!!', 'MRP has to be a positive number', 'warning');
        //     return
        // }
        // if (selectedBranch === null) {
        //     Swal.fire('Oops!!', 'Select a Branch for the product', 'warning');
        //     return
        // }

        // let data = {
        //     product_name: productName,
        //     serial_number: serialNumber,
        //     manufacturer: manufacturer,
        //     mrp: mrp,
        //     branch_id: selectedBranch.value,

        //     current_user_uid: currentUserInfo.uid,
        //     current_user_name: currentUserInfo.displayName
        // }

        // setIsAddProductApiLoading(true)
        // axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/add-product`, data, { headers: { 'Content-Type': 'application/json' } })
        //     .then((res) => {
        //         setIsAddProductApiLoading(false)
        //         if (res.data.operation === "success") {
        //             getAudiometryList(currentUserInfo, setAudiometryList)
        //             handleAddProductModalClose()
        //             Swal.fire('Success!', res.data.message, 'success');
        //         }
        //         else {
        //             Swal.fire('Oops!', res.data.message, 'error');
        //         }
        //     })
        //     .catch((err) => {
        //         console.log(err)
        //         Swal.fire('Error!!', err.message, 'error');
        //     })
    }

    const handleAddAudiometryReportModalClose = () => {
        setAddAudiometryReportModalShow(false)

        // setProductName("")
        // setSerialNumber("")
        // setManufacturer("")
        // setMrp(0)
        // setSelectedBranch(null)
    }

    let tp = Math.ceil(filteredAudiometryList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    return (
        <>
            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Audiometry</span>
                </div>

                <AuthWrapper>
                    <>
                        <div className="d-flex align-items-end px-3 py-2">
                            <div className="d-flex mx-2">
                                <button className="btn btn-secondary rounded-pill me-1" onClick={() => { setSearchBarState(!searchBarState); setSearchValue("") }}>
                                    <svg width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                    </svg>
                                </button>
                                <input type="text" className="form-control" style={searchBarState ? { transition: "all 1s" } : { transition: "all 1s", width: "0", padding: "0", opacity: "0", visibility: "hidden" }} placeholder="Search..." onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(0); }} />
                            </div>

                            <button className="btn btn-success ms-auto me-2" onClick={() => { setAddAudiometryReportModalShow(true) }}>+ Add Audiometry Report</button>
                        </div>

                        <table className="table table-hover m-auto align-middle" style={{ width: "97%" }}>
                            <thead>
                                <tr className="table-dark">
                                    <th scope="col">Sl. No.</th>
                                    <th scope="col">Patient Name</th>
                                    <th scope="col">Contact Number</th>
                                    <th scope="col">LHL(db)</th>
                                    <th scope="col">RHL(db)</th>
                                    <th scope="col">Added On</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    filteredAudiometryList.length === 0 ? <tr><td colSpan={8} className="fs-4 text-center text-secondary">No audiometry reports added</td></tr> :
                                        filteredAudiometryList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                            return (
                                                <tr key={i} className={i % 2 ? "table-secondary" : "table-light"}>
                                                    <td>{(currentPage * 10) + i + 1}</td>
                                                    <td>{x.patient_name}</td>
                                                    <td>{x.contact_number}</td>
                                                    <td>{100}</td>
                                                    <td>{100}</td>
                                                    <td>{moment.unix(x.created_at._seconds).format("lll")}</td>
                                                    <td>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="primary">
                                                                <svg width="16" height="16" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                                                                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                                                                </svg>
                                                            </Dropdown.Toggle>

                                                            <Dropdown.Menu>
                                                                <Dropdown.Item onClick={() => { Swal.fire('Oops!!', 'This feature id not ready yet', 'warning'); }} >View Report </Dropdown.Item>
                                                                <Dropdown.Item onClick={() => { Swal.fire('Oops!!', 'This feature id not ready yet', 'warning'); }} >Edit Report </Dropdown.Item>
                                                                <Dropdown.Item onClick={() => { Swal.fire('Oops!!', 'This feature id not ready yet', 'warning'); }} >Print Report</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                }
                            </tbody>
                            {
                                filteredAudiometryList.length !== 0 &&
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

            <Modal show={addAudiometryReportModalShow} onHide={() => { handleAddAudiometryReportModalClose() }} size="xl" centered >
                <Modal.Header closeButton>
                    <Modal.Title>Add a Audiometry Report</Modal.Title>
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
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label className="form-label my-1" htmlFor="remarks">Remarks</label>
                                    <textarea id="remarks" rows={3} className="form-control" value={remarks} onChange={(e) => { setRemarks(e.target.value) }} />
                                </div>
                            </div>
                        </div>

                        <div className="row mb-1">
                            <div className="col-md-6">
                                {/* <div className="form-group"> */}
                                {/* <label for="leftEarPta" className="form-label">Left Ear PTA</label> */}
                                <div className="d-flex">
                                    {
                                        leftEarPta.map((x, i) => {
                                            return (
                                                <div>
                                                    <div style={{transform: "rotate(270deg)", width: "100px"}}>
                                                        <input key={i} type="range" className="form-range"  min="0" max="120" step="5"
                                                            value={x.decibal}
                                                            onChange={(e) => {
                                                                let t = leftEarPta.map(x => ({ ...x }))
                                                                t[i].decibal = parseInt(e.target.value)
                                                                setLeftEarPta(t)
                                                            }}
                                                        />
                                                    </div>
                                                    <div>{x.frequency}</div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                                {/* </div> */}
                            </div>
                            <div className="col-md-6">
                                {/* <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="serialNumber">Serial Number</label>
                                    <input type="text" id="serialNumber" className="form-control" value={serialNumber} onChange={(e) => { setSerialNumber(e.target.value) }} placeholder="Enter Serial Number" />
                                </div> */}
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" disabled={isAddAudiometryReportApiLoading} onClick={() => { !isAddAudiometryReportApiLoading && addAudiometryReport() }}> {isAddAudiometryReportApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : 'Submit'} </Button>
                    <Button onClick={() => { handleAddAudiometryReportModalClose() }}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default Audiometry