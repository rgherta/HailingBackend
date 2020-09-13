'use strict';

require('dotenv').config();

const request = require('supertest');
const apiEndpoint = process.env.BD_API_PATH;

describe('Middleware Auth', () => {

        jest.setTimeout(30000);
        let customHeaders = {"authorization": "anytoken", "version_code": "any version code", "version_name": "any version name"};

        it('should not allow any request', async (done) => {
                await request(apiEndpoint)
                        .get('/')
                        .expect(400);
                done();
        });

        it('only headers authorization, version_code, version_name', async (done) => {
                await request(apiEndpoint)
                        .get('/')
                        .set(customHeaders)
                        .expect(403);
                done();
        });

  })