import React, { useState, useEffect, useMemo } from "react"
import { Dropdown, Tab, Tabs, FormCheck } from "react-bootstrap"
import axios from "axios";
import Swal from "sweetalert2"
import moment from "moment"
import Select, { components } from "react-select"
import { Helmet } from "react-helmet-async";

import { useFirebase } from "../contexts/firebase-context";
import { getAudiometryList, getBranchList, getDoctorList, getPatientList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";
import { printAudiometryReport } from "../utils/printAudiometryReport"
import { ConfigurePatientsModal } from "./Patients";

const acConfig = [
    { frequency: 250, min: -10, max: 120 },
    { frequency: 500, min: -10, max: 120 },
    { frequency: 1000, min: -10, max: 120 },
    { frequency: 2000, min: -10, max: 120 },
    { frequency: 4000, min: -10, max: 120 },
    { frequency: 6000, min: -10, max: 120 },
    { frequency: 8000, min: -10, max: 100 }
]
const bcConfig = [
    { frequency: 250, min: -10, max: 80 },
    { frequency: 500, min: -10, max: 80 },
    { frequency: 1000, min: -10, max: 80 },
    { frequency: 2000, min: -10, max: 80 },
    { frequency: 4000, min: -10, max: 80 },
]


const calculateHearingLoss = (frequencyData) => {
    let readings = frequencyData.reduce((p, o) => {
        if ([500, 1000, 2000].includes(o.frequency)) { p[o.frequency] = o.decibal; return p }
        else { return p }
    }, {})

    let unit
    if (readings[500] === null) {
        unit = 0
    }
    else if (readings[1000] === null) {
        unit = readings[500] / 3
    }
    else if (readings[2000] === null) {
        unit = (readings[500] + readings[1000]) / 3
    }
    else {
        unit = (readings[500] + readings[1000] + readings[2000]) / 3
    }
    unit = Math.round(unit * 100) / 100

    // console.log(readings, unit)

    let color = "#000000"
    let text = ""

    if (unit <= 25) { color = "#b8eeaa"; text = "Normal Hearing"; }
    else if (unit <= 45) { color = "#d5eaae"; text = "Mild Hearing loss"; }
    else if (unit <= 55) { color = "#e9d1af"; text = "Moderate Hearing loss"; }
    else if (unit <= 70) { color = "#f3b2a1"; text = "Moderately-severe Hearing loss"; }
    else if (unit <= 90) { color = "#f5d6da"; text = "Severe Hearing loss"; }
    else { color = "#f6a2b3"; text = "Profound Hearing loss"; }

    return { unit, color, text }
}

const Audiometry = () => {
    const { currentUserInfo } = useFirebase()

    const [currentTab, setCurrentTab] = useState("tab1")

    const [branchList, setBranchList] = useState([])
    const [audiometryList, setAudiometryList] = useState([])
    const [doctorList, setDoctorList] = useState([])
    const [patientList, setPatientList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [branchFilter, setBranchFilter] = useState(null)


    const [audiometryReportMode, setAudiometryReportMode] = useState("add")
    const [audiometryReportId, setAudiometryReportId] = useState(null)
    const [trialMode, setTrialMode] = useState(true)

    const [selectedBranch, setSelectedBranch] = useState(null)
    const [date, setDate] = useState(moment().format("YYYY-MM-DD"))

    const [selectedPatient, setSelectedPatient] = useState(null)

    const [recommendedMachine, setRecommendedMachine] = useState("")
    const [clientChosenMachine, setClientChosenMachine] = useState("")
    const [remarks, setRemarks] = useState("")

    const [referredBy, setReferredBy] = useState("")
    const [audiometer, setAudiometer] = useState("")
    const [complaint, setComplaint] = useState("")

    const [acLeftEarPta, setAcLeftEarPta] = useState({ masked: false, data: acConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: acConfig })
    const [acRightEarPta, setAcRightEarPta] = useState({ masked: false, data: acConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: acConfig })

    const [bcInput, setBcInput] = useState(false)
    const [bcLeftEarPta, setBcLeftEarPta] = useState({ masked: false, data: bcConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: bcConfig })
    const [bcRightEarPta, setBcRightEarPta] = useState({ masked: false, data: bcConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: bcConfig })

    const [tuningFork, setTuningFork] = useState(null)
    const [rinne, setRinne] = useState({ left: null, right: null })
    const [weber, setWeber] = useState(null)
    const [selectedDoctor, setSelectedDoctor] = useState(null)

    const [provisionalDiagnosis, setProvisionalDiagnosis] = useState({ left: "", right: "" })
    const [recommendations, setRecommendations] = useState(["Aural Hygiene", "Follow Up", "Refer Back to Ent.", "Hearing Aid Trial and Fitting"])

    const [isAudiometryReportApiLoading, setIsAudiometryReportApiLoading] = useState(false)

    const [configurePatientModalShow, setConfigurePatientModalShow] = useState(false)


    const filteredAudiometryList = useMemo(() => {
        return branchFilter ? audiometryList.filter(x => x.branch_id === branchFilter.value).filter(x => {
            let pd = patientList.find(p => p.id === x.patient_id)
            if (searchBarState && searchValue !== "") {
                if (((new RegExp(searchValue, "gi")).test(pd.patient_name)) || ((new RegExp(searchValue, "gi")).test(pd.contact_number))) {
                    return true
                }
                return false
            }
            else {
                return true
            }
        }) : []
    }, [branchFilter, searchBarState, searchValue, audiometryList, patientList])

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
            getAudiometryList(currentUserInfo, setAudiometryList)
            getDoctorList(currentUserInfo, setDoctorList)
            getPatientList(currentUserInfo, setPatientList)
        }
    }, [currentUserInfo])

    useEffect(() => {
        if (branchList.length > 0) {
            let b = branchList.find(x => x.branch_invoice_code === "RANI")
            setBranchFilter({ label: b.branch_name, value: b.id })
        }
    }, [branchList])

    const getDoctorDetails = (doctor_id) => {
        return axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-doctor-details`, { doctor_id: doctor_id, current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                if (res.data.operation === "success") {
                    return res.data.info
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

    const updateAudiometryReportInit = (audiometry_report_data) => {
        setAudiometryReportMode("update");
        setAudiometryReportId(audiometry_report_data.id)
        setTrialMode(audiometry_report_data.trial_mode)

        setSelectedBranch({ label: branchList.find(x => x.id === audiometry_report_data.branch_id).branch_name, value: audiometry_report_data.branch_id })
        setDate(moment.unix(audiometry_report_data.date._seconds).format("YYYY-MM-DD"))

        setSelectedPatient({ label: patientList.find(x => x.id === audiometry_report_data.patient_id).patient_name, value: audiometry_report_data.patient_id })

        setAcLeftEarPta(audiometry_report_data.ac_left_ear_pta)
        setAcRightEarPta(audiometry_report_data.ac_right_ear_pta)

        setBcInput(audiometry_report_data.bc_input)
        setBcLeftEarPta(audiometry_report_data.bc_left_ear_pta)
        setBcRightEarPta(audiometry_report_data.bc_right_ear_pta)

        if (audiometry_report_data.trial_mode) {
            setRecommendedMachine(audiometry_report_data.recommended_machine)
            setClientChosenMachine(audiometry_report_data.client_chosen_machine)
            setRemarks(audiometry_report_data.remarks)
        }
        else {
            setReferredBy(audiometry_report_data.referred_by)
            setAudiometer(audiometry_report_data.audiometer)
            setComplaint(audiometry_report_data.complaint)

            setTuningFork(audiometry_report_data.tuning_fork)
            setRinne(audiometry_report_data.rinne)
            setWeber(audiometry_report_data.weber)
            if (audiometry_report_data.doctor_id) {
                setSelectedDoctor({ label: doctorList.find(x => x.id === audiometry_report_data.doctor_id).doctor_name, value: audiometry_report_data.doctor_id })
            }
            setProvisionalDiagnosis(audiometry_report_data.provisional_diagnosis)
            setRecommendations(audiometry_report_data.recommendations)
        }

        setCurrentTab("tab2")
    }

    const processAudiometryReport = () => {
        if (selectedBranch === null) {
            Swal.fire('Oops!!', 'Select a Branch', 'warning');
            return false
        }
        if (date === "") {
            Swal.fire('Oops!!', 'Date cannot be empty', 'warning');
            return false
        }
        if (selectedPatient === null) {
            Swal.fire('Oops!!', 'Select a Patient', 'warning');
            return false
        }

        if (trialMode) {
            if (recommendedMachine === "") {
                Swal.fire('Oops!!', 'Recommended Machine cannot be empty', 'warning');
                return false
            }
            if (clientChosenMachine === "") {
                Swal.fire('Oops!!', 'Client Chosen Machine cannot be empty', 'warning');
                return false
            }
        }
        else {
            if (referredBy === "") {
                Swal.fire('Oops!!', 'Referred By cannot be empty', 'warning');
                return false
            }
            if (audiometer === "") {
                Swal.fire('Oops!!', 'Audiometer cannot be empty', 'warning');
                return false
            }

            if (complaint === "") {
                Swal.fire('Oops!!', 'Complaint cannot be empty', 'warning');
                return false
            }

            if ((rinne.left === null) || (rinne.right === null)) {
                Swal.fire('Oops!!', 'Select values for All Rinne fields', 'warning');
                return false
            }
            if (weber === null) {
                Swal.fire('Oops!!', 'Weber cannot be empty', 'warning');
                return false
            }

            if (provisionalDiagnosis.left === "" || provisionalDiagnosis.right === "") {
                Swal.fire('Oops!!', 'Enter a Provisional Diagnosis for both ears', 'warning');
                return false
            }
            if (!recommendations.find(x => x !== "")) {
                Swal.fire('Oops!!', 'Enter at least 1 Recommendation', 'warning');
                return false
            }
        }

        let data = {
            trial_mode: trialMode,

            branch_id: selectedBranch.value,
            date: date,

            patient_id: selectedPatient.value,

            recommended_machine: trialMode ? recommendedMachine : null,
            client_chosen_machine: trialMode ? clientChosenMachine : null,
            remarks: trialMode ? remarks : null,

            referred_by: trialMode ? null : referredBy,
            audiometer: trialMode ? null : audiometer,
            complaint: trialMode ? null : complaint,

            ac_left_ear_pta: acLeftEarPta,
            ac_right_ear_pta: acRightEarPta,

            bc_input: bcInput,
            bc_left_ear_pta: bcLeftEarPta,
            bc_right_ear_pta: bcRightEarPta,

            tuning_fork: trialMode ? null : tuningFork,
            rinne: trialMode ? null : rinne,
            weber: trialMode ? null : weber,
            doctor_id: !trialMode && selectedDoctor ? selectedDoctor.value : null,

            provisional_diagnosis: trialMode ? null : provisionalDiagnosis,
            recommendations: trialMode ? null : recommendations.filter(x => x !== ""),

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
        setCurrentTab("tab1")

        setAudiometryReportMode("add")
        setAudiometryReportId(null)
        setTrialMode(true)

        clearAudiometryForm()
    }

    const clearAudiometryForm = () => {
        setSelectedBranch(null)
        setDate(moment().format("YYYY-MM-DD"))

        setSelectedPatient(null)

        setRecommendedMachine("")
        setClientChosenMachine("")
        setRemarks("")

        setReferredBy("")
        setAudiometer("")
        setComplaint("")

        setAcLeftEarPta({ masked: false, data: acConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: acConfig })
        setAcRightEarPta({ masked: false, data: acConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: acConfig })

        setBcInput(false)
        setBcLeftEarPta({ masked: false, data: bcConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: bcConfig })
        setBcRightEarPta({ masked: false, data: bcConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: bcConfig })

        setTuningFork(null)
        setRinne({ left: null, right: null })
        setWeber(null)
        setSelectedDoctor(null)

        setProvisionalDiagnosis({ left: "", right: "" })
        setRecommendations(["Aural Hygiene", "Follow Up", "Refer Back to Ent.", "Hearing Aid Trial and Fitting"])
    }

    let tp = Math.ceil(filteredAudiometryList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    return (
        <>
            <Helmet>
                <meta name="description" content="Happy Ears Kolkata is a React-powered app for efficient hearing care management, offering seamless invoice creation, inventory control, and secure patient data storage with integrated location tracking, created by Hritwick De. Audiometry Page used to record and calibrate hearing audiograms of patients" />
                <title>Audiometry | Happy Ears Kolkata Invoicing</title>
            </Helmet>

            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Audiometry</span>
                </div>

                <AuthWrapper page={"audiometry"}>
                    <>
                        <div className="container-fluid">
                            <Tabs className="mb-3" activeKey={currentTab}
                                onSelect={(k) => {
                                    if (k === "tab1") {
                                        handleAudiometryReportClose();
                                    }
                                    else {
                                        setCurrentTab(k);
                                    }
                                }}
                            >
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
                                                !patientList.length || !filteredAudiometryList.length ? <tr><td colSpan={7} className="fs-4 text-center text-secondary">No audiometry reports added</td></tr> :
                                                    filteredAudiometryList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                                        let patientDetails = patientList.find(p => p.id === x.patient_id)

                                                        return (
                                                            <tr key={i} className={i % 2 ? "table-secondary" : "table-light"}>
                                                                <td>{(currentPage * 10) + i + 1}</td>
                                                                <td>{patientDetails.patient_name}</td>
                                                                <td>{patientDetails.contact_number}</td>
                                                                <td>{calculateHearingLoss(x.ac_left_ear_pta.data).unit}</td>
                                                                <td>{calculateHearingLoss(x.ac_right_ear_pta.data).unit}</td>
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
                                                                            <Dropdown.Item href={`/generate-invoice/${x.id}`} >Generate Invoice </Dropdown.Item>
                                                                            <Dropdown.Item
                                                                                onClick={() => {
                                                                                    Swal.fire({
                                                                                        title: "Print with Header On/Off?",
                                                                                        showDenyButton: true,
                                                                                        showCancelButton: true,
                                                                                        confirmButtonText: "On",
                                                                                        denyButtonText: `Off`
                                                                                    }).then((result) => {
                                                                                        let h = result.isConfirmed ? true : result.isDenied ? false : null

                                                                                        if (h !== null) {
                                                                                            if (!x.trial_mode && x.doctor_id) {
                                                                                                getDoctorDetails(x.doctor_id)
                                                                                                    .then((doctor_details) => {
                                                                                                        printAudiometryReport(x, patientDetails, calculateHearingLoss, h, doctor_details, branchList)
                                                                                                    })
                                                                                            }
                                                                                            else {
                                                                                                printAudiometryReport(x, patientDetails, calculateHearingLoss, h, null, branchList)
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }}
                                                                            >Print Report
                                                                            </Dropdown.Item>
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
                                                <FormCheck className="fs-4" type="switch" disabled={audiometryReportMode === "update"} checked={trialMode} onChange={(e) => { setTrialMode(e.target.checked); clearAudiometryForm(); }} />
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required">Branch</label>
                                                        <Select
                                                            options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                                                            value={selectedBranch}
                                                            onChange={(val) => { setSelectedBranch(val); }}
                                                            isDisabled={audiometryReportMode === "update"}
                                                            styles={dropDownStyle}
                                                            placeholder="Select a Branch..."
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="date">Date</label>
                                                        <input type="date" id="date" className="form-control" value={date} onChange={(e) => { setDate(e.target.value) }} />
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required">Patient</label>
                                                        <Select
                                                            options={patientList.map(x => ({ label: x.patient_name, value: x.id }))}
                                                            value={selectedPatient}
                                                            onChange={(val) => { setSelectedPatient(val); }}
                                                            isDisabled={audiometryReportMode === "update"}
                                                            styles={dropDownStyle}
                                                            placeholder="Select a Patient..."
                                                            components={{
                                                                Menu: ({ children, ...props }) => (
                                                                    <components.Menu {...props}>
                                                                        {children}
                                                                        <div className="text-center p-2">
                                                                            <button className="btn btn-success" onClick={() => { setConfigurePatientModalShow(true) }}>+ Add Patient</button>
                                                                        </div>
                                                                    </components.Menu>
                                                                )
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row">
                                                {
                                                    trialMode ?
                                                        <>
                                                            <div className="col-6">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required" htmlFor="recommendedMachine">Recommended Machine</label>
                                                                    <input type="text" id="recommendedMachine" className="form-control" value={recommendedMachine} onChange={(e) => { setRecommendedMachine(e.target.value) }} />
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required" htmlFor="clientChosenMachine">Client Chosen Machine</label>
                                                                    <input type="text" id="clientChosenMachine" className="form-control" value={clientChosenMachine} onChange={(e) => { setClientChosenMachine(e.target.value) }} />
                                                                </div>
                                                            </div>
                                                        </>
                                                        :
                                                        <>
                                                            <div className="col-6">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required" htmlFor="referredBy">Referred By</label>
                                                                    <input type="text" id="referredBy" className="form-control" value={referredBy} onChange={(e) => { setReferredBy(e.target.value) }} />
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required">Audiometer</label>
                                                                    <Select
                                                                        options={["Proton DX5", "Proton DX3"].map(x => ({ label: x, value: x }))}
                                                                        value={audiometer ? { label: audiometer, value: audiometer } : null}
                                                                        onChange={(val) => { setAudiometer(val.value); }}
                                                                        styles={dropDownStyle}
                                                                        placeholder="Select an Audiometer..."
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>
                                                }
                                            </div>

                                            <div className="row">
                                                {
                                                    trialMode ?
                                                        <div className="col-12">
                                                            <div className="form-group">
                                                                <label className="form-label my-1" htmlFor="remarks">Remarks</label>
                                                                <textarea id="remarks" rows={3} className="form-control" value={remarks} onChange={(e) => { setRemarks(e.target.value) }} />
                                                            </div>
                                                        </div>
                                                        :
                                                        <div className="col-12">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required" htmlFor="complaint">Complaint</label>
                                                                <textarea id="complaint" rows={3} maxLength={150} className="form-control" value={complaint} onChange={(e) => { setComplaint(e.target.value) }} />
                                                            </div>
                                                        </div>
                                                }
                                            </div>

                                            <br />
                                            <h4 className="text-center my-2">Air Conduction (AC)</h4>
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
                                            <br />
                                            <h4 className="text-center my-2">Bone Conduction (BC)</h4>
                                            <FormCheck className="fs-4 text-center" type="switch" checked={bcInput} onChange={(e) => { setBcInput(e.target.checked); setBcLeftEarPta({ masked: false, data: bcConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: bcConfig }); setBcRightEarPta({ masked: false, data: bcConfig.map(x => ({ frequency: x.frequency, decibal: 0 })), config: bcConfig }); }} />
                                            {
                                                bcInput &&
                                                <div className="row">
                                                    <div className="col-xl-6 text-center">
                                                        <h5 className="mt-3">Left Ear PTA</h5>
                                                        <AudiogramInput ptaData={bcLeftEarPta} setPtaData={setBcLeftEarPta} hearingLossRatingPanel={false} />
                                                    </div>

                                                    <div className="col-xl-6 text-center">
                                                        <h5 className="mt-3">Right Ear PTA</h5>
                                                        <AudiogramInput ptaData={bcRightEarPta} setPtaData={setBcRightEarPta} hearingLossRatingPanel={false} />
                                                    </div>
                                                </div>
                                            }
                                            <br />

                                            {
                                                !trialMode &&
                                                <>
                                                    <div className="row">
                                                        <div className="col-4">
                                                            <div className="form-group">
                                                                <label className="form-label my-1">Tuning Fork(Hz)</label>
                                                                <Select
                                                                    options={["520(hz)", "256(hz)"].map(x => ({ label: x, value: x }))}
                                                                    value={tuningFork === null ? null : { label: tuningFork, value: tuningFork }}
                                                                    onChange={(val) => { setTuningFork(val.value) }}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select Tuning Fork..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-4">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required">Rinne (Left)</label>
                                                                <Select
                                                                    options={["Positive (+ve)", "Negative (-ve)"].map(x => ({ label: x, value: x }))}
                                                                    value={rinne.left === null ? null : { label: rinne.left, value: rinne.left }}
                                                                    onChange={(val) => { setRinne({ ...rinne, left: val.value }) }}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-4">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required">Rinne (Right)</label>
                                                                <Select
                                                                    options={["Positive (+ve)", "Negative (-ve)"].map(x => ({ label: x, value: x }))}
                                                                    value={rinne.right === null ? null : { label: rinne.right, value: rinne.right }}
                                                                    onChange={(val) => { setRinne({ ...rinne, right: val.value }) }}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1">Doctor</label>
                                                                <Select
                                                                    options={doctorList.map(x => ({ label: x.doctor_name, value: x.id }))}
                                                                    value={selectedDoctor}
                                                                    onChange={(val) => { setSelectedDoctor(val); }}
                                                                    isClearable
                                                                    isDisabled={audiometryReportMode === "update"}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select a Doctor..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required">Weber</label>
                                                                <Select
                                                                    options={["Left", "Center", "Right"].map(x => ({ label: x, value: x }))}
                                                                    value={weber === null ? null : { label: weber, value: weber }}
                                                                    onChange={(val) => { setWeber(val.value) }}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required" htmlFor="provisionalDiagnosisLeft">Provisional Diagnosis (Left)</label>
                                                                <textarea id="provisionalDiagnosisLeft" rows={3} maxLength={80} className="form-control" value={provisionalDiagnosis.left} onChange={(e) => { setProvisionalDiagnosis({ ...provisionalDiagnosis, left: e.target.value }) }} />
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required" htmlFor="provisionalDiagnosisRight">Provisional Diagnosis (Right)</label>
                                                                <textarea id="provisionalDiagnosisRight" rows={3} maxLength={80} className="form-control" value={provisionalDiagnosis.right} onChange={(e) => { setProvisionalDiagnosis({ ...provisionalDiagnosis, right: e.target.value }) }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-12">
                                                            <label className="form-label my-1 required" htmlFor="recommendations">Recommendations</label>
                                                            {
                                                                recommendations.map((x, i) => {
                                                                    return (
                                                                        <div key={i} className="d-flex align-items-center gap-5 my-2">
                                                                            <input type="text" className="form-control" maxLength={30} value={x}
                                                                                onChange={(e) => {
                                                                                    let t = [...recommendations]
                                                                                    t.splice(i, 1, e.target.value)
                                                                                    setRecommendations(t)
                                                                                }}
                                                                            />
                                                                            {
                                                                                recommendations.length > 1 &&
                                                                                <button className="btn btn-outline-danger rounded-pill" onClick={() => {
                                                                                    let t = [...recommendations]
                                                                                    t.splice(i, 1)
                                                                                    setRecommendations(t)
                                                                                }}>
                                                                                    <span className="">✖</span>
                                                                                </button>
                                                                            }
                                                                        </div>
                                                                    )
                                                                })
                                                            }
                                                            {recommendations.length < 4 && <button className="btn btn-primary" onClick={() => { setRecommendations([...recommendations, ""]) }}>+ Add</button>}
                                                        </div>
                                                    </div>
                                                </>
                                            }
                                        </div>
                                        <div className="card-footer rounded text-end">
                                            <button className="btn btn-success mx-2" disabled={isAudiometryReportApiLoading}
                                                onClick={() => {
                                                    if (isAudiometryReportApiLoading) return;

                                                    Swal.fire({
                                                        title: "Final Confirmation",
                                                        text: `Are you sure? ${audiometryReportMode === "add" && !trialMode && !selectedDoctor ? "The Doctor has not been Selected" : ""}`,
                                                        showCancelButton: true,
                                                        confirmButtonText: "Print",
                                                    }).then((result) => {
                                                        if (result.isConfirmed) {
                                                            processAudiometryReport()
                                                        }
                                                    });
                                                }}
                                            >
                                                {
                                                    isAudiometryReportApiLoading ?
                                                        <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> :
                                                        (audiometryReportMode === "add" ? "Submit" : "Update")
                                                }
                                            </button>
                                            <button className="btn btn-danger mx-2" onClick={() => { handleAudiometryReportClose() }}>Close</button>
                                        </div>
                                    </div>

                                </Tab>
                            </Tabs>
                        </div>
                    </>
                </AuthWrapper>
            </div>

            <ConfigurePatientsModal
                configurePatientModalShow={configurePatientModalShow}
                currentUserInfo={currentUserInfo}
                apiEndCallback={(responseData) => { getPatientList(currentUserInfo, setPatientList); setSelectedPatient({ label: responseData.patient_name, value: responseData.patient_id }); }}
                modalCloseCallback={() => { setConfigurePatientModalShow(false); }}
                patientData={null}
            />
        </>
    )
}

const AudiogramInput = ({ ptaData, setPtaData, hearingLossRatingPanel = true }) => {
    return (
        <div className="border border-5 border-primary rounded-5 px-4 d-inline-block">
            <div className="d-flex justify-content-center">
                <div className="px-1" style={{ fontSize: "smaller", writingMode: "tb", textOrientation: "upright" }}>frequency</div>
                <div className="py-3">
                    {
                        ptaData.data.map((x, i) => {

                            let t = ptaData.config.find(y => y.frequency === x.frequency)
                            let min = t.min
                            let max = t.max

                            return (
                                <div key={i} className="row gx-0 align-items-center my-2">
                                    <div className="col-2 px-2">{x.frequency}</div>
                                    <div className="col-9 px-2 d-flex">
                                        <button className="btn btn-primary rounded-0 rounded-start fs-4" style={{ height: "40px", lineHeight: "10px" }} disabled={x.decibal === null || x.decibal <= min} onClick={() => {
                                            let t = ptaData.data.map(x => ({ ...x }))
                                            t[i].decibal = t[i].decibal <= min ? min : t[i].decibal - 5
                                            setPtaData({ ...ptaData, data: t })
                                        }}>&ndash;</button>
                                        <input type={x.decibal === null ? "text" : "number"} className="form-control rounded-0"
                                            value={x.decibal === null ? "NR" : x.decibal.toString()}
                                            onChange={(e) => {
                                                let t = ptaData.data.map(x => ({ ...x }))
                                                t[i].decibal = e.target.value === "" ? 0 : parseInt(e.target.value) > max ? max : parseInt(e.target.value) < min ? min : parseInt(e.target.value)
                                                setPtaData({ ...ptaData, data: t })
                                            }}
                                            onBlur={(e) => {
                                                let t = ptaData.data.map(x => ({ ...x }))
                                                t[i].decibal = Math.round(t[i].decibal / 5) * 5
                                                setPtaData({ ...ptaData, data: t })
                                            }}
                                            disabled={x.decibal === null}
                                        />
                                        <button className="btn btn-primary rounded-0 rounded-end fs-4" style={{ height: "40px", lineHeight: "10px" }} disabled={x.decibal === null || x.decibal >= max} onClick={() => {
                                            let t = ptaData.data.map(x => ({ ...x }))
                                            t[i].decibal = t[i].decibal >= max ? max : t[i].decibal + 5
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
            <div className="my-2 d-flex align-items-center justify-content-center">
                <h5 className="m-0">Masked</h5>
                <FormCheck className="fs-4" type="switch" checked={ptaData.masked} onChange={(e) => { setPtaData({ ...ptaData, masked: e.target.checked }); }} />
                {
                    hearingLossRatingPanel &&
                    (() => {
                        let { unit, color, text } = calculateHearingLoss(ptaData.data)

                        return (
                            <div>
                                <span className="mx-3 fw-bold">LHL - {Math.round(unit * 1000) / 1000}</span>
                                <span className="fw-bold p-2 rounded text-black text-nowrap" style={{ backgroundColor: color }}>{text}</span>
                            </div>
                        )
                    })()
                }
            </div>
        </div>
    )
}

export default Audiometry