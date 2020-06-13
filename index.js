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
}

module.exports = Unifi;
