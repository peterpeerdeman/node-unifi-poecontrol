"use strict";

const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
    rejectUnauthorized: false
});

class Unifi {
    constructor(controller_url) {
        this._cookie;
        this._controller_url = controller_url;
    }

    login(controller_username, controller_password) {
        return axios({
            url: `${this._controller_url}/api/login`,
            method: 'post',
            httpsAgent: agent,
            data: {
                "username":controller_username,
                "password":controller_password,
                "remember":true,
                "strict":true
            },
            withCredentials: true,
        })
        .then(response => {
            const cookielines = response.headers['set-cookie'].map(cookieline => {
                return cookieline.split(' ')[0];
            });
            this._cookie = cookielines.join(' ');
            this._xCsrfToken = this._cookie.match(/csrf_token=(.*);/)[1];
            return response.data;
        })
        .catch(err => {
            return console.log(err);
        });;
    }

    apiCall(url, method='get', data={}) {
        return axios({
            url: `${this._controller_url}${url}`,
            method: method,
            data: data,
            headers: {
                'Cookie': this._cookie,
                'X-Csrf-Token': this._xCsrfToken
            },
            httpsAgent: agent,
        }).then(response => {
            return response.data;
        });
    }

    getTag() {
        return this.apiCall('/api/s/default/rest/tag');
    }

    getDevices() {
        return this.apiCall('/api/s/default/stat/device');
    }

    getDevice(macs) {
        return this.apiCall('/api/s/default/stat/device', 'get', {
            'macs': macs
        });
    }

    writePortOverrides(device_id, port_overrides) {
        return this.apiCall(`/api/s/default/rest/device/${device_id}`, 'put', port_overrides);
    }

    setPoePorts(device_id, poePorts) {
        return this.getDevices().then(response => {
            const device = response.data.find(element => {
                return element.device_id == device_id;
            });
            if (!device) {
                throw new Error('device not found');
            }
            const current_port_table = device.port_table;
            const poe_ports_table = current_port_table.filter(port => {
                return port.port_poe == true;
            });
            if (poePorts.length > poe_ports_table.length) {
                throw new Error('too many poe ports specified');
            }

            const current_port_overrides = device.port_overrides;

            // generate port overrides
            const port_overrides = poe_ports_table.map((port, index) => {
                let portFallback = undefined;
                if (typeof poePorts[index] === 'undefined' && current_port_overrides) {
                    const portOverride = current_port_overrides.find(element => {
                        return element.port_idx == port.port_idx;
                    });
                    if(portOverride) {
                        return portOverride;
                    } else {
                        return undefined;
                    }
                }
                return {
                    poe_mode: poePorts[index] ? 'auto' : 'off',
                    port_idx: port.port_idx,
                    port_security_mac_address: [],
                    portconf_id: port.portconf_id
                };
            });

            const filteredOverrides = port_overrides.filter(element => {
                return (typeof element !== 'undefined');
            });

            return this.writePortOverrides(device_id, {port_overrides:filteredOverrides}).then(response => {
                if(response.meta.rc == 'ok') {
                    return filteredOverrides;
                } else {
                    throw new Error('something went wrong while sending overrides');
                }
            });

        });
    }
}

module.exports = Unifi;
