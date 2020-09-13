'use strict';

require('dotenv').config();

const request = require('supertest');
const apiEndpoint = process.env.BD_API_PATH;

describe('Messaging', () => {
    
        jest.setTimeout(30000);
        let customHeaders = {"authorization": "testauth", "version_code": "any version code", "version_name": "any version name"};
       

        let body = {
                 message : 'testmessage',
                 receiver : 'testdriver',
                 sender : 'testuser',
                 timestamp : 'now',
                 ride : 'current ride',
          };


        it('should send chat message', () => {
                return request(apiEndpoint)
                        .post('/messages/send')
                        .send(body)
                        .set(customHeaders)
                        .expect(200);
        });


  })