var CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
var kue = require('kue');
var queue = kue.createQueue();
require('dotenv').config();
var AWS = require('aws-sdk')

function createNewCron(time, to, subject, text, html) {
  var schedule = new CronJob(time, function() {
        // THIS IS THE FIRST JOB IN THE QUEUE = SENDING EMAIL
        var job = queue.create('sendEmail', {
          to: to
        , subject: subject
        , text: text
        , html: html
        }).save( function(err){
           if( !err ) console.log("Job 1 DONE");
        });
        queue.process('sendEmail', function(job, done){
          sendEmail(job.data, done); //function sendEmail is defined in line 43
        });

        // THIS IS THE SECOND JOB IN THE QUEUE = DOING CONSOLE LOG
        var job2 = queue.create('consolelog', {
          message: "ini adalah Job queue ke 2"
        }).save( function(err){
           if( !err ) console.log("JOB 2 DONE");
        });
        queue.process('consolelog', function(job2, done){
          console.log("show : ", job2.data.message);
          done()
        });

        // THIS IS THE THIRD JOB IN THE QUEUE = SEND SMS
        var job3 = queue.create('sendSMS', {
          Message: 'Sending this sms with node.js !!',
          PhoneNumber: '+62817778755'
        }).save( function(err){
           if( !err ) console.log("JOB 3 DONE");
        });
        queue.process('sendSMS', function(job3, done){
          sendSMS(job3.data, done)
        });



   }, null, true, /* Start the job right now */
    'Asia/Jakarta' /* Time zone of this job. */
  );
}

var blastEmailList = ['laksono.suryadi@gmail.com']

createNewCron('34 13 11 3 *', blastEmailList, 'Ini adalah subject ke 1', '111111', '<h1 style="color: red">Hello World 1</h1>')

createNewCron('35 13 11 3 *', blastEmailList, 'Ini adalah subject ke 2', '222222', '<h1 style="color: blue">Hello World 2</h1>')


function sendEmail (data, done) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'bootcamp8.project@gmail.com',
          pass: process.env.PASSWORD
      }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"Laksono - Hacktiv8" <bootcamp8.project@gmail.com>', // sender address
      to: data.to, // list of receivers
      subject: data.subject, // Subject line
      text: data.text, // plain text body
      html: data.html // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
  });
  done();
}

function sendSMS (dataSMS, done) {
  var sns = new AWS.SNS({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey:process.env.AWS_SECRET,
    region: 'us-west-2'
  })

  var params = {
    Message: dataSMS.Message,
    MessageStructure: 'string',
    PhoneNumber: dataSMS.PhoneNumber
  };

  sns.publish(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
  done()
}
