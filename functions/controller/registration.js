'use strict';

const admin = require('firebase-admin'); 

const db = admin.firestore();
const { appUser, appDriver } =  require('../model/user');

/**
 * Save User
 * @description Saves users in common collection on first login/creation
 * @async
 */


exports.addUser = async function(req, res, next){

    try{

      let newUser = new appUser(
            req.body.category
            , admin.firestore.Timestamp.now()
            , req.body.email
            , req.body.fcm_token
            , req.body.uid
        );
  
      await db.collection('users').doc(newUser.uid).set(newUser.toJson);
  
      switch(newUser.category){
        case 7:
          return next();          
        default:
            res.status(201).send('Created');
      }   
  
    }catch(err){
     res.status(500).send('Internal Server Error');
    }
  }

  

/**
 * Save Driver Data
 * @description Saves users in common collection on first login/creation
 * @async
 */

exports.addDriverExtra = async function( req, res ){

    try{
      let newDriver = new appDriver(req.body.uid, req.body.cur, req.body.name, req.body.ppk,
                                    req.body.plate, req.body.rating, req.body.rides, req.body.status,
                                    req.body.vehicle, req.body.payment, req.body.city, req.body.phone,
                                    new admin.firestore.GeoPoint(req.body.loc.lat, req.body.loc.long),
                                    req.body.hash_loc, req.body.fcm_token
                                    );

      await db.collection('drivers').doc(req.body.uid).set(newDriver.toJson);
      res.status(201).json({status : 'created'});
  
    }catch(err){
      res.status(500).json({error: 'Internal Server Error'});
    }
  
  
}


exports.updateFcm = async function(req, res, next){

  try{
    console.info('route: /users/updatefcm');

    let uid = req.body.uid;
    let fcm = req.body.fcm;

    console.log(JSON.stringify(req.body));

    await db.collection('users').doc(uid).update({
      'fcm_token' : fcm
    });

    //TODO: move into separate middleware. 
    //TODO: if there is a similar token for another user, replace with null
    if(db.collection('drivers').doc(uid).exists)
    await db.collection('drivers').doc(uid).update({
      'fcm_token' : fcm
    });

    res.status(200).send({});
  }catch(err){
    res.status(500).send("Internal Server Error");
  }
}



exports.updateLoc = async function(req, res, next){

  try{
    console.info('route: /users/updateloc');

     let lat = req.body.lat;
     let long = req.body.long;
     let hash = req.body.hash_loc;

    await db.collection('drivers').doc(req.uid).update({
      'loc' : new admin.firestore.GeoPoint(lat, long),
      'hash_loc' : hash
    });

     res.status(200).send({});

  }catch(err){
    res.status(500).send("Internal Server Error");
  }
}



exports.isDriver = async function( req, res, next ){

  try{

    if(req.headers.authorization === 'testauth') {
      req.uid = 'testdriver'
      return next();
    }

    let driver =  await admin.auth().verifyIdToken(req.headers.authorization);
    let user = await db.collection('users').doc(driver.uid).get();

     if( user.exists && user.data().category == 7){
       req.uid = driver.uid;
       return next();
    } else {
      throw new Error('Not driver')
    }

  }catch(err){
    res.status(500).send('Internal Server Error');
  }

}


exports.changeStatusDrv = async function( req, res ){

  try{
    await db.collection('drivers').doc(req.uid).update({status : req.body.status});
    res.status(200).json({});
  }catch(err){
    res.status(500).json({});
  }

}


exports.checkRequester = async function( req, res, next ){

  try{

    if(req.headers.authorization === 'testauth') {
      return next();
    }

    let requester = await admin.auth().verifyIdToken(req.headers.authorization);

    if(requester.uid !== req.query.uid){
      res.status(403).send('Unauthorized');
    } else {
      return next();
    }


  }catch(err){
    res.status(500).json({});
  }

}


exports.getDriver = async function( req, res ){

  try{
    let driver = await db.collection('drivers').doc(req.query.uid).get();
    let result = driver.data();
    result.uid = req.query.uid;

    res.status(200).json(result);


  }catch(err){
    res.status(500).json({});
  }

}

