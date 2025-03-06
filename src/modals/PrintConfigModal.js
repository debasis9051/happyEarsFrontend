import React, { useState } from "react"
import { Modal, Button } from 'react-bootstrap';

import { useModal } from "../contexts/modal-context";

const PrintConfigModal = () => {

    const { modalShow, modalData, closeModal } = useModal()

    const [printConfigData, setPrintConfigData] = useState({ header: true, footer: true })

    const handleCloseModal = () => {
        setPrintConfigData({ header: true, footer: true })
        closeModal()
    }

    return (
        <Modal show={modalShow} centered onHide={() => { handleCloseModal() }} >
            <Modal.Header closeButton>
                <Modal.Title>Print Configuration</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="">
                    <div className="d-flex align-items-center gap-3">
                        <h4>Header</h4>
                        <div className="form-check form-switch">
                            <input className="form-check-input" style={{width: "40px", height: "25px"}} type="checkbox" checked={printConfigData.header} onChange={(e) => { setPrintConfigData({...printConfigData, header: e.target.checked}) }} />
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <h4>Footer</h4>
                        <div className="form-check form-switch">
                            <input className="form-check-input" style={{width: "40px", height: "25px"}} type="checkbox" checked={printConfigData.footer} onChange={(e) => { setPrintConfigData({...printConfigData, footer: e.target.checked}) }} />
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" onClick={() => { modalData.submitCallback(printConfigData); handleCloseModal() }}>Continue</Button>
                <Button onClick={() => { handleCloseModal() }}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default PrintConfigModal