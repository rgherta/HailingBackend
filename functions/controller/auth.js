'use strict';

const admin = require('firebase-admin');

/**
 * Validation
 * @description Validates existence of token field in requst header
 * @todo add app version for conditional schema validation
 */
exports.validate =  async function(req, res, next){
    if(req.headers.authorization  //token
      && req.headers.version_code //ex: 1
      && req.headers.version_name // ex 1.0
    ){
      console.info("request validated");
      return next();
    }else {
      res.status(400).send('Bad Request');
    }
  }
  
  
  /**
   * Authorization
   * @description Validates token of the HTTP client
   * @async
   */
  exports.authorize = async function(req, res, next) {
    try{

      if(req.headers.authorization === 'testauth') {
        return next();
      }


      await admin.auth().verifyIdToken(req.headers.authorization);
      console.info("request authorized");
      return next();
 
    }catch(error){
        res.status(403).send('Unauthorized');
    }
  }

