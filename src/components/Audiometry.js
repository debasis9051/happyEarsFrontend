import React, { useState, useEffect } from "react"
import { Dropdown, Tab, Tabs, FormCheck } from "react-bootstrap"
import axios from "axios";
import Swal from "sweetalert2"
import moment from "moment"
import Select from "react-select"

import { useFirebase } from "../contexts/firebase-context";
import { getAudiometryList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";
import { printAudiometryReport } from "../utils/printAudiometryReport"

const frequencyList = [250, 500, 1000, 2000, 4000, 6000, 8000]

const calculateHearingLoss = (frequencyData) => {
    let unit = Math.round((frequencyData.reduce((p, o) => { return [500, 1000, 2000].includes(o.frequency) ? p + o.decibal : p }, 0) / 3) * 1000) / 1000
    let color = "#000000"
    let text = ""

    if (unit <= 20) { color = "#129dd4"; text = "Normal Hearing"; }
    else if (unit <= 40) { color = "#68c8ee"; text = "Mild Hearing loss"; }
    else if (unit <= 70) { color = "#fab330"; text = "Moderate Hearing loss"; }
    else if (unit <= 90) { color = "#fc8e29"; text = "Severe Hearing loss"; }
    else { color = "#ff4255"; text = "Profound Hearing loss"; }

    return { unit, color, text }
}

const Audiometry = () => {
    const { currentUserInfo } = useFirebase()

    const [currentTab, setCurrentTab] = useState("tab1")

    const [audiometryList, setAudiometryList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    const [audiometryReportMode, setAudiometryReportMode] = useState("add")
    const [audiometryReportId, setAudiometryReportId] = useState(null)
    const [trialMode, setTrialMode] = useState(true)
    const [patientName, setPatientName] = useState("")
    const [patientAddress, setPatientAddress] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [age, setAge] = useState("")
    const [sex, setSex] = useState("male")
    const [testMachine, setTestMachine] = useState("")
    const [referredBy, setReferredBy] = useState("")
    const [audiometer, setAudiometer] = useState("")
    const [remarks, setRemarks] = useState("")
    const [complaint, setComplaint] = useState("")

    const [acLeftEarPta, setAcLeftEarPta] = useState({ masked: false, data: frequencyList.map(x => ({ frequency: x, decibal: 0 })) })
    const [acRightEarPta, setAcRightEarPta] = useState({ masked: false, data: frequencyList.map(x => ({ frequency: x, decibal: 0 })) })

    const [bcInput, setBcInput] = useState(false)
    const [bcLeftEarPta, setBcLeftEarPta] = useState({ masked: false, data: frequencyList.map(x => ({ frequency: x, decibal: 0 })) })
    const [bcRightEarPta, setBcRightEarPta] = useState({ masked: false, data: frequencyList.map(x => ({ frequency: x, decibal: 0 })) })

    const [tuningFork, setTuningFork] = useState(0)
    const [rinne, setRinne] = useState({ left: null, right: null })
    const [weber, setWeber] = useState({ left: null, right: null })

    const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("")
    const [recommendations, setRecommendations] = useState("")

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
        setAcLeftEarPta(audiometry_report_data.left_ear_pta)
        setAcRightEarPta(audiometry_report_data.right_ear_pta)

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

        for (let i = 0; i < acLeftEarPta.length; i++) {
            if (acLeftEarPta[i].decibal === 0) {
                Swal.fire('Oops!!', 'Decibal measurement cannot be 0', 'warning');
                return false
            }
        }
        for (let i = 0; i < acRightEarPta.length; i++) {
            if (acRightEarPta[i].decibal === 0) {
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
            left_ear_pta: acLeftEarPta,
            right_ear_pta: acRightEarPta,

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
        setAcLeftEarPta(frequencyList.map(x => ({ frequency: x, decibal: 0 })))
        setAcRightEarPta(frequencyList.map(x => ({ frequency: x, decibal: 0 })))

        setCurrentTab("tab1")
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
                                                                <td>{calculateHearingLoss(x.left_ear_pta).unit}</td>
                                                                <td>{calculateHearingLoss(x.right_ear_pta).unit}</td>
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
                                                                            <Dropdown.Item onClick={() => { printAudiometryReport(x.patient_name, x.age, x.sex, moment(x.created_at).format("DD-MM-YYYY"), x.test_machine, x.left_ear_pta, x.right_ear_pta, calculateHearingLoss(x.left_ear_pta), calculateHearingLoss(x.right_ear_pta)) }} >Print Report</Dropdown.Item>
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
                                        <div className="card-header rounded d-flex align-items-center justify-content-between">
                                            <h4 className="m-0">{audiometryReportMode === "add" ? "Add" : "Update"} Audiometry Report</h4>
                                            <div className="d-flex align-items-center gap-2">
                                                <h5 className="m-0">Trial Mode</h5>
                                                <FormCheck className="fs-4" type="switch" checked={trialMode} onChange={(e) => { setTrialMode(e.target.checked); }} />
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-6">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="patientName">Patient Name</label>
                                                        <input type="text" id="patientName" className="form-control" value={patientName} onChange={(e) => { setPatientName(e.target.value) }} />
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="contactNumber">Contact Number</label>
                                                        <input type="text" id="contactNumber" className="form-control" value={contactNumber} onChange={(e) => { setContactNumber(e.target.value) }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-xl-2 col-sm-6">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="age">Age</label>
                                                        <input type="text" id="age" className="form-control" value={age} onChange={(e) => { setAge(e.target.value) }} />
                                                    </div>
                                                </div>
                                                <div className="col-xl-3 col-sm-6">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required">Sex</label>
                                                        <div className="d-flex gap-1 text-white">
                                                            <div className={`px-3 py-2 rounded ${sex === "male" ? "bg-primary" : "bg-secondary"}`} style={{ cursor: "pointer" }} onClick={() => { setSex("male") }}>Male</div>
                                                            <div className={`px-3 py-2 rounded ${sex === "female" ? "bg-primary" : "bg-secondary"}`} style={{ cursor: "pointer" }} onClick={() => { setSex("female") }}>Female</div>
                                                            <div className={`px-3 py-2 rounded ${sex === "others" ? "bg-primary" : "bg-secondary"}`} style={{ cursor: "pointer" }} onClick={() => { setSex("others") }}>Others</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {
                                                    trialMode ?
                                                        <div className="col-xl-7">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required" htmlFor="testMachine">Test Machine</label>
                                                                <input type="text" id="testMachine" className="form-control" value={testMachine} onChange={(e) => { setTestMachine(e.target.value) }} />
                                                            </div>
                                                        </div>
                                                        :
                                                        <>
                                                            <div className="col-xl-3">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required" htmlFor="referredBy">Referred By</label>
                                                                    <input type="text" id="referredBy" className="form-control" value={referredBy} onChange={(e) => { setReferredBy(e.target.value) }} />
                                                                </div>
                                                            </div>
                                                            <div className="col-xl-4">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required" htmlFor="audiometer">Audiometer</label>
                                                                    <input type="text" id="audiometer" className="form-control" value={audiometer} onChange={(e) => { setAudiometer(e.target.value) }} />
                                                                </div>
                                                            </div>
                                                        </>
                                                }
                                            </div>
                                            <div className="row">
                                                <div className="col-6">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="patientAddress">Patient Address</label>
                                                        <textarea id="patientAddress" rows={3} className="form-control" value={patientAddress} onChange={(e) => { setPatientAddress(e.target.value) }} />
                                                    </div>
                                                </div>
                                                {
                                                    trialMode ?
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1" htmlFor="remarks">Remarks</label>
                                                                <textarea id="remarks" rows={3} className="form-control" value={remarks} onChange={(e) => { setRemarks(e.target.value) }} />
                                                            </div>
                                                        </div>
                                                        :
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1" htmlFor="complaint">Complaint</label>
                                                                <textarea id="complaint" rows={3} className="form-control" value={complaint} onChange={(e) => { setComplaint(e.target.value) }} />
                                                            </div>
                                                        </div>
                                                }
                                            </div>

                                            <h4 className="text-center mt-5">Air Conduction (AC)</h4>
                                            <div className="row">
                                                <div className="col-xl-6 text-center">
                                                    <h5 className="mt-3">Left Ear PTA</h5>
                                                    <AudiogramInput ptaData={acLeftEarPta} setPtaData={setAcLeftEarPta} />
                                                </div>

                                                <div className="col-xl-6 text-center">
                                                    <h5 className="mt-3">Right Ear PTA</h5>
                                                    <AudiogramInput ptaData={acRightEarPta} setPtaData={setAcRightEarPta} />
                                                </div>
                                            </div>

                                            <h4 className="text-center mt-5">Bone Conduction (BC)</h4>
                                            <FormCheck className="fs-4 text-center" type="switch" checked={bcInput} onChange={(e) => { setBcInput(e.target.checked); }} />
                                            {
                                                bcInput &&
                                                <div className="row">
                                                    <div className="col-xl-6 text-center">
                                                        <h5 className="mt-3">Left Ear PTA</h5>
                                                        <AudiogramInput ptaData={bcLeftEarPta} setPtaData={setBcLeftEarPta} />
                                                    </div>

                                                    <div className="col-xl-6 text-center">
                                                        <h5 className="mt-3">Right Ear PTA</h5>
                                                        <AudiogramInput ptaData={bcRightEarPta} setPtaData={setBcRightEarPta} />
                                                    </div>
                                                </div>
                                            }

                                            {
                                                !trialMode &&
                                                <>
                                                    <div className="row">
                                                        <div className="col-2">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required" htmlFor="tuningFork">Tuning Fork(Hz)</label>
                                                                <input type="number" id="tuningFork" className="form-control" value={tuningFork.toString()} onChange={(e) => { setTuningFork(e.target.value === "" ? 0 : e.target.value) }} />
                                                            </div>
                                                        </div>

                                                        <div className="col-5">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required">Rinne</label>
                                                                <div className="d-flex gap-2">
                                                                    <Select
                                                                        options={["Positive (+ve)", "Negative (-ve)"].map(x => ({ label: x, value: x }))}
                                                                        value={rinne.left === null ? null : { label: rinne.left, value: rinne.left }}
                                                                        onChange={(val) => { setRinne({ ...rinne, left: val.value }) }}
                                                                        styles={dropDownStyle}
                                                                        className="flex-grow-1"
                                                                        placeholder="Select..."
                                                                    />
                                                                    <Select
                                                                        options={["Positive (+ve)", "Negative (-ve)"].map(x => ({ label: x, value: x }))}
                                                                        value={rinne.right === null ? null : { label: rinne.right, value: rinne.right }}
                                                                        onChange={(val) => { setRinne({ ...rinne, right: val.value }) }}
                                                                        styles={dropDownStyle}
                                                                        className="flex-grow-1"
                                                                        placeholder="Select..."
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="col-5">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required">Weber</label>
                                                                <div className="d-flex gap-2">
                                                                    <Select
                                                                        options={["Left", "Center", "Right"].map(x => ({ label: x, value: x }))}
                                                                        value={weber.left === null ? null : { label: weber.left, value: weber.left }}
                                                                        onChange={(val) => { setWeber({ ...weber, left: val.value }) }}
                                                                        styles={dropDownStyle}
                                                                        className="flex-grow-1"
                                                                        placeholder="Select..."
                                                                    />
                                                                    <Select
                                                                        options={["Left", "Center", "Right"].map(x => ({ label: x, value: x }))}
                                                                        value={weber.right === null ? null : { label: weber.right, value: weber.right }}
                                                                        onChange={(val) => { setWeber({ ...weber, right: val.value }) }}
                                                                        styles={dropDownStyle}
                                                                        className="flex-grow-1"
                                                                        placeholder="Select..."
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required" htmlFor="provisionalDiagnosis">Provisional Diagnosis</label>
                                                                <textarea id="provisionalDiagnosis" rows={3} className="form-control" value={provisionalDiagnosis} onChange={(e) => { setProvisionalDiagnosis(e.target.value) }} />
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1" htmlFor="recommendations">Recommendations</label>
                                                                <textarea id="recommendations" rows={3} className="form-control" value={recommendations} onChange={(e) => { setRecommendations(e.target.value) }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            }
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

const AudiogramInput = ({ ptaData, setPtaData }) => {
    return (
        <div className="border border-5 border-primary rounded-5 px-5 d-inline-block">
            <div className="d-flex justify-content-center">
                <div className="px-1" style={{ fontSize: "smaller", writingMode: "tb", textOrientation: "upright" }}>frequency</div>
                <div className="py-3">
                    {
                        ptaData.data.map((x, i) => {
                            return (
                                <div key={i} className="row gx-0 align-items-center my-2">
                                    <div className="col-2 px-2">{x.frequency}</div>
                                    <div className="col-9 px-2 d-flex">
                                        <button className="btn btn-primary rounded-0 rounded-start fs-4" style={{ height: "40px", lineHeight: "10px" }} disabled={x.decibal === null || x.decibal <= 0} onClick={() => {
                                            let t = ptaData.data.map(x => ({ ...x }))
                                            t[i].decibal = t[i].decibal <= 0 ? 0 : t[i].decibal - 5
                                            setPtaData({ ...ptaData, data: t })
                                        }}>&ndash;</button>
                                        <input type={x.decibal === null ? "text" : "number"} className="form-control rounded-0"
                                            value={x.decibal === null ? "NR" : x.decibal.toString()}
                                            onChange={(e) => {
                                                let t = ptaData.data.map(x => ({ ...x }))
                                                t[i].decibal = e.target.value === "" ? 0 : parseInt(e.target.value) > 120 ? 120 : parseInt(e.target.value)
                                                setPtaData({ ...ptaData, data: t })
                                            }}
                                            onBlur={(e) => {
                                                let t = ptaData.data.map(x => ({ ...x }))
                                                t[i].decibal = Math.round(t[i].decibal / 5) * 5
                                                setPtaData({ ...ptaData, data: t })
                                            }}
                                            disabled={x.decibal === null}
                                        />
                                        <button className="btn btn-primary rounded-0 rounded-end fs-4" style={{ height: "40px", lineHeight: "10px" }} disabled={x.decibal === null || x.decibal >= 120} onClick={() => {
                                            let t = ptaData.data.map(x => ({ ...x }))
                                            t[i].decibal = t[i].decibal >= 120 ? 120 : t[i].decibal + 5
                                            setPtaData({ ...ptaData, data: t })
                                        }}>&#43;</button>
                                    </div>
                                    <div className={`col-1 px-2 rounded-circle ${x.decibal === null ? "bg-danger" : "bg-success"}`} style={{ width: "30px", height: "30px", cursor: "pointer" }}
                                        onClick={() => {
                                            let t = ptaData.data.map(x => ({ ...x }))
                                            t[i].decibal = t[i].decibal !== null ? null : 0
                                            setPtaData({ ...ptaData, data: t })
                                        }}
                                    ></div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
            <div className="my-2 d-flex align-items-center">
                <h5 className="m-0">Masked</h5>
                <FormCheck className="fs-4" type="switch" checked={ptaData.masked} onChange={(e) => { setPtaData({ ...ptaData, masked: e.target.checked }); }} />
                {
                    (() => {
                        let { unit, color, text } = calculateHearingLoss(ptaData.data)

                        return (
                            <>
                                <span className="mx-3 fw-bold">LHL - {Math.round(unit * 1000) / 1000}</span>
                                <span className="fw-bold p-2 rounded text-black" style={{ backgroundColor: color }}>{text}</span>
                            </>
                        )
                    })()
                }
            </div>
        </div>
    )
}

export default Audiometry