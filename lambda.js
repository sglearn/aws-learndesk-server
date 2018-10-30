"use strict"

const aws = require('aws-sdk');
const lambda = new aws.Lambda();

function sendEmailFn(functionName) {
  return function sendEmail({recipient, customer, invoice}, callback) {

    console.log(`Sending email to ${recipient}`)

    lambda.invoke(
      {
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({recipient, customer, invoice}, null, 2)
      },
      function(err, data) {
        if (err) {
          console.log(err)
          callback(err)
        } else {
          console.log('Send Email success')
          callback()
        }
      }
    )

  }
}

/* create api */  

const api = {
  content: require('@sglearn/learndesk-content-server'),
  progress: require('@sglearn/progress-server')
}


const DatabaseAbstractor = require("database-abstractor")
const progress = new DatabaseAbstractor();
const enroll = new DatabaseAbstractor();
const content = new DatabaseAbstractor();

progress.use(require('@sglearn/progressdb-dynamodb-driver')());
enroll.use(require('@sglearn/enrolldb-dynamodb-driver')());
content.use(require('@sglearn/contentdb-dynamodb-driver')());

api.content.useDatabase({ enroll, content })
api.progress.useDatabase({ progress })

// api.helper({ sendEmail: sendEmailFn('SendEmailPurchaseOrder') })

/* create express app from api */  
const express = require('express')
const cors = require('cors')

const app = express();

app.use(cors());
app.use('/', api.content);
app.use('/', api.progress);

/* wrap into lambda */  
const awsServerlessExpress = require('aws-serverless-express')
const server = awsServerlessExpress.createServer(app)
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context)
}
