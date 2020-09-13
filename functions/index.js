'use strict';

const functions = require( 'firebase-functions');
const admin = require('firebase-admin'); 
const serviceAccount = require('./key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://beta-94f76.firebaseio.com"
});

const app = require('express')();
const db = admin.firestore();

const auth = require('./controller/auth.js');
const geo = require('./controller/geohash.js');
const reg = require('./controller/registration.js');
const msg = require('./controller/messaging.js');
const { Ride } = require('./model/ride');



/**
 * EXPRESSJS
 * @description Initializes server endpoint
 */
exports.api = functions.region('europe-west1').https.onRequest(app);
app.use([auth.validate, auth.authorize]);


/**
 * DJV
 * @description Initializes schema validation factory 
 * http://korzio.github.io/djv/
 * http://json-schema.org/understanding-json-schema/
 */
// const djv = require('djv');
// const env = new djv();

// function validates(object, schema){
//   return !env.validate(schema, object);
// }



/**
 * ROUTER
 * @description Defines all routes requested by the client and associates functions    
 */
app.post('/rides/hail', saveRide, getAvailableDrivers, getNearbyDrivers, hailDrivers, updateRide );
app.post('/rides/customer/accept', acceptRide, notifyDriver, getAvailableDrivers, notifyObservers ); //change driver status? user accept
app.post('/rides/driver/accept', driverAcceptRide ); //driver accept
app.post('/rides/checkdrivers', checkDrivers );
app.get('/rides', reg.isDriver, getRides );

app.post('/users/add',            reg.addUser, reg.addDriverExtra           );
app.post('/users/updatefcm',      reg.updateFcm                             );
app.post('/users/updateloc',      reg.isDriver, reg.updateLoc               );
app.get('/users/driver',          reg.checkRequester, reg.getDriver         );

app.post('/users/drivers/status', reg.isDriver, reg.changeStatusDrv         );
app.post('/messages/send',        msg.sendMessage                           );



/**
 * Save Ride
 * @description Saves ride data in Firestore rides collection
 * @async
 */

  async function saveRide(req, res, next){
  try{

    console.info("route: /rides/hail");
    console.info("middleware: saveRide");

    let user = await admin.auth().getUser(req.body.requester);

    let newRide = new Ride( '', req.body.requester, user.displayName, new admin.firestore.GeoPoint(req.body.pickup.lat, req.body.pickup.long)
                            , req.body.hashp, req.body.pickup_str, new admin.firestore.GeoPoint(req.body.destination.lat, req.body.destination.long)
                            , req.body.hashd, req.body.destination_str, req.body.points, req.body.distance, req.body.duration, req.body.payment
                            , admin.firestore.Timestamp.now(), 0, '', '', [], 1
                          );

    let docId = db.collection('rides').doc().id;
    newRide.uid = docId;

    await db.collection('rides').doc(docId).set(newRide.toJson);

    req.r_myride = newRide.toJson;
    req.r_search_step = 1;


    return next();

  }catch(err){
    res.status(500).send('Internal Server Error');
  }
}


 async function driverAcceptRide(req, res, next){
  try{
    let contract = req.body;
    await db.collection('rides').doc(contract.ride).update({
      'ride_drivers' : admin.firestore.FieldValue.arrayUnion(contract)
    });

    return res.status(200).send({'response':'ok'});
   // return res.status(201).send('Updated');
  }catch(err){
    res.status(500).send('Internal Server Error');
  }
}

async function acceptRide(req, res, next){
  try{

    console.info("route: /rides/customer/accept");

    let myRide = req.body.ride;
    let myDriver = req.body.driver;
    await db.collection('rides').doc(myRide).update({
                  'driver' : myDriver,
                  'status' : 1
                });

    //return res.status(201).send('Created')
    return next();
  }catch(err){
    res.status(500).send('Internal Server Error');
  }
}


async function checkDrivers(req, res, next){
  try{

    console.info("route: /rides/checkdrivers")

    let myRide = req.body.ride;
    let myRequester = req.body.requester;

    let rideRef = await db.collection('rides').doc(myRide).get();
    let ride = rideRef.data();
    let drivers = ride.ride_drivers;

    let promises  = drivers.map( element => {
                  return db.collection('drivers').doc(element.driver);
                });
    
    let data = await Promise.all(promises.map(query => query.get()));
    data = data.map(snapshot => {
      return snapshot.data();
    });

    // join properties and delete sensible data
    data = data.map(dbDriver => {
      let newDriver = drivers.find(d => d.driver == dbDriver.uid);
      newDriver.name = dbDriver.name;
      newDriver.phone = dbDriver.phone;
      newDriver.plate = dbDriver.plate;
      newDriver.ppk = dbDriver.ppk;
      newDriver.rating = dbDriver.rating;
      newDriver.rides = dbDriver.rides;
      newDriver.vehicle = dbDriver.vehicle;
      newDriver.loc = dbDriver.loc;
      return newDriver;
    })

    console.info("ride_drivers: ", data);

    return res.status(200).send({ 'ride_drivers' : data });

  }catch(err){
    res.status(500).send('Internal Server Error');
  }

}


