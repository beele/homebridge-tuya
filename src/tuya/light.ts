import {BaseDevice} from "./base-device";

export class Light extends BaseDevice {

    public brightness: number;
    public colorMode: boolean;
    public color: TuyaDataModelColor;
    public online: boolean;
    public state: boolean;
    public colorTemp: number;

    private hueUpdated: boolean;
    private saturationUpdated: boolean;

    constructor(base: BaseDevice) {
        super(base);
        this.applySpecificState(base.data);

        this.hueUpdated = false;
        this.saturationUpdated = false;
    }

    applySpecificState(data: any): void {
        const specificData: TuyaDataModelLight = data;

        this.brightness = specificData.brightness;
        this.colorMode = specificData.color_mode !== 'white';
        this.color = specificData.color;
        this.online = specificData.online;
        this.state = specificData.state;
        this.colorTemp = specificData.color_temp;
    }

    public createHomekitAccessory(Accessory: any, Service: any, Characteristic: any, UUIDGen: any): void {
        const uuid = UUIDGen.generate(this.id);
        const accessory = new Accessory(this.name, uuid);
        accessory.context = {
            id: this.id,
            device: this
        };
        accessory.reachable = true;
        accessory.addService(Service.Lightbulb, super.name);

        accessory.getService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.Manufacturer, 'Tuya')
            .setCharacteristic(Characteristic.Model, this.dev_type)
            .setCharacteristic(Characteristic.SerialNumber, this.id);

        this.attachHomekitCharacteristics(accessory, Service, Characteristic);
        return accessory;
    }

    public attachHomekitCharacteristics(accessoryInstance: any, Service: any, Characteristic: any): void {
        accessoryInstance.getService(Service.Lightbulb)
            .getCharacteristic(Characteristic.On)
            .on('get', (callback: Function) => {
                callback(null, accessoryInstance.context.device.state ? 1 : 0);
            })
            .on('set', (value: any, callback: Function) => {
                try {
                    console.log('On/off set: ' + value);
                    accessoryInstance.context.device.state = value;
                    this
                        .control('turnOnOff', 'value', value ? 1 : 0)
                        .then((result) => {
                            console.log('device controlled!');
                        })
                        .catch((error) => {
                            console.log('device control error!');
                            console.log(error);
                        });
                    return callback();
                } catch (error) {
                    return callback({error: 'Could not set light on/off', details: error});
                }
            });

        accessoryInstance.getService(Service.Lightbulb)
            .getCharacteristic(Characteristic.ColorTemperature)
            .on('get', (callback: Function) => {
                callback(null, accessoryInstance.context.device.colorTemp); // 140 - 500
            })
            .on('set', (value: any, callback: Function) => {
                try {
                    console.log('Color temperature set: ' + value);
                    //TODO: control device & swap brightness!
                    accessoryInstance.context.device.colorMode = false;
                    accessoryInstance.context.device.colorTemp = value;

                    this.printState(accessoryInstance);
                    return callback();
                } catch (error) {
                    return callback({error: 'Could not set light color temp', details: error});
                }
            });

        accessoryInstance.getService(Service.Lightbulb)
            .getCharacteristic(Characteristic.Brightness)
            .on('get', (callback: Function) => {
                if (accessoryInstance.context.device.colorMode) {
                    callback(null, accessoryInstance.context.device.color.brightness); // 0 - 100
                } else {
                    callback(null, accessoryInstance.context.device.brightness); // 0 - 100
                }
            })
            .on('set', (value: any, callback: Function) => {
                try {
                    console.log('Brightness set: ' + value);
                    //TODO: Control device & use the correct brightness!
                    if (accessoryInstance.context.device.colorMode) {
                        accessoryInstance.context.device.color.brightness = value;
                    } else {
                        accessoryInstance.context.device.brightness = value;
                    }

                    this.printState(accessoryInstance);
                    return callback();
                } catch (error) {
                    return callback({error: 'Could not set light brightness', details: error});
                }
            });

        //Not all lights support RGB colors!
        if (accessoryInstance.context.device.color) {
            console.log('Adding hue/saturation listeners for device: ' + accessoryInstance.context.device.name);

            //TODO: Hue & Sat are always updated at the same time!?

            accessoryInstance.getService(Service.Lightbulb)
                .getCharacteristic(Characteristic.Hue)
                .on('get', (callback: Function) => {
                    callback(null, accessoryInstance.context.device.color.hue); // 0 - 360
                })
                .on('set', (value: any, callback: Function) => {
                    try {
                        console.log('Hue set: ' + value);
                        //TODO: control device!
                        accessoryInstance.context.device.colorMode = true;
                        accessoryInstance.context.device.hue = value;

                        this.printState(accessoryInstance);
                        return callback();
                    } catch (error) {
                        return callback({error: 'Could not set light hue', details: error});
                    }
                });

            accessoryInstance.getService(Service.Lightbulb)
                .getCharacteristic(Characteristic.Saturation)
                .on('get', (callback: Function) => {
                    callback(null, accessoryInstance.context.device.color.saturation); // 0 - 100
                })
                .on('set', (value: any, callback: Function) => {
                    try {
                        console.log('Saturation set: ' + value);
                        //TODO: control device!
                        accessoryInstance.context.device.colorMode = true;
                        accessoryInstance.context.device.saturation = value;

                        this.printState(accessoryInstance);
                        return callback();
                    } catch (error) {
                        return callback({error: 'Could not set light saturation', details: error});
                    }
                });
        }
    }

    private printState(accessory: any): void {
        console.log(JSON.stringify(accessory.context.device, null, 4));
    }
}

export interface TuyaDataModelColor {
    saturation: number;
    brightness: number;
    hue: number;
}

export interface TuyaDataModelLight {
    brightness: number;
    color_mode: string; //White = not in rgb mode!
    color: TuyaDataModelColor;
    online: boolean;
    state: boolean;
    color_temp: number;
}
