import React, { useState, useEffect } from "react"
import { Dropdown, Tab, Tabs } from "react-bootstrap"
import axios from "axios";
import Swal from "sweetalert2"
import moment from "moment"
// import Select from "react-select"

import { useFirebase } from "../contexts/firebase-context";
import { getAudiometryList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";
import { printAudiometryReport } from "../utils/printAudiometryReport"

const frequencyList = [250, 500, 1000, 2000, 4000, 6000, 8000]

const Audiometry = () => {
    const { currentUserInfo } = useFirebase()

    const [currentTab, setCurrentTab] = useState("tab1")

    const [audiometryList, setAudiometryList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    const [audiometryReportMode, setAudiometryReportMode] = useState("add")
    const [audiometryReportId, setAudiometryReportId] = useState(null)
    const [patientName, setPatientName] = useState("")
    const [patientAddress, setPatientAddress] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [age, setAge] = useState("")
    const [sex, setSex] = useState("male")
    const [testMachine, setTestMachine] = useState("")
    const [remarks, setRemarks] = useState("")
    const [leftEarPta, setLeftEarPta] = useState(frequencyList.map(x => ({ frequency: x, decibal: 0 })))
    const [rightEarPta, setRightEarPta] = useState(frequencyList.map(x => ({ frequency: x, decibal: 0 })))

    const [isAudiometryReportApiLoading, setIsAudiometryReportApiLoading] = useState(false)

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

    // const dropDownStyle = {
    //     option: (styles) => {
    //         return {
    //             ...styles,
    //             color: 'black'
    //         };
    //     },
    //     menu: (styles) => {
    //         return {
    //             ...styles,
    //             minWidth: "max-content"
    //         };
    //     }
    // }


    useEffect(() => {
        if (currentUserInfo !== null) {
            getAudiometryList(currentUserInfo, setAudiometryList)
        }
    }, [currentUserInfo])

    const updateAudiometryReportInit = (audiometry_report_data) => {
        setAudiometryReportMode("update");
        setAudiometryReportId(audiometry_report_data.id)
        setPatientName(audiometry_report_data.patient_name)
        setPatientAddress(audiometry_report_data.patient_address)
        setContactNumber(audiometry_report_data.contact_number)
        setAge(audiometry_report_data.age)
        setSex(audiometry_report_data.sex)
        setTestMachine(audiometry_report_data.test_machine)
        setRemarks(audiometry_report_data.remarks)
        setLeftEarPta(audiometry_report_data.left_ear_pta)
        setRightEarPta(audiometry_report_data.right_ear_pta)

        setCurrentTab("tab2")
    }

    const processAudiometryReport = () => {
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
        if (age === "") {
            Swal.fire('Oops!!', 'Age cannot be empty', 'warning');
            return false
        }
        if (testMachine === "") {
            Swal.fire('Oops!!', 'Test Machine cannot be empty', 'warning');
            return false
        }

        for (let i = 0; i < leftEarPta.length; i++) {
            if (leftEarPta[i].decibal === 0) {
                Swal.fire('Oops!!', 'Decibal measurement cannot be 0', 'warning');
                return false
            }
        }
        for (let i = 0; i < rightEarPta.length; i++) {
            if (rightEarPta[i].decibal === 0) {
                Swal.fire('Oops!!', 'Decibal measurement cannot be 0', 'warning');
                return false
            }
        }

        let data = {
            patient_name: patientName,
            patient_address: patientAddress,
            contact_number: contactNumber,
            age: age,
            sex: sex,
            test_machine: testMachine,
            remarks: remarks,
            left_ear_pta: leftEarPta,
            right_ear_pta: rightEarPta,

            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName
        }

        if (audiometryReportMode !== "add") data["audiometry_report_id"] = audiometryReportId

        setIsAudiometryReportApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/${audiometryReportMode === "add" ? "save-audiometry-report" : "update-audiometry-report"}`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsAudiometryReportApiLoading(false)
                if (res.data.operation === "success") {
                    getAudiometryList(currentUserInfo, setAudiometryList)
                    handleAudiometryReportClose()
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

    const handleAudiometryReportClose = () => {
        setAudiometryReportMode("add")
        setAudiometryReportId(null)
        setPatientName("")
        setPatientAddress("")
        setContactNumber("")
        setAge("")
        setSex("male")
        setTestMachine("")
        setRemarks("")
        setLeftEarPta(frequencyList.map(x => ({ frequency: x, decibal: 0 })))
        setRightEarPta(frequencyList.map(x => ({ frequency: x, decibal: 0 })))

        setCurrentTab("tab1")
    }

    const calculateHearingLoss = (frequencyData) => {
        return frequencyData.reduce((p, o) => { return [500, 1000, 2000].includes(o.frequency) ? p + o.decibal : p }, 0) / 3
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
                        <div className="container-fluid">
                            <Tabs className="mb-3" activeKey={currentTab}
                                onSelect={(k) => {
                                    setCurrentTab(k);
                                    if (k === "tab1") handleAudiometryReportClose();
                                }}
                            >
                                <Tab eventKey="tab1" title="Records">

                                    <div className="d-flex align-items-end px-3 py-2">
                                        <div className="d-flex mx-2">
                                            <button className="btn btn-secondary rounded-pill me-1" onClick={() => { setSearchBarState(!searchBarState); setSearchValue("") }}>
                                                <svg width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                                </svg>
                                            </button>
                                            <input type="text" className="form-control" style={searchBarState ? { transition: "all 1s" } : { transition: "all 1s", width: "0", padding: "0", opacity: "0", visibility: "hidden" }} placeholder="Search..." onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(0); }} />
                                        </div>

                                        <button className="btn btn-success ms-auto me-2" onClick={() => { setCurrentTab("tab2") }}>+ Add Audiometry Report</button>
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
                                                                <td>{Math.round(calculateHearingLoss(x.left_ear_pta) * 1000) / 1000}</td>
                                                                <td>{Math.round(calculateHearingLoss(x.right_ear_pta) * 1000) / 1000}</td>
                                                                <td>{moment.unix(x.created_at._seconds).format("lll")}</td>
                                                                <td>
                                                                    <Dropdown>
                                                                        <Dropdown.Toggle variant="primary">
                                                                            <svg width="16" height="16" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                                                                                <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                                                                            </svg>
                                                                        </Dropdown.Toggle>

                                                                        <Dropdown.Menu>
                                                                            <Dropdown.Item onClick={() => { updateAudiometryReportInit(x) }} >Edit Report </Dropdown.Item>
                                                                            <Dropdown.Item onClick={() => { printAudiometryReport(x.patient_name, x.age, x.sex, moment(x.created_at).format("DD-MM-YYYY"), x.test_machine, Math.round(calculateHearingLoss(x.left_ear_pta) * 1000) / 1000, Math.round(calculateHearingLoss(x.right_ear_pta) * 1000) / 1000, "left test", "right test") }} >Print Report</Dropdown.Item>
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

                                </Tab>
                                <Tab eventKey="tab2" title="Audiometry Report">

                                    <div className="container card container my-5 p-3">
                                        <div className="card-header rounded">
                                            <h4 className="m-0">{audiometryReportMode === "add" ? "Add" : "Update"} Audiometry Report</h4>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-xl-6">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="patientName">Patient Name</label>
                                                        <input type="text" id="patientName" className="form-control" value={patientName} onChange={(e) => { setPatientName(e.target.value) }} />
                                                    </div>
                                                </div>
                                                <div className="col-xl-6">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="contactNumber">Contact Number</label>
                                                        <input type="text" id="contactNumber" className="form-control" value={contactNumber} onChange={(e) => { setContactNumber(e.target.value) }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-xl-2">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="age">Age</label>
                                                        <input type="text" id="age" className="form-control" value={age} onChange={(e) => { setAge(e.target.value) }} />
                                                    </div>
                                                </div>
                                                <div className="col-xl-3">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="testMachine">Sex</label>
                                                        <div className="d-flex gap-1 text-white">
                                                            <div className={`px-3 py-2 rounded ${sex==="male"?"bg-primary":"bg-secondary"}`} style={{cursor:"pointer"}} onClick={()=>{setSex("male")}}>Male</div>
                                                            <div className={`px-3 py-2 rounded ${sex==="female"?"bg-primary":"bg-secondary"}`} style={{cursor:"pointer"}} onClick={()=>{setSex("female")}}>Female</div>
                                                            <div className={`px-3 py-2 rounded ${sex==="others"?"bg-primary":"bg-secondary"}`} style={{cursor:"pointer"}} onClick={()=>{setSex("others")}}>Others</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-xl-7">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="testMachine">Test Machine</label>
                                                        <input type="text" id="testMachine" className="form-control" value={testMachine} onChange={(e) => { setTestMachine(e.target.value) }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-xl-6">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="patientAddress">Patient Address</label>
                                                        <textarea id="patientAddress" rows={3} className="form-control" value={patientAddress} onChange={(e) => { setPatientAddress(e.target.value) }} />
                                                    </div>
                                                </div>
                                                <div className="col-xl-6">
                                                    <div className="form-group">
                                                        <label className="form-label my-1" htmlFor="remarks">Remarks</label>
                                                        <textarea id="remarks" rows={3} className="form-control" value={remarks} onChange={(e) => { setRemarks(e.target.value) }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-xl-6 text-center">
                                                    <h5 className="mt-3">Left Ear PTA</h5>
                                                    <div className="border border-5 border-primary rounded-5 px-5 d-inline-block">
                                                        <div className="d-flex justify-content-center">
                                                            <div className="px-1" style={{ fontSize: "smaller", writingMode: "tb", textOrientation: "upright" }}>frequency</div>
                                                            <div className="py-3">
                                                                {
                                                                    leftEarPta.map((x, i) => {
                                                                        return (
                                                                            <div key={i} className="row gx-0 align-items-center my-2">
                                                                                <div className="col-2 px-2">{x.frequency}</div>
                                                                                <div className="col-9 px-2 d-flex">
                                                                                    <button className="btn btn-primary rounded-0 rounded-start fs-4" style={{ height: "40px", lineHeight: "10px" }} disabled={x.decibal === null || x.decibal <= 0} onClick={() => {
                                                                                        let t = leftEarPta.map(x => ({ ...x }))
                                                                                        t[i].decibal = t[i].decibal <= 0 ? 0 : t[i].decibal - 5
                                                                                        setLeftEarPta(t)
                                                                                    }}>&ndash;</button>
                                                                                    <input type="number" className="form-control rounded-0"
                                                                                        value={(x.decibal === null ? "NR" : x.decibal).toString()}
                                                                                        onChange={(e) => {
                                                                                            let t = leftEarPta.map(x => ({ ...x }))
                                                                                            t[i].decibal = e.target.value === "" ? 0 : parseInt(e.target.value) > 120 ? 120 : parseInt(e.target.value)
                                                                                            setLeftEarPta(t)
                                                                                        }}
                                                                                        onBlur={(e) => {
                                                                                            let t = leftEarPta.map(x => ({ ...x }))
                                                                                            t[i].decibal = Math.round(t[i].decibal / 5) * 5
                                                                                            setLeftEarPta(t)
                                                                                        }}
                                                                                        disabled={x.decibal === null}
                                                                                    />
                                                                                    <button className="btn btn-primary rounded-0 rounded-end fs-4" style={{ height: "40px", lineHeight: "10px" }} disabled={x.decibal === null || x.decibal >= 120} onClick={() => {
                                                                                        let t = leftEarPta.map(x => ({ ...x }))
                                                                                        t[i].decibal = t[i].decibal >= 120 ? 120 : t[i].decibal + 5
                                                                                        setLeftEarPta(t)
                                                                                    }}>&#43;</button>
                                                                                </div>
                                                                                <div className={`col-1 px-2 rounded-circle ${x.decibal === null ? "bg-danger" : "bg-success"}`} style={{ width: "30px", height: "30px", cursor: "pointer" }}
                                                                                    onClick={() => {
                                                                                        let t = leftEarPta.map(x => ({ ...x }))
                                                                                        t[i].decibal = t[i].decibal !== null ? null : 0
                                                                                        setLeftEarPta(t)
                                                                                    }}
                                                                                ></div>
                                                                            </div>
                                                                        )
                                                                    })
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="my-2">{(() => {
                                                            let hl = calculateHearingLoss(leftEarPta)
                                                            let c = "#000000"
                                                            let t = ""

                                                            if (hl <= 20) { c = "#129dd4"; t = "Normal Hearing"; }
                                                            else if (hl <= 40) { c = "#68c8ee"; t = "Mild Hearing loss"; }
                                                            else if (hl <= 70) { c = "#fab330"; t = "Moderate Hearing loss"; }
                                                            else if (hl <= 90) { c = "#fc8e29"; t = "Severe Hearing loss"; }
                                                            else { c = "#ff4255"; t = "Profound Hearing loss"; }

                                                            return (
                                                                <>
                                                                    <span className="mx-3 fw-bold">LHL - {Math.round(hl * 1000) / 1000}</span>
                                                                    <span className="fw-bold p-2 rounded text-black" style={{ backgroundColor: c }}>{t}</span>
                                                                </>
                                                            )
                                                        })()}</div>
                                                    </div>
                                                </div>

                                                <div className="col-xl-6 text-center">
                                                    <h5 className="mt-3">Right Ear PTA</h5>
                                                    <div className="border border-5 border-primary rounded-5 px-5 d-inline-block">
                                                        <div className="d-flex justify-content-center">
                                                            <div className="px-1" style={{ fontSize: "smaller", writingMode: "tb", textOrientation: "upright" }}>frequency</div>
                                                            <div className="py-3">
                                                                {
                                                                    rightEarPta.map((x, i) => {
                                                                        return (
                                                                            <div key={i} className="row gx-0 align-items-center my-2">
                                                                                <div className="col-2 px-2">{x.frequency}</div>
                                                                                <div className="col-9 px-2 d-flex">
                                                                                    <button className="btn btn-primary rounded-0 rounded-start fs-4" style={{ height: "40px", lineHeight: "10px" }} disabled={x.decibal === null || x.decibal <= 0} onClick={() => {
                                                                                        let t = rightEarPta.map(x => ({ ...x }))
                                                                                        t[i].decibal = t[i].decibal <= 0 ? 0 : t[i].decibal - 5
                                                                                        setRightEarPta(t)
                                                                                    }}>&ndash;</button>
                                                                                    <input type="number" className="form-control rounded-0"
                                                                                        value={(x.decibal === null ? "NR" : x.decibal).toString()}
                                                                                        onChange={(e) => {
                                                                                            let t = rightEarPta.map(x => ({ ...x }))
                                                                                            t[i].decibal = e.target.value === "" ? 0 : parseInt(e.target.value) > 120 ? 120 : parseInt(e.target.value)
                                                                                            setRightEarPta(t)
                                                                                        }}
                                                                                        onBlur={(e) => {
                                                                                            let t = rightEarPta.map(x => ({ ...x }))
                                                                                            t[i].decibal = Math.round(t[i].decibal / 5) * 5
                                                                                            setRightEarPta(t)
                                                                                        }}
                                                                                        disabled={x.decibal === null}
                                                                                    />
                                                                                    <button className="btn btn-primary rounded-0 rounded-end fs-4" style={{ height: "40px", lineHeight: "10px" }} disabled={x.decibal === null || x.decibal >= 120} onClick={() => {
                                                                                        let t = rightEarPta.map(x => ({ ...x }))
                                                                                        t[i].decibal = t[i].decibal >= 120 ? 120 : t[i].decibal + 5
                                                                                        setRightEarPta(t)
                                                                                    }}>&#43;</button>
                                                                                </div>
                                                                                <div className={`col-1 px-2 rounded-circle ${x.decibal === null ? "bg-danger" : "bg-success"}`} style={{ width: "30px", height: "30px", cursor: "pointer" }}
                                                                                    onClick={() => {
                                                                                        let t = rightEarPta.map(x => ({ ...x }))
                                                                                        t[i].decibal = t[i].decibal !== null ? null : 0
                                                                                        setRightEarPta(t)
                                                                                    }}
                                                                                ></div>
                                                                            </div>
                                                                        )
                                                                    })
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="my-2">{(() => {
                                                            let hl = calculateHearingLoss(rightEarPta)
                                                            let c = "#000000"
                                                            let t = ""

                                                            if (hl <= 20) { c = "#129dd4"; t = "Normal Hearing"; }
                                                            else if (hl <= 40) { c = "#68c8ee"; t = "Mild Hearing loss"; }
                                                            else if (hl <= 70) { c = "#fab330"; t = "Moderate Hearing loss"; }
                                                            else if (hl <= 90) { c = "#fc8e29"; t = "Severe Hearing loss"; }
                                                            else { c = "#ff4255"; t = "Profound Hearing loss"; }

                                                            return (
                                                                <>
                                                                    <span className="mx-3 fw-bold">RHL - {Math.round(hl * 1000) / 1000}</span>
                                                                    <span className="fw-bold p-2 rounded text-black" style={{ backgroundColor: c }}>{t}</span>
                                                                </>
                                                            )
                                                        })()}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer rounded text-end">
                                            <button className="btn btn-success mx-2" disabled={isAudiometryReportApiLoading} onClick={() => { !isAudiometryReportApiLoading && processAudiometryReport() }}> {isAudiometryReportApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : (audiometryReportMode === "add" ? "Submit" : "Update")} </button>
                                            <button className="btn btn-danger mx-2" onClick={() => { handleAudiometryReportClose() }}>Close</button>
                                        </div>
                                    </div>

                                </Tab>
                            </Tabs>
                        </div>
                    </>
                </AuthWrapper>
            </div>
        </>
    )
}

export default Audiometry