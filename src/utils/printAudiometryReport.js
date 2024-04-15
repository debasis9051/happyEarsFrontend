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
                    <h2 style="color:blue; margin:50px 0">Left</h2>
                    <div style="width: 400px; height: 400px"><canvas id="leftEarChart"></canvas></div>
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
                    <h2 style="color:red; margin:50px 0">Right</h2>
                    <div style="width: 400px; height: 400px"><canvas id="rightEarChart"></canvas></div>
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

    let sc1 = nw.document.createElement("script")
    sc1.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"
    sc1.type = "module"
    sc1.integrity = "sha512-CQBWl4fJHWbryGE+Pc7UAxWMUMNMWzWxF4SQo9CgkJIN1kx6djDQZjh3Y8SZ1d+6I+1zze6Z7kHXO7q3UyZAWw=="
    sc1.crossOrigin = "anonymous"
    sc1.referrerPolicy = "no-referrer"
    nw.document.head.appendChild(sc1)

    let sc2 = nw.document.createElement("script")
    sc2.text = `
        window.addEventListener("load",()=>{
            setTimeout(()=>{
                const ctx1 = document.getElementById('leftEarChart');
    
                new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: [250, 500, 1000, 2000, 4000, 6000, 8000],
                        datasets: [{
                            data: [${left_ear_pta.map(x=>x.decibal)}],
                            fill: false,
                            borderColor: 'rgb(192, 192, 192)',
                            pointRadius: 10,
                            pointBorderColor: "blue",
                            tension: 0.1
                        }]
                    },
                    options:{
                        maintainAspectRatio: false,
                        scales:{
                            yAxis: {
                                min: 0,
                                max: 120,
                                grid:{
                                    color: "black"
                                }
                            },
                            xAxis:{
                                grid:{
                                    color: "black"
                                }
                            }
                        },
                        plugins:{
                            legend:{
                                display: false
                            }
                        }
                    }
                });

                const ctx2 = document.getElementById('rightEarChart');
    
                new Chart(ctx2, {
                    type: 'line',
                    data: {
                        labels: [250, 500, 1000, 2000, 4000, 6000, 8000],
                        datasets: [{
                            data: [${right_ear_pta.map(x=>x.decibal)}],
                            fill: false,
                            borderColor: 'rgb(192, 192, 192)',
                            pointRadius: 10,
                            pointBorderColor: "red",
                            tension: 0.1
                        }]
                    },
                    options:{
                        maintainAspectRatio: false,
                        scales:{
                            yAxis: {
                                min: 0,
                                max: 120,
                                grid:{
                                    color: "black"
                                }
                            },
                            xAxis:{
                                grid:{
                                    color: "black"
                                }
                            }
                        },
                        plugins:{
                            legend:{
                                display: false
                            }
                        },
                        elements:{
                            point:{
                                pointStyle: "crossRot"
                            }
                        }
                    }
                });
            },1000)
        })
    `
    nw.document.head.appendChild(sc2)
    setTimeout(() => { nw.print() }, 3000);
}

export { printAudiometryReport }