async function getAvailableDrivers(req, res, next){
  try{

    console.info("middleware: getAvailableDrivers");

      let availableDrivers = await db.collection('drivers').where('status', '==', 5).get(); //5 available, 6 busy, 7 offline   
      let drivers = [];

      availableDrivers.forEach( driver => {
                                          drivers.push(driver.data());
                                        });
      req.r_av_drivers = drivers;

      
      return next();

  }catch(err){
      res.status(500).send('Internal Server Error');
  }
}

async function getNearbyDrivers(req, res, next){
  try{

    console.info("middleware: getNearbyDrivers");

    let step = req.r_search_step;
    let availableDrivers = req.r_av_drivers;
    let radius = 10000; //0.8
    radius *= step;

    const proximityHashes = await geo.proximityHashes([ req.body.pickup.lat, req.body.pickup.long ], radius*1000);
    const proximityDrivers = proximityHashes.map(location => {
      return availableDrivers.filter( driver => driver.hash_loc >= location[0] && driver.hash_loc <= location[1]) 
    })

    const driversInRange = proximityDrivers[0].reduce( (acc, driver) => {
       let dist = geo.distance( [req.body.pickup.lat, req.body.pickup.long], [driver.loc['_latitude'], driver.loc['_longitude']] );
      if(dist <= radius) {
        acc.push(driver);
      }
      return acc;
    }, []);

    req.r_av_drivers = driversInRange;

    return next();
  }catch(err){
     res.status(500).send('Internal Server Error');
  }
}


/**
 * Send message
 * @description sends FCM notification to a certain device as part of the messaging system
 * more information on variaty of notification and options configurations here
 * https://www.techotopia.com/index.php/Sending_Firebase_Cloud_Messages_from_a_Node.js_Server
 * https://firebase.google.com/docs/cloud-messaging/send-message
 * @async
 */

async function hailDrivers (req, res, next){
  try{

    console.info("middleware: hailDrivers");

    let drivers = req.r_av_drivers;
    let regTokens = drivers.map(driver=>driver.fcm_token);

    let payload = {
      data: {
         type : "refresh",
         message : "PING"
      }
    };

    let options = {
      priority: 'normal',
      timeToLive: 10 * 60
    };


    let result = await admin.messaging().sendToDevice(regTokens, payload, options);
    console.info(`middleware: hailDrivers - sent fcm to ${result.successCount} drivers`);

    return next();
  }catch(err){
      res.status(500).send({'error' : err});
  }
}


async function updateRide (req, res, next){
  try{
    console.info("middleware: updateRide");
    const myRide = req.r_myride;
    //const drivers = req.r_av_drivers;

    await db.collection('rides').doc(myRide.uid).update({
      'search_step' : ++myRide.search_step
    });

    res.status(200).send({'status' : 'ok', 'ride' : myRide.uid});
  }catch(err){
      res.status(500).send('Internal Server Error');
  }
}


async function notifyObservers (req, res, next){
  try{

    console.info("middleware: notifyObservers");

    let drivers = req.r_av_drivers;
    let regTokens = drivers.map(driver=>driver.fcm_token);

    let payload = {
      data: {
         type : "refresh",
         message : "PING"
      }
    };

    let options = {
      priority: 'normal',
      timeToLive: 10 * 60
    };


    let result = await admin.messaging().sendToDevice(regTokens, payload, options);

    res.status(200).send({});
  }catch(err){
      res.status(500).send({'error' : err});
  }
}


async function notifyDriver (req, res, next){
  try{

    console.info("middleware: notifyDriver");

    let myRide = req.body.ride;
    let myDriver = req.body.driver;
    let myCust = req.body.customer;

    let driverRef = await db.collection('drivers').doc(myDriver).get();
    let regToken = driverRef.data().fcm_token;

    let payload = {
      data: {
         type : "start",
         ride : myRide,
         customer : myCust
      }
    };

    console.info(payload);

    let options = {
      priority: 'normal',
      timeToLive: 10 * 60
    };

    let result = await admin.messaging().sendToDevice(regToken, payload, options);

    return next();
  }catch(err){
      res.status(500).send({'error' : err});
  }
}





async function getRides( req, res, next ){

  try{

    let result = await db.collection('rides').where('status','==',0).get(); 
    let rides = [];
    result.forEach(ride => {
      rides.push(ride.data());
    });

    
    res.status(200).json(rides);

  }catch(err){
    res.status(500).send('Internal Server Error');
  }

}




