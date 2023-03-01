var AWS = require("aws-sdk");
const { ExportToCsv } = require("export-to-csv");
const fs = require("fs");
require("dotenv").config();
var moment = require('moment') 

AWS.config.update({
  region: process.env.REGION_PROD,
});

var userList = [];
var promises = [];
var freemiumUserList = [];
var freemiumPromises = [];
var envList = process.env.Env_list.split(",");

//Get User List From Old Platform
for (var index = 0; index < envList.length; ++index) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  var params = {
    TableName: envList[index],
  };
  promises.push(
    new Promise((resolve, reject) => {
      docClient.scan(params, function (err, data) {
        if (err) {
          console.log("No Data Present");
          console.error(JSON.stringify(err, null, 2));
          reject(error);
        } else {
          var userInfo = data.Items;

          Object.keys(userInfo).map((item) => {
            if (userInfo[item].partitionKey === "users") {
              userList.push({
                first_name: userInfo[item].given_name,
                last_name: userInfo[item].family_name,
                email: userInfo[item].email,
              });
            }
          });
          resolve();
        }
      });
    })
  );
}

Promise.all(promises)
  .then(() => {

    var filteredUserList = []

    userList.forEach((user, i )=>{
        if(!user.email.includes("+")){
            filteredUserList.push({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            })
        }
    })
    var options = {
        fieldSeparator: ",",
        decimalSeparator: ".",
        showLabels: true,
        showTitle: false,
        useTextFile: false,
        useBom: true,
        useKeysAsHeaders: true,
    };

    const csvExporter = new ExportToCsv(options);
    const file = csvExporter.generateCsv(filteredUserList, true);
    fs.writeFileSync("Posture User Listing-"+moment().format("MMMM-YYYY")+".csv", file);

  })
  .catch((error) => {
    console.log(error);
  }
);

//Freemium UserList
var freemiumDocClient = new AWS.DynamoDB.DocumentClient();
var freemiumParams = {
  TableName: process.env.FreemiumUserTable,
};
freemiumPromises.push(
  new Promise((resolve, reject) => {
    freemiumDocClient.scan(freemiumParams, function (err, data) {
      if (err) {
        console.log("No Data Present");
        console.error(JSON.stringify(err, null, 2));
        reject(error);
      }else{
        var freemiumUserInfo = data.Items;
        console.log(freemiumUserInfo)

        Object.keys(freemiumUserInfo).map((item) => {
          freemiumUserList.push({
            first_name: freemiumUserInfo[item].givenName,
            last_name: freemiumUserInfo[item].familyName,
            email: freemiumUserInfo[item].email
          });
        })
        resolve()
      }
    });
    
  })
)
Promise.all(freemiumPromises)
  .then(() => {
    var freemiumFilteredUserList = []

    freemiumUserList.forEach((user, i )=>{
        if(!user.email.includes("+")){
          freemiumFilteredUserList.push({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            })
        }
    })
    var options = {
        fieldSeparator: ",",
        decimalSeparator: ".",
        showLabels: true,
        showTitle: false,
        useTextFile: false,
        useBom: true,
        useKeysAsHeaders: true,
    };
    const csvExporter = new ExportToCsv(options);
    const file = csvExporter.generateCsv(freemiumFilteredUserList, true);
    fs.writeFileSync("Posture Freemium User Listing-"+moment().format("MMMM-YYYY")+".csv", file);
  })
  .catch((error) => {
    console.log(error);
  }
)
