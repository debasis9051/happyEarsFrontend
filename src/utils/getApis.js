import axios from "axios";
import Swal from "sweetalert2"

const getProductList = async (svRef, instockFilter=false) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-product-list`, {}, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                if(instockFilter){
                    svRef(res.data.info.filter(x=>x.instock))
                }
                else{
                    svRef(res.data.info)
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

export { getProductList }