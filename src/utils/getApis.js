import axios from "axios";
import Swal from "sweetalert2"

const getProductList = async (svRef, instockFilter = false, branch_id=null) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-product-list`, {}, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                let t = res.data.info

                if (instockFilter) {
                    t = t.filter(x => x.instock)
                }
                if (branch_id) {
                    t = t.filter(x => x.branch_id === branch_id)
                }

                svRef(t)
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

const getBranchList = async (svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-branch-list`, {}, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
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

const getInvoiceList = async (svRef, branch_id=null) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-invoice-list`, {}, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                let t = res.data.info

                if (branch_id) {
                    t = t.filter(x => x.branch_id === branch_id)
                }

                svRef(t)
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

export { getProductList, getBranchList, getInvoiceList }