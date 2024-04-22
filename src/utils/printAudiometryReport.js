const generateChart = (ctx, data, marker) => {
    const drawMarker = (x,y,marker) => {
        if(marker === "circle"){
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "blue";
            ctx.fill();
        }
        else if(marker === "cross"){
            ctx.beginPath();
            ctx.moveTo(x-5,y-5)
            ctx.lineTo(x+5,y+5)
            ctx.moveTo(x+5,y-5)
            ctx.lineTo(x-5,y+5)
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
    
    ctx.font = "15px Arial"
    ctx.textAlign = "center"
    
    ctx.beginPath();
    ctx.strokeRect(60, 60, 420, 420)
    ctx.stroke();
    
    ctx.strokeText("Hz",35,30);
    ctx.strokeText("dB",20,50);
    ctx.beginPath();
    ctx.moveTo(15, 25);
    ctx.lineTo(40, 45)
    ctx.stroke(); 

    let x_labels = [250,500,1000,2000,4000,6000,8000]
    ctx.beginPath();
    x_labels.forEach((elem,i,arr)=>{
        let x = 60 + 420/(arr.length-1) * i
        let y = 50 + 0

        ctx.strokeText(elem,x,y-5);
        
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 420 + 10)
    })
    ctx.stroke(); 
    
    let y_labels = Array.from({ length: (120 + 10) / 10 + 1}, (_, index) => index * 10 - 10);
    ctx.beginPath();
    y_labels.forEach((elem,i,arr)=>{
        let x = 50 + 0
        let y = 60 + (420-10)/(arr.length-1) * i

        ctx.strokeText(elem,x-15,y+5);
        
        ctx.moveTo(x,y);
        ctx.lineTo(x + 420 + 10, y)
    })
    ctx.stroke(); 
    
    ctx.lineWidth = 2
    ctx.beginPath();
    ctx.moveTo(60 + 0, 60 + (420-10)/(120+10) * (data[0] + 10));
    data.slice(1,data.length).forEach((elem,i,arr)=>{
        let x = 60 + 420/(arr.length) * (i+1)
        let y = 60 + (420-10)/(120+10) * (elem + 10)
        
        ctx.lineTo(x, y)
    })
    ctx.stroke();
    
    data.forEach((elem,i,arr)=>{
        let x = 60 + 420/(arr.length-1) * i
        let y = 60 + (420-10)/(120+10) * (elem + 10)

        drawMarker(x, y, marker)
    })
}

const printAudiometryReport = (patient_name, age, sex, date, test_machine, left_ear_pta, right_ear_pta, lhl_data, rhl_data) => {

    let html = `
        <div class="container-fluid my-4 fw-bold">
            
            <div class="text-end mx-4" style="font-size:12px; margin-top:200px;"> Rajpur Sonarpur Branch : </div>
            <div class="text-end mx-4" style="font-size:12px;"> MAATARA APARTMENT </div>
            <div class="text-end mx-4" style="font-size:12px;">  
            
            121, N.S.C, Bose Road, RAJPUR, PIN-700149 

            </div>
            <div class="text-end mx-4" style="font-size:12px;"> Contact : 8100998309 / 310 </div>


            <h2 class="text-center text-decoration-underline m-2" style="color:navy;">Audiogram Hearing Aid Trial</h2>
            <div class="d-flex my-2 align-items-center">
                <span class="mx-2">Patient Name : </span>
                <span class="mx-2 flex-grow-1 border-bottom border-dark fs-4">${patient_name}</span>
                <span class="mx-2">Age/Sex :</span>
                <span class="mx-2 border-bottom border-dark fs-4">${age}/${sex[0].toUpperCase()}</span>
            </div>
            <div class="d-flex my-2 align-items-center">
                <span class="mx-2">Date: </span>
                <span class="mx-2 flex-grow-1 border-bottom border-dark fs-4">${date}<span>
            </div>

            <div class="d-flex text-center" style="gap:100px;">
                <div>
                    <h2 style="color:blue; margin:40px 0">Left</h2>
                    <canvas id="leftEarChart" style="width: 400px; height: 400px" width="500" height="500"></canvas>
                    <div style="margin-top:50px">
                        <span>PTA (LT EAR) = </span>
                        <span class="border-bottom border-dark">${lhl_data.unit} db Hz</span>
                    </div>
                    <div style="margin-bottom:50px; margin-top:15px;">
                        <span>Degree of Hearing Loss: </span>
                        <span class="p-2 rounded" style="background-color:${lhl_data.color}">${lhl_data.text}</span>
                    </div>
                </div>
                <div>
                    <h2 style="color:red; margin:40px 0">Right</h2>
                    <canvas id="rightEarChart" style="width: 400px; height: 400px" width="500" height="500"></canvas>
                    <div style="margin-top:50px">
                        <span>PTA (RT EAR) = </span>
                        <span class="border-bottom border-dark">${rhl_data.unit} db Hz</span>
                    </div>
                    <div style="margin-bottom:50px; margin-top:15px;">
                        <span>Degree of Hearing Loss: </span>
                        <span class="p-2 rounded" style="background-color:${rhl_data.color}">${rhl_data.text}</span>
                    </div>
                </div>
            </div>

            <div class="d-flex align-items-center">
                <span class="mx-2">Test Machine: </span>
                <span class="mx-2 border-bottom border-dark fs-4">${test_machine}</span>
            </div>

            <div class="my-5">
                <span>Disclaimer : </span>
                <span class="text-danger">This is just a trial report based on patient response. This cannot be or should not be treated as medical audiogram report(PTA)</span>
            </div>
                
        </div>
    `
    
    let nw = window.open()
    nw.document.head.innerHTML = `
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    `
    nw.document.body.innerHTML = html

    let ctx1 = nw.document.getElementById('leftEarChart').getContext("2d")
    generateChart(ctx1, left_ear_pta.map(x=>x.decibal), "circle")
    
    let ctx2 = nw.document.getElementById('rightEarChart').getContext("2d")
    generateChart(ctx2, right_ear_pta.map(x=>x.decibal), "cross")


    setTimeout(() => { nw.print() }, 2000);
}

export { printAudiometryReport }