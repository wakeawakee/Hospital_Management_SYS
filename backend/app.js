var createError = require('http-errors');
var express = require('express');
var path = require('path');
//Logger that was used for debugging, commented later
// var logger = require('morgan');
var mysql = require('mysql');
var cors = require('cors');
var port = 3001;
var  fs = require('fs');     // Add this line
var path = require('path');
//Connection Info
var con = mysql.createConnection({
  host: 'localhost',
  user:    'root',
  password: 'Savage@1234',
  database: 'HMS',
  multipleStatements: true
});

//Connecting To Database
con.connect(function (err) {
  if (err) throw err;
  console.log("Connected to MySQL");
  initInsertDML();
});

//Variables to keep state info about who is logged in
var email_in_use = "";
var password_in_use = "";
var who = "";

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());



//updated//
const initInsertDML = () => {
  const filePath = path.join(__dirname, '..', 'InsertDML.sql');
  const header = `-- HMS Database Insert Statements
-- Auto-generated from frontend interactions
-- Last updated: ${new Date().toISOString()}\n\n`;
  
  fs.writeFileSync(filePath, header, 'utf8');
};

function appendToInsertDML(tableName, data) {
  try {
    const filePath = path.join(__dirname, '..', 'InsertDML.sql');
    
    let insertStatement = `\nINSERT INTO ${tableName} (`;
    const columns = Object.keys(data).join(',');
    const values = Object.values(data).map(val => 
      typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val
    ).join(',');
    
    insertStatement += `${columns}) VALUES (${values});\n`;

    fs.appendFileSync(filePath, insertStatement, 'utf8');
    console.log(`Added INSERT statement for ${tableName}`);
  } catch (error) {
    console.error(`Error writing to InsertDML.sql:`, error);
  }
}




//Signup, Login, Password Reset Related Queries

//Checks if patient exists in database
app.get('/checkIfPatientExists', (req, res) => {
  let params = req.query;
  let email = params.email;
  let statement = `SELECT * FROM Patient WHERE email = "${email}"`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Creates User Account
app.get('/makeAccount', (req, res) => {
  let query = req.query;
  let name = query.name + " " + query.lastname;
  let email = query.email;
  let password = query.password;
  let address = query.address;
  let gender = query.gender;
  let medications = query.medications;
  let conditions = query.conditions;
  let surgeries = query.surgeries;
  if(medications===undefined){
    medications="none"
  }
  if(conditions===undefined){
    conditions="none"
  }
  if(!surgeries===undefined){
    surgeries="none"
  }
  let sql_statement = `INSERT INTO Patient (email, password, name, address, gender) 
                       VALUES ` + `("${email}", "${password}", "${name}", "${address}", "${gender}")`;
  console.log(sql_statement);
  con.query(sql_statement, function (error, results, fields) {
    if (error) throw error;
    else {
      email_in_use = email;
      password_in_use = password;
      who="pat";

      appendToInsertDML('Patient', {
        email,
        password,
        name,
        address,
        gender
      })





      return res.json({
        data: results
      })
    };
  });
  sql_statement='SELECT id FROM MedicalHistory ORDER BY id DESC LIMIT 1;';
  console.log(sql_statement)
  con.query(sql_statement, function (error, results, fields) {
    if (error) throw error;
    else {
      let generated_id = results[0].id + 1;
      let sql_statement = `INSERT INTO MedicalHistory (id, date, conditions, surgeries, medication) 
      VALUES ` + `("${generated_id}", curdate(), "${conditions}", "${surgeries}", "${medications}")`;
      console.log(sql_statement);
      con.query(sql_statement, function (error, results, fields) {
        if (error) throw error;
        else {
          let sql_statement = `INSERT INTO PatientsFillHistory (patient, history) 
          VALUES ` + `("${email}",${generated_id})`;
          console.log(sql_statement);
          con.query(sql_statement, function (error, results, fields) {
            if (error) throw error;
            else {};
          });
        };
      });
    };
  });
});

//Checks If Doctor Exists
app.get('/checkIfDocExists', (req, res) => {
  let params = req.query;
  let email = params.email;
  let statement = `SELECT * FROM Doctor WHERE email = "${email}"`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

// //Makes Doctor Account
// app.get('/makeDocAccount', (req, res) => {
//   let params = req.query;
//   let name = params.name + " " + params.lastname;
//   let email = params.email;
//   let password = params.password;
//   let gender = params.gender;
//   let schedule = params.schedule;
//   let sql_statement = `INSERT INTO Doctor (email, gender, password, name) 
//                        VALUES ` + `("${email}", "${gender}", "${password}", "${name}")`;
//   console.log(sql_statement);
//   con.query(sql_statement, function (error, results, fields) {
//     if (error) throw error;
//     else {
//       let sql_statement = `INSERT INTO DocsHaveSchedules (sched, doctor) 
//                        VALUES ` + `(${schedule}, "${email}")`;
//       console.log(sql_statement);
//       con.query(sql_statement, function(error){
//         if (error) throw error;
//       })
//       email_in_use = email;
//       password_in_use = password;
//       who = 'doc';
//       return res.json({
//         data: results
//       })
//     };
//   });
// });


// //Makes Doctor Account
// app.get('/makeDocAccount', (req, res) => {
//   let params = req.query;
//   let name = params.name + " " + params.lastname;
//   let email = params.email;
//   let password = params.password;
//   let gender = params.gender;
//   let schedule = params.schedule;
//   let sql_statement = `INSERT INTO Doctor (email, gender, password, name) 
//                        VALUES (?, ?, ?, ?)`;
//   console.log("Creating doctor account:", sql_statement);
  
//   con.query(sql_statement, [email, gender, password, name], function (error, results, fields) {
//     if (error) throw error;
//     else {
//       let schedule_statement = `INSERT INTO DocsHaveSchedules (sched, doctor) 
//                               VALUES (?, ?)`;
//       console.log("Adding doctor schedule:", schedule_statement);
      
//       con.query(schedule_statement, [schedule, email], function(error) {
//         if (error) throw error;
//       });
      
//       email_in_use = email;
//       password_in_use = password;
//       who = 'doc';
//       return res.json({
//         data: results
//       });
//     };
//   });
// });

//Makes Doctor Account
app.get('/makeDocAccount', (req, res) => {
  let params = req.query;
  let name = params.name + " " + params.lastname;
  let email = params.email;
  let password = params.password;
  let gender = params.gender;
  let schedule = "1"; // Set a default schedule ID that exists in your database

  let sql_statement = `INSERT INTO Doctor (email, gender, password, name) 
                       VALUES ("${email}", "${gender}", "${password}", "${name}")`;
  console.log("Creating doctor account:", sql_statement);
  
  con.query(sql_statement, function (error, results, fields) {
    if (error) throw error;
    else {
      let schedule_statement = `INSERT INTO DocsHaveSchedules (sched, doctor) 
                              VALUES ("${schedule}", "${email}")`;
      console.log("Adding doctor schedule:", schedule_statement);
      
      con.query(schedule_statement, function(error) {
        if (error) throw error;
      });
      
      email_in_use = email;
      password_in_use = password;
      who = 'doc';
      appendToInsertDML('Doctor', {
        email: params.email,
        gender: params.gender,
        password: params.password,
        name: params.name + " " + params.lastname
      });


      return res.json({
        data: results
      });
    };
  });
});





//Checks if patient is logged in
app.get('/checklogin', (req, res) => {
  let params = req.query;
  let email = params.email;
  let password = params.password;
  let sql_statement = `SELECT * FROM Patient 
                       WHERE email="${email}" 
                       AND password="${password}"`;
  console.log(sql_statement);
  con.query(sql_statement, function (error, results, fields) {
    if (error) {
      console.log("error");
      return res.status(500).json({ failed: 'error ocurred' })
    }
    else {
      if (results.length === 0) {
      } else {
        var string = JSON.stringify(results);
        var json = JSON.parse(string);
        email_in_use = email;
        password_in_use = password;
        who = "pat";
      }
      return res.json({
        data: results
      })
    };
  });
});

// //Checks if doctor is logged in
// app.get('/checkDoclogin', (req, res) => {
//   let params = req.query;
//   let email = params.email;
//   let password = params.password;
//   console.log("Email: ", email, " Password: ", password);
//   let sql_statement = `SELECT * 
//                        FROM Doctor
//                        WHERE email="${email}" AND password="${password}"`;
//   console.log(sql_statement);
//   con.query(sql_statement,[email,password], function (error, results, fields) {
//     if (error) {
//       console.log("eror");
//       return res.status(500).json({ failed: 'error ocurred' })
//     }
//     else {
//       if (results.length === 0) {

//       } else {
//         var string = JSON.stringify(results);
//         var json = JSON.parse(string);
//         email_in_use = email;
//         password_in_use = password;
//         who="doc";
//         // console.log(email_in_use);
//         // console.log(password_in_use);
//       }
//       return res.json({
//         data: results
//       })
//     };
//   });
// });



app.get('/checkDoclogin', (req, res) => {
  let params = req.query;
  let email = params.email;
  let password = params.password;
  console.log("Email: ", email, " Password: ", password);
  let sql_statement = `SELECT * FROM Doctor 
                       WHERE email = ? AND password = ?`;
  console.log(sql_statement);
  con.query(sql_statement, [email, password], function (error, results, fields) {
    if (error) {
      console.log("error:", error);
      return res.status(500).json({ failed: 'error occurred' });
    }
    else {
      if (results.length === 0) {
        return res.json({
          data: []
        });
      } else {
        email_in_use = email;
        password_in_use = password;
        who = "doc";
        return res.json({
          data: results
        });
      }
    };
  });
});


    






//Resets Patient Password
app.post('/resetPasswordPatient', (req, res) => {
  let something = req.query;
  let email = something.email;
  let oldPassword = "" + something.oldPassword;
  let newPassword = "" + something.newPassword;
  let statement = `UPDATE Patient 
                   SET password = "${newPassword}" 
                   WHERE email = "${email}" 
                   AND password = "${oldPassword}";`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Resets Doctor Password
app.post('/resetPasswordDoctor', (req, res) => {
  let something = req.query;
  let email = something.email;
  let oldPassword = "" + something.oldPassword;
  let newPassword = "" + something.newPassword;
  let statement = `UPDATE Doctor
                   SET password = "${newPassword}" 
                   WHERE email = "${email}" 
                   AND password = "${oldPassword}";`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Returns Who is Logged in
app.get('/userInSession', (req, res) => {
  return res.json({ email: `${email_in_use}`, who:`${who}`});
});

//Logs the person out
app.get('/endSession', (req, res) => {
  console.log("Ending session");
  email_in_use = "";
  password_in_use = "";
});

//Appointment Related

//Checks If a similar appointment exists to avoid a clash
// app.get('/checkIfApptExists', (req, res) => {
//   let cond1, cond2, cond3 = ""
//   let params = req.query;
//   let email = params.email;
//   let doc_email = params.docEmail;
//   let startTime = params.startTime;
//   let date = params.date;
//   let ndate = new Date(date).toLocaleDateString().substring(0, 10)
//   let sql_date = `STR_TO_DATE('${ndate}', '%d/%m/%Y')`;
//   //sql to turn string to sql time obj
//   let sql_start = `CONVERT('${startTime}', TIME)`;
//   let statement = `SELECT * FROM PatientsAttendAppointments, Appointment  
//   WHERE patient = "${email}" AND
//   appt = id AND
//   date = ${sql_date} AND
//   starttime = ${sql_start}`
//   console.log(statement)
//   con.query(statement, function (error, results, fields) {
//     if (error) throw error;
//     else {
//       cond1 = results;
//       statement=`SELECT * FROM Diagnose d INNER JOIN Appointment a 
//       ON d.appt=a.id WHERE doctor="${doc_email}" AND date=${sql_date} AND status="NotDone" 
//       AND ${sql_start} >= starttime AND ${sql_start} < endtime`
//       console.log(statement)
//       con.query(statement, function (error, results, fields) {
//         if (error) throw error;
//         else {
//           cond2 = results;
//           statement = `SELECT doctor, starttime, endtime, breaktime, day FROM DocsHaveSchedules 
//           INNER JOIN Schedule ON DocsHaveSchedules.sched=Schedule.id
//           WHERE doctor="${doc_email}" AND 
//           day=DAYNAME(${sql_date}) AND 
//           (DATE_ADD(${sql_start},INTERVAL +1 HOUR) <= breaktime OR ${sql_start} >= DATE_ADD(breaktime,INTERVAL +1 HOUR));`
//           //not in doctor schedule
//           console.log(statement)
//           con.query(statement, function (error, results, fields) {
//             if (error) throw error;
//             else {
//               if(results.length){
//                 results = []
//               }
//               else{
//                 results = [1]
//               }
//               return res.json({
//                 data: cond1.concat(cond2,results)
//               })
//             };
//           });
//         };
//       });
//     };
//   });
//   //doctor has appointment at the same time - Your start time has to be greater than all prev end times
// });




//Checks If a similar appointment exists to avoid a clash
// app.get('/checkIfApptExists', (req, res) => {
//   let params = req.query;
//   let email = params.email;
//   let doc_email = params.docEmail;
//   let startTime = params.startTime;
//   let date = params.date;
//   let ndate = new Date(date).toLocaleDateString().substring(0, 10);
//   let sql_date = `STR_TO_DATE('${ndate}', '%d/%m/%Y')`;
//   let sql_start = `CONVERT('${startTime}', TIME)`;

//   // First check if patient has any conflicting appointments
//   let statement = `SELECT * FROM PatientsAttendAppointments p 
//                    JOIN Appointment a ON p.appt = a.id
//                    WHERE p.patient = ? 
//                    AND a.date = ${sql_date}
//                    AND a.starttime = ${sql_start}`;

//   console.log("Checking patient appointments:", statement);
  
//   con.query(statement, [email], function (error, patientResults, fields) {
//     if (error) {
//       console.log("Error checking patient appointments:", error);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     // If patient has conflicting appointment
//     if (patientResults.length > 0) {
//       return res.json({
//         data: patientResults,
//         message: "Patient already has an appointment at this time"
//       });
//     }


//Checks if a similar appointment exists to avoid a clash
// app.get('/checkIfApptExists', (req, res) => {
//   let params = req.query;
//   let email = params.email;
//   let doc_email = params.docEmail;
//   let startTime = params.startTime;
//   let date = params.date;

//   // Simple check for existing appointments
//   let statement = `
//     SELECT * FROM PatientsAttendAppointments p 
//     JOIN Appointment a ON p.appt = a.id 
//     WHERE (p.patient = ? OR a.id IN (
//       SELECT appt FROM Diagnose WHERE doctor = ?
//     ))
//     AND a.date = ? 
//     AND a.starttime = ?
//   `;

//   console.log("Checking appointments with:", {
//     email,
//     doc_email,
//     date,
//     startTime
//   });

//   con.query(statement, [email, doc_email, date, startTime], function (error, results) {
//     if (error) {
//       console.error("Database error:", error);
//       return res.status(500).json({ error: "Database error" });
//     }

//     return res.json({
//       data: results,
//       hasConflict: results.length > 0
//     });
//   });
// });

//     // Check if doctor has any conflicting appointments
//     let doctorStatement = `SELECT * FROM Diagnose d 
//                           JOIN Appointment a ON d.appt = a.id 
//                           WHERE d.doctor = ? 
//                           AND a.date = ${sql_date}
//                           AND a.status = 'NotDone'
//                           AND ${sql_start} BETWEEN a.starttime AND a.endtime`;

//     console.log("Checking doctor appointments:", doctorStatement);

//     con.query(doctorStatement, [doc_email], function (error, doctorResults, fields) {
//       if (error) {
//         console.log("Error checking doctor appointments:", error);
//         return res.status(500).json({ error: 'Database error' });
//       }

//       // If doctor has conflicting appointment
//       if (doctorResults.length > 0) {
//         return res.json({
//           data: doctorResults,
//           message: "Doctor already has an appointment at this time"
//         });
//       }

//       // Check doctor's schedule/availability
//       let scheduleStatement = `SELECT * FROM DocsHaveSchedules dhs
//                               JOIN Schedule s ON dhs.sched = s.id
//                               WHERE dhs.doctor = ?
//                               AND s.day = DAYNAME(${sql_date})
//                               AND (
//                                 ${sql_start} BETWEEN s.starttime AND s.endtime
//                                 AND (
//                                   ${sql_start} < s.breaktime 
//                                   OR ${sql_start} >= DATE_ADD(s.breaktime, INTERVAL 1 HOUR)
//                                 )
//                               )`;

//       console.log("Checking doctor schedule:", scheduleStatement);

//       con.query(scheduleStatement, [doc_email], function (error, scheduleResults, fields) {
//         if (error) {
//           console.log("Error checking doctor schedule:", error);
//           return res.status(500).json({ error: 'Database error' });
//         }

//         // If time slot is available in doctor's schedule
//         if (scheduleResults.length > 0) {
//           return res.json({
//             data: [],
//             message: "Time slot available"
//           });
//         } else {
//           return res.json({
//             data: [1], // Indicating conflict
//             message: "Time slot not in doctor's schedule"
//           });
//         }
//       });
//     });
  

//Checks If a similar appointment exists to avoid a clash
app.get('/checkIfApptExists', (req, res) => {
  let params = req.query;
  let email = params.email;
  let doc_email = params.docEmail;
  let startTime = params.startTime;
  let date = params.date;
  
  // Check for patient's existing appointments
  let statement = `SELECT * FROM PatientsAttendAppointments p 
                   JOIN Appointment a ON p.appt = a.id
                   WHERE p.patient = ? 
                   AND DATE(a.date) = DATE(?)
                   AND a.starttime = ?`;

  console.log("Checking appointments for:", {
    email,
    date,
    startTime
  });
  
  con.query(statement, [email, date, startTime], function (error, results, fields) {
    if (error) {
      console.error("Error checking patient appointments:", error);
      return res.status(500).json({ error: 'Database error' });
    }

    // If patient already has appointment at this time
    if (results.length > 0) {
      return res.json({
        data: results
      });
    }

    // Check doctor's availability
    let doctorStatement = `SELECT * FROM Diagnose d 
                          JOIN Appointment a ON d.appt = a.id 
                          WHERE d.doctor = ? 
                          AND DATE(a.date) = DATE(?)
                          AND a.starttime = ?`;

    con.query(doctorStatement, [doc_email, date, startTime], function (error, docResults, fields) {
      if (error) {
        console.error("Error checking doctor appointments:", error);
        return res.status(500).json({ error: 'Database error' });
      }

      return res.json({
        data: docResults
      });
    });
  });
});


//Returns Date/Time of Appointment
// app.get('/getDateTimeOfAppt', (req, res) => {
//   let tmp = req.query;
//   let id = tmp.id;
//   let statement = `SELECT starttime as start, 
//                           endtime as end, 
//                           date as theDate 
//                    FROM Appointment 
//                    WHERE id = "${id}"`;
//   console.log(statement);
//   con.query(statement, function (error, results, fields) {
//     if (error) throw error;
//     else {
//       console.log(JSON.stringify(results));
//       return res.json({
//         data: results
//       })
//     };
//   });
// });

//Patient Info Related

//to get all doctor names
app.get('/docInfo', (req, res) => {
  let statement = 'SELECT * FROM Doctor';
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//To return a particular patient history
app.get('/OneHistory', (req, res) => {
  let params = req.query;
  let email = params.patientEmail;
  let statement = `SELECT gender,name,email,address,conditions,surgeries,medication
                    FROM PatientsFillHistory,Patient,MedicalHistory
                    WHERE PatientsFillHistory.history=id
                    AND patient=email AND email = ` + email;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    }
  })
});

//To show all patients whose medical history can be accessed
app.get('/MedHistView', (req, res) => {
  let params = req.query;
  let patientName = "'%" + params.name + "%'";
  let secondParamTest = "" + params.variable;
  let statement = `SELECT name AS 'Name',
                    PatientsFillHistory.history AS 'ID',
                    email FROM Patient,PatientsFillHistory
                    WHERE Patient.email = PatientsFillHistory.patient
                    AND Patient.email IN (SELECT patient from PatientsAttendAppointments 
                    NATURAL JOIN Diagnose WHERE doctor="${email_in_use}")`;
  if (patientName != "''")
    statement += " AND Patient.name LIKE " + patientName
  console.log(statement)
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Returns Appointment Info To patient logged In
app.get('/patientViewAppt', (req, res) => {
  let tmp = req.query;
  let email = tmp.email;
  let statement = `SELECT PatientsAttendAppointments.appt as ID,
                  PatientsAttendAppointments.patient as user, 
                  PatientsAttendAppointments.concerns as theConcerns, 
                  PatientsAttendAppointments.symptoms as theSymptoms, 
                  Appointment.date as theDate,
                  Appointment.starttime as theStart,
                  Appointment.endtime as theEnd,
                  Appointment.status as status
                  FROM PatientsAttendAppointments, Appointment
                  WHERE PatientsAttendAppointments.patient = "${email}" AND
                  PatientsAttendAppointments.appt = Appointment.id`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Checks if history exists
app.get('/checkIfHistory', (req, res) => {
    let params = req.query;
    let email = params.email;
    let statement = "SELECT patient FROM PatientsFillHistory WHERE patient = " + email;
    console.log(statement)
    con.query(statement, function (error, results, fields) {
        if (error) throw error;
        else {
            return res.json({
                data: results
            })
        };
    });
});

//Adds to PatientsAttendAppointment Table
// app.get('/addToPatientSeeAppt', (req, res) => {
//   let params = req.query;
//   let email = params.email;
//   let appt_id = params.id;
//   let concerns = params.concerns;
//   let symptoms = params.symptoms;
//   let sql_try = `INSERT INTO PatientsAttendAppointments (patient, appt, concerns, symptoms) 
//                  VALUES ("${email}", ${appt_id}, "${concerns}", "${symptoms}")`;
//   console.log(sql_try);
//   con.query(sql_try, function (error, results, fields) {
//     if (error) throw error;
//     else{
//       return res.json({
//         data: results
//       })
//     }
//   });

// });




app.get('/addToPatientSeeAppt', (req, res) => {
  let params = req.query;
  let email = params.email;
  let id = params.id;
  let concerns = params.concerns;
  let symptoms = params.symptoms;

  // Add validation
  if (!email || email === "") {
    console.error("No patient email provided");
    return res.status(400).json({ error: "Patient email is required" });
  }

  // First check if patient exists
  con.query("SELECT email FROM Patient WHERE email = ?", [email], function(error, results) {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      console.error("Patient not found:", email);
      return res.status(404).json({ error: "Patient not found" });
    }

    // If patient exists, add the appointment
    let sql_insert = `INSERT INTO PatientsAttendAppointments (patient, appt, concerns, symptoms) 
                      VALUES (?, ?, ?, ?)`;

    console.log("Adding appointment for patient:", {
      email,
      id,
      concerns,
      symptoms
    });

    con.query(sql_insert, [email, id, concerns, symptoms], function(error, results) {
      if (error) {
        console.error("Error adding appointment:", error);
        return res.status(500).json({ error: "Failed to add appointment" });
      }

      // Add to InsertDML.sql
      appendToInsertDML('PatientsAttendAppointments', {
        patient: email,
        appt: id,
        concerns,
        symptoms
      });

      return res.json({
        data: results,
        message: "Appointment added successfully"
      });
    });
  });
});

//Schedules Appointment
// app.get('/schedule', (req, res) => {
//   let params = req.query;
//   let time = params.time;
//   let date = params.date;
//   let id = params.id;
//   let endtime = params.endTime;
//   let concerns = params.concerns;
//   let symptoms = params.symptoms;
//   let doctor = params.doc;
//   let ndate = new Date(date).toLocaleDateString().substring(0, 10)
//   let sql_date = `STR_TO_DATE('${ndate}', '%d/%m/%Y')`;
//   //sql to turn string to sql time obj
//   let sql_start = `CONVERT('${time}', TIME)`;
//   //sql to turn string to sql time obj
//   let sql_end = `CONVERT('${endtime}', TIME)`;
//   let sql_try = `INSERT INTO Appointment (id, date, starttime, endtime, status) 
//                  VALUES (${id}, ${sql_date}, ${sql_start}, ${sql_end}, "NotDone")`;
//   console.log(sql_try);
//   con.query(sql_try, function (error, results, fields) {
//     if (error) throw error;
//     else {
//       let sql_try = `INSERT INTO Diagnose (appt, doctor, diagnosis, prescription) 
//                  VALUES (${id}, "${doctor}", "Not Yet Diagnosed" , "Not Yet Diagnosed")`;
//       console.log(sql_try);
//       con.query(sql_try, function (error, results, fields) {
//         if (error) throw error;
//         else{
//           return res.json({
//             data: results
//           })
//         }
//       });
//     }
//   });
// });

//Schedules Appointment
app.get('/schedule', (req, res) => {
  let params = req.query;
  let time = params.time;
  let date = params.date;
  let id = params.id;
  let endtime = params.endTime;
  let doctor = params.doc;

  // Convert date from MM/DD/YYYY to YYYY-MM-DD format
  let dateParts = date.split('/');
  let formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;

  let sql_try = `INSERT INTO Appointment (id, date, starttime, endtime, status) 
                 VALUES (?, ?, ?, ?, "NotDone")`;

  console.log("Scheduling appointment:", {
    id,
    date: formattedDate,
    startTime: time,
    endTime: endtime
  });

  con.query(sql_try, [id, formattedDate, time, endtime], function (error, results, fields) {
    if (error) {
      console.error("Error scheduling appointment:", error);
      return res.status(500).json({ error: "Failed to schedule appointment" });
    }

    let diagnose_sql = `INSERT INTO Diagnose (appt, doctor, diagnosis, prescription) 
                        VALUES (?, ?, "Not Yet Diagnosed", "Not Yet Diagnosed")`;

    con.query(diagnose_sql, [id, doctor], function (error, results, fields) {
      if (error) {
        console.error("Error adding diagnosis record:", error);
        return res.status(500).json({ error: "Failed to create diagnosis record" });
      }

      return res.json({
        data: results,
        message: "Appointment scheduled successfully"
      });
    });
  });
});



//Generates ID for appointment
app.get('/genApptUID', (req, res) => {
  let statement = 'SELECT id FROM Appointment ORDER BY id DESC LIMIT 1;'
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      let generated_id = results[0].id + 1;
      return res.json({ id: `${generated_id}` });
    };
  });
});

//To fill diagnoses
app.get('/diagnose', (req, res) => {
  let params = req.query;
  let id = params.id;
  let diagnosis = params.diagnosis;
  let prescription = params.prescription;
  let statement = `UPDATE Diagnose SET diagnosis="${diagnosis}", prescription="${prescription}" WHERE appt=${id};`;
  console.log(statement)
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      let statement = `UPDATE Appointment SET status="Done" WHERE id=${id};`;
      console.log(statement)
      con.query(statement, function (error, results, fields){
        if (error) throw error;
      })
    };
  });
});

//To show diagnoses
app.get('/showDiagnoses', (req, res) => {
  let id = req.query.id;
  let statement = `SELECT * FROM Diagnose WHERE appt=${id}`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//To show appointments to doctor
app.get('/doctorViewAppt', (req, res) => {
  let a = req.query;
  let email = a.email;
  let statement = `SELECT a.id,a.date, a.starttime, a.status, p.name, psa.concerns, psa.symptoms
  FROM Appointment a, PatientsAttendAppointments psa, Patient p
  WHERE a.id = psa.appt AND psa.patient = p.email
  AND a.id IN (SELECT appt FROM Diagnose WHERE doctor="${email_in_use}")`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//To show diagnoses to patient
app.get('/showDiagnoses', (req, res) => {
  let id = req.query.id;
  let statement = `SELECT * FROM Diagnose WHERE appt=${id}`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//To Show all diagnosed appointments till now
app.get('/allDiagnoses', (req, res) => {
  let params = req.query;
  let email = params.patientEmail;
  let statement =`SELECT date,doctor,concerns,symptoms,diagnosis,prescription FROM 
  Appointment A INNER JOIN (SELECT * from PatientsAttendAppointments NATURAL JOIN Diagnose 
  WHERE patient=${email}) AS B ON A.id = B.appt;`
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//To delete appointment
app.get('/deleteAppt', (req, res) => {
  let a = req.query;
  let uid = a.uid;
  let statement = `SELECT status FROM Appointment WHERE id=${uid};`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      results = results[0].status
      if(results == "NotDone"){
        statement = `DELETE FROM Appointment WHERE id=${uid};`;
        console.log(statement);
        con.query(statement, function (error, results, fields) {
          if (error) throw error;
        });
      }
      else{
        if(who=="pat"){
          statement = `DELETE FROM PatientsAttendAppointments p WHERE p.appt = ${uid}`;
          console.log(statement);
          con.query(statement, function (error, results, fields) {
            if (error) throw error;
          });
        }
      }
    };
  });
  return;
});

// If 404, forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, () => {
  console.log(`Listening on port ${port} `);
});

module.exports = app;