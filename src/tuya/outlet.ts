import {BaseDevice} from "./base-device";

export class Outlet extends BaseDevice {

    public online: boolean;
    public state: boolean;

    constructor(base: BaseDevice) {
        super(base);
        this.applySpecificState(base.data);
    }

    applySpecificState(data: any): void {
        const specificData: TuyaDataModelOutlet = data;
        this.online = specificData.online;
        this.state = specificData.state;
    }

    public createHomekitAccessory(Accessory: any, Service: any, Characteristic: any, UUIDGen: any): void {
        const uuid = UUIDGen.generate(this.id);
        const accessory = new Accessory(this.name, uuid);
        accessory.context = {
            id: this.id,
            device: this
        };
        accessory.reachable = true;
        accessory.addService(Service.Outlet, super.name);

        accessory.getService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.Manufacturer, 'Tuya')
            .setCharacteristic(Characteristic.Model, this.dev_type)
            .setCharacteristic(Characteristic.SerialNumber, this.id);

        this.attachHomekitCharacteristics(accessory, Service, Characteristic);
        return accessory;
    }

    public attachHomekitCharacteristics(accessoryInstance: any, Service: any, Characteristic: any): void {
        accessoryInstance.getService(Service.Outlet)
            .getCharacteristic(Characteristic.On)
            .on('get', (callback: Function) => {
                callback(null, accessoryInstance.context.onOff);
            })
            .on('set', (value: any, callback: Function) => {
                try {
                    console.log('On/off set: ' + value);
                    //TODO: control device!
                    accessoryInstance.context.device.online = value === 1;
                    return callback();
                } catch (error) {
                    return callback({error: 'Could not set outlet on/off', details: error});
                }
            });
    }
}

export interface TuyaDataModelOutlet {
    online: boolean;
    state: boolean;
}
