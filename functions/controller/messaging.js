'use strict';

const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Send message
 * @description sends FCM notification to a certain device as part of the messaging system
 * more information on variaty of notification and options configurations here
 * https://www.techotopia.com/index.php/Sending_Firebase_Cloud_Messages_from_a_Node.js_Server
 * https://firebase.google.com/docs/cloud-messaging/send-message
 * @async
 */

exports.sendMessage = async function(req, res, next){
    try{

      console.info("route: /messages/send")

      let payload = {
        data: {
             message : req.body.message,
             receiver : req.body.receiver,
             sender : req.body.sender,
             timestamp : req.body.timestamp,
             ride : req.body.ride,
             type : "chat"
        }
      };
 
      let options = {
      priority: 'normal',
      timeToLive: 60 * 60
     };
 
     //retrieve receiver token
     let receiverToken;
     let receiverdoc = await db.collection('users').doc(req.body.receiver).get();
     if(receiverdoc.exists){
       receiverToken = receiverdoc.data().fcm_token;
     }
 
     let response = await admin.messaging().sendToDevice(receiverToken, payload, options);
     return res.status(200).send({});
    }catch(error){
        res.status(500).send('Internal Server Error');
    }
  }