import React, { createContext, useCallback, useContext, useState } from 'react'

import NewFeatureModal from '../modals/NewFeatureModal'
import PatientModal from '../modals/PatientModal'
import PrintConfigModal from '../modals/PrintConfigModal'

const initialState = {
    modalShow: false,
    modalData: null,
    modalView: null,
}

const ModalContext = createContext(initialState)

export const ModalProvider = ({ children }) => {

    const [modalShow, setModalShow] = useState(false)
    const [modalData, setModalData] = useState(null)
    const [modalView, setModalView] = useState(null)

    const openModal = useCallback(() => setModalShow(true), [setModalShow])
    const closeModal = useCallback(() => {
        setModalShow(false)
        setModalData(null)
        setModalView(null)
    },[setModalShow, setModalData, setModalView])

    const value = {
        modalShow,
        modalData,
        modalView,
        setModalData,
        setModalView,
        openModal,
        closeModal,
    }

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    )
}

export const useModal = () => {
    const context = useContext(ModalContext)

    if (!context) {
        throw new Error("useModal must be used within Modal Provider")
    }
    return context
}

export const ManagedModal = () => {
    const { modalView } = useModal()

    return (
        <>
            {modalView === "PATIENT_MODAL" && <PatientModal/>}
            {modalView === "NEW_FEATURE_MODAL" && <NewFeatureModal/>}
            {modalView === "PRINT_CONFIG_MODAL" && <PrintConfigModal/>}
        </>
    )
}