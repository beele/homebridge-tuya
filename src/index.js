const Tuya = require("./tuya/tuya").Tuya;
const DevicePrototypes = require("./tuya/device-prototypes").DevicePrototypes;
const DeviceTypes = require("./tuya/base-device").DeviceTypes;

let Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    Accessory = homebridge.platformAccessory;

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-tuya-platform', 'TuyaPlatform', TuyaPlatform, true);
};

function TuyaPlatform(log, config, api) {
    const platform = this;
    this.log = log;
    this.config = config;
    this.accessories = new Map();

    if (api) {
        platform.api = api;
        platform.api.on('didFinishLaunching', platform.didFinishLaunching.bind(platform));
    }
}

TuyaPlatform.prototype.didFinishLaunching = function () {
    const platform = this;

    setTimeout(async () => {
        platform.log('Restored accessories: ' + platform.accessories.size);

        platform.tuya = new Tuya(platform.config['username'], platform.config['password'], platform.config['countryCode']);
        const devices = await platform.tuya.getDevices();

        //Set the Tuya instance on all accessories that were cached!
        for (const accessory of platform.accessories.values()) {
            accessory.context.device.setTuya(platform.tuya);
        }

        if (platform.accessories.size === 0) {
            for (let device of Object.values(devices)) {

                //TODO: For testing only!
                if(device.dev_type === DeviceTypes.Light) {
                    platform.log('adding accessory: ' + device.name);
                    platform.addAccessory(device);
                }
            }
        } else {
            //TODO: Check for changes in registered deviced and add/remove accordingly!
        }
    });
};

//Called by Homebridge when restoring cached accessories!
TuyaPlatform.prototype.configureAccessory = function (accessory) {
    const platform = this;

    platform.accessories.set(accessory.context.id, accessory);
    DevicePrototypes.applyPrototype(accessory.context.device);
    accessory.context.device.attachHomekitCharacteristics(accessory, Service, Characteristic);
};

TuyaPlatform.prototype.addAccessory = function (device) {
    const platform = this;

    const accessory = device.createHomekitAccessory(Accessory, Service, Characteristic, UUIDGen);
    device.setTuya(platform.tuya);

    platform.accessories.set(accessory.context.id, accessory);
    platform.api.registerPlatformAccessories('homebridge-tuya-platform', 'TuyaPlatform', [accessory]);
};
