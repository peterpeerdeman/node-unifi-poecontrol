const Unifi = require('./index');

const unifi = new Unifi('https://192.168.1.5:8443');
unifi.login('username', 'password').then(loginresponse => {
    unifi.getDevices().then(response => {
        const device_id = response.data[0].device_id;

        // set first and second poe port to be enabled, third one to be disabled
        unifi.setPoePorts(device_id, [true, true, false]).then(response => {
            console.log(response);
        });
    });
});
