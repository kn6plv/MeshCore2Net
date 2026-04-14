#! /root/.nvm/versions/node/v25.6.1/bin/node

const { Buffer } = require('node:buffer');
const Dgram = require('node:dgram');
const { SerialPort } = require("serialport");

const MESHCORE_SERIAL = "/dev/ttyS0";
const INTERFACE_ADDRESS = "10.209.100.78";

const MESHCORE_BAUDRATE = 115200;

const MULTICAST_ADDRESS = "224.0.0.69";
const MULTICAST_PORT = 4402;

const port = new SerialPort({
  path: MESHCORE_SERIAL,
  baudRate: MESHCORE_BAUDRATE
});

const udp = Dgram.createSocket({ type: "udp4", reuseAddr: true });
udp.bind(MULTICAST_PORT, _ => {
    udp.addMembership(MULTICAST_ADDRESS, INTERFACE_ADDRESS);
    udp.setMulticastInterface(INTERFACE_ADDRESS);
    udp.setMulticastLoopback(false);
});

let incoming = Buffer.alloc(0);
port.on("data", buf => {
    incoming = Buffer.concat([ incoming, buf ]);
    while (incoming.length >= 6) {
        if (incoming.readUInt16BE(0) === 0xC03E) {
            const len = incoming.readUInt16BE(2);
            if (len < 256) {
                if (incoming.length >= len + 6) {
                    console.log(incoming.subarray(0, len + 6));
                    udp.send(incoming, 0, len + 6, MULTICAST_PORT, MULTICAST_ADDRESS, err => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    incoming = Buffer.from(incoming.subarray(len + 6));
                    continue;
                }
                break;
            }
        }
        const sync = incoming.indexOf(0xC0, 1);
        if (sync !== -1) {
            incoming = Buffer.from(incoming.subarray(sync));
        }
        else {
            incoming = Buffer.alloc(0);
        }
    }
});
udp.on("message", (message, rinfo) => {
//console.log(message, rinfo);
    port.write(message);
});
