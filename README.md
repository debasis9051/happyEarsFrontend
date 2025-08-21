# HappyEarsFrontend

## HAPPY EARS PROJECT
Frontend using React.js, Bootstrap 5
Backend using Node.js
Authentication, Database(including files) using Firebase


### frontend routes:
1. navbar including sign in/sign out feature

2. "/" - Homepage with big buttons to redirect to other pages

3. "/audiometry" - Audiometry chart page - features: chart generation
        features:
        i. add audiometry report - trial or not

        options per report:
        i. edit report - not all fields are editable
        ii. generate invoice against audiometry
        iii. print report

4. "/inventory" - Inventory Management page
        features:
        i. add new product(s) with add/import button

        options per product:
        i. edit action button to modify details
        ii. transfer product button to transfer to a different branch
        iii. return product button to mark product as returned
        iv. view product logs
        
5. "/generate-invoice" - Invoice generation page with form against patients
        features: 
        i. save and print
        
6. "/sales-report" - List of all invoice records
        features:-
        i. export all invoices data with export button --- NOT DONE
        ii. edit invoice button - not all fields are editable 
        iii. print action button
        iv. sales report data tabs

6. "/patients" - List of all patient records linked with other records
        features:-
        i. edit
        ii. view location

7. "/service" - List of all patient service request records
        features:-
        i. create/edit service request
        ii. mark service as complete/cancel after filling up their respective forms
        
8. "/admin-panel" - Admin Panel for additional features and to execute custom scripts
        features:-
        i. add salesperson
        ii. add branch
        iii. add doctor
        iv. modify page access permissions of all users
        v. run custom script