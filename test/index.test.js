const expect = require('chai').expect;
const nock = require('nock');

const fs = require('fs');
const Unifi = require('../index');

const response_login = require('./response.login.json');
const response_tag = require('./response.tag.json');
const response_device_all = require('./response.device_all.json');
const response_device_mac = require('./response.device_mac.json');
const response_device_put = require('./response.device_put.json');

describe('login related tests', () => {
    it('Should be able to login', (done) => {
        nock('http://unificontroller:8443')
            .post('/api/login')
            .reply(200, response_login, {
                'Set-Cookie': [
                    'unifises=WTLO4ls6iAEJZLyAFXVwhWDvn0IeDKkC; Path=/; Secure; HttpOnly',
                    'csrf_token=0WHWBOjF6OQ9OpU9iMV9z8LiQj7ME4oD; Path=/; Secure'
                ]
            });

        unifi = new Unifi('http://unificontroller:8443');
        unifi.login('secretusername', 'secretpassword')
        .then(response => {
            expect(typeof response).to.equal('object');
            expect(typeof response.meta).to.equal('object');
            expect(unifi._cookie).to.equal('unifises=WTLO4ls6iAEJZLyAFXVwhWDvn0IeDKkC; csrf_token=0WHWBOjF6OQ9OpU9iMV9z8LiQj7ME4oD;');
            expect(unifi._xCsrfToken).to.equal('0WHWBOjF6OQ9OpU9iMV9z8LiQj7ME4oD');
            done();
        });

    });

    it('Should fail to login', (done) => {
        //todo
        done();
    });
});

describe('api feature tests', () => {
    var unifi;
    var real;

    beforeEach(ready => {
        nock('http://unificontroller:8443')
            .post('/api/login')
            .reply(200, response_login, {
                'Set-Cookie': [
                    'unifises=WTLO4ls6iAEJZLyAFXVwhWDvn0IeDKkC; Path=/; Secure; HttpOnly',
                    'csrf_token=0WHWBOjF6OQ9OpU9iMV9z8LiQj7ME4oD; Path=/; Secure'
                ]
            });

        unifi = new Unifi('http://unificontroller:8443');
        unifi.login('secretusername', 'secretpassword')
        .then(response => {
            ready();
        });
    });

    it('Should get the tag', (done) => {
        nock('http://unificontroller:8443')
            .get('/api/s/default/rest/tag')
            .reply(200, response_tag);

        unifi.getTag().then(response => {
            expect(typeof response.meta).to.equal('object');
            expect(response.meta.rc).to.equal('ok');
            done();
        })
        .catch(err => {
            console.log(err);
            done();
        });
    });

    it('Should get all devices', (done) => {
        nock('http://unificontroller:8443')
            .get('/api/s/default/stat/device')
            .reply(200, response_device_all);

        unifi.getDevices().then(response => {
            expect(typeof response.meta).to.equal('object');
            expect(response.meta.rc).to.equal('ok');
            expect(response.data[0].hostname).to.equal('UBNT');
            expect(response.data[0].device_id).to.equal('5ee13048da6ad50006e3177b');
            done();
        })
        .catch(err => {
            console.log(err);
            done();
        });
    });

    it('Should get device with specific mac', (done) => {
        nock('http://unificontroller:8443')
            .get('/api/s/default/stat/device')
            .reply(200, response_device_mac);

        unifi.getDevice(['e0:63:da:ce:82:71']).then(response => {
            expect(typeof response.meta).to.equal('object');
            expect(response.meta.rc).to.equal('ok');
            expect(response.data[0].mac).to.equal('e0:63:da:ce:82:71');

            // number of ports
            expect(response.data[0].port_table.length).to.equal(8);

            done();
        })
        .catch(err => {
            done();
        });
    });

    it('Should write port overrides to specific device', (done) => {
        nock('http://unificontroller:8443')
            .put('/api/s/default/rest/device/5ee13048da6ad50006e3177b')
            .reply(200, response_device_put);

        const port_overrides = {
            "port_overrides": [
                {
                    "poe_mode": "off",
                    "port_idx": 5,
                    "port_security_mac_address": [],
                    "portconf_id": "5ee12ed5da6ad50006e3176f"
                },
                {
                    "poe_mode": "off",
                    "port_idx": 6,
                    "port_security_mac_address": [],
                    "portconf_id": "5ee12ed5da6ad50006e3176f"
                },
                {
                    "poe_mode": "off",
                    "port_idx": 7,
                    "port_security_mac_address": [],
                    "portconf_id": "5ee12ed5da6ad50006e3176f"
                }
            ]
        };

        unifi.writePortOverrides('5ee13048da6ad50006e3177b', port_overrides).then(response => {
            expect(typeof response.meta).to.equal('object');
            expect(response.meta.rc).to.equal('ok');
            done();
        })
        .catch(err => {
            done(err);
        });
    });

});

//quickly copy this to add debug responses
//fs.appendFile('test/response.login.json', JSON.stringify(response), function(err) {});
