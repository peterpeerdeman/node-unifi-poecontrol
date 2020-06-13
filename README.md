# node-unifi-poecontrol
[![Build Status](https://travis-ci.org/peterpeerdeman/node-unifi-poecontrol.svg?branch=master)](https://travis-ci.org/peterpeerdeman/node-unifi-poecontrol)

A Unifi API client for node, aimed at controlling the POE ports on switches

was tested with UniFi Switch 8 POE-60W, should work with all unifi POE switches.

![unifi poe port scaling in action](./node-unifi-poeport.gif)

## Usage
```javascript
// Import the Unifi client
const Unifi = require('node-unifi-poecontrol');

// Create a new unifi instance, initialize with controller url
const unifi = new Unifi('https://192.168.1.5:8443');

// Login first
unifi.login('controllerusername', 'controllerpassword').then(loginresponse => {
    // Then get the devices
    unifi.getDevices().then(response => {
        const device_id = response.data[0].device_id;

        // set first and second poe port to be enabled, third one to be disabled
        unifi.setPoePorts(device_id, [true, true, false]).then(response => {
            console.log(response);
        });
    });

    // writing the port overrides manually
    // create port ovverrides
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
        console.log(response);
    })
})

```

Please find the call reponses in the testfolder example

The following API calls are available
```javascript
/**********************/
/* High-level methods */
/**********************/
unifi.setPoePorts(deviceId, [Boolean]);

/**********************/
/* Low-level methods */
/**********************/
unifi.getTag();
unifi.getDevices();
unifi.getDevice([macaddress1, macaddress2]);
unifi.writePortOverrides();
```
