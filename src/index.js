const Tuya = require("./tuya/tuya").Tuya;

let Homebridge, Accessory, Service, Characteristic, hap, UUIDGen;

module.exports = function (homebridge) {
    Homebridge = homebridge;
    Accessory = homebridge.platformAccessory;
    hap = homebridge.hap;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-tuya', 'Tuya-Platform', TuyaPlatform, true);
};

function TuyaPlatform(log, config, api) {
    const self = this;
    self.log = log;
    self.config = config || {};

    if (api) {
        self.api = api;
        if (api.version < 2.1) {
            throw new Error('Unexpected API version.');
        }
        self.api.on('didFinishLaunching', self.didFinishLaunching.bind(this));
    }
}

TuyaPlatform.prototype.configureAccessory = function (accessory) {
    // Won't be invoked
};

TuyaPlatform.prototype.didFinishLaunching = function () {
    const self = this;

   //TODO: Implement!
};
