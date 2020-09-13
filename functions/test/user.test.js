'use strict';

require('dotenv').config();


const { appUser, appDriver } =  require('../model/user');
const admin = require('firebase-admin');

const request = require('supertest');
const apiEndpoint = process.env.BD_API_PATH;


describe('Middleware Registration', () => {

        jest.setTimeout(30000);
        let customHeaders = {"authorization": "testauth" , "version_code": "any version code", "version_name": "any version name"};

        it('should save user', async () => {

                let newUser = new appUser(0, "anyvalue", "sample@email.com", "fcmtoken", "testuser");
                await request(apiEndpoint)
                        .post('/users/add')
                        .send(newUser.toJson)
                        .set(customHeaders)
                        .expect(201);
                return;

        });



        it('should save driver', async () => {

                let newUser = new appUser(7, "anyvalue", "sample@email.com", "fcmtoken", "testdriver");
                let newDriver = new appDriver('testdriver', 'cur', 'name', 'ppk',
                                                'plate', 'rating', 'rides', 'status',
                                                'vehicle', 'payment', 'city', 'phone',
                                                 {lat : 23.34, long : 55.87},
                                                'hashloc', 'testdriverfcmtoken'
                                                );

                await request(apiEndpoint)
                        .post('/users/add')
                        .set(customHeaders)
                        .send({...newUser.toJson, ...newDriver.toJson})
                        .expect(201);
                return;

        });



        it('should update user fcm token', async () => {
                let body = {
                        uid : 'testuser',
                        fcm : 'newFcm'
                }
                await request(apiEndpoint)
                        .post('/users/updatefcm')
                        .send(body)
                        .set(customHeaders)
                        .expect(200);
                return;

        });



        it('should update driver fcm token', async () => {
                let body = {
                        uid : 'testdriver',
                        fcm : 'newFcm'
                }
                await request(apiEndpoint)
                        .post('/users/updatefcm')
                        .send(body)
                        .set(customHeaders)
                        .expect(200);
                return;

        });

        it('should update location', async () => {
                let body = {
                        uid : 'testdriver',
                        lat : 45,
                        long : 32,
                        hash_loc : 'hashloc'
                }
                await request(apiEndpoint)
                        .post('/users/updateloc')
                        .send(body)
                        .set(customHeaders)
                        .expect(200);
                return;

        });

        it('should update status', async () => {
                let body = {
                        uid : 'testdriver',
                        status : 10
                }
                await request(apiEndpoint)
                        .post('/users/drivers/status')
                        .send(body)
                        .set(customHeaders)
                        .expect(200);
                return;

        });

        it('should get own driver data', async () => {
                await request(apiEndpoint)
                        .get('/users/driver')
                        .query({uid : 'testdriver'})
                        .send()
                        .set(customHeaders)
                        .expect(200);
                return;

        });




  })