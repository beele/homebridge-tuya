import {Tuya} from "./tuya";

export abstract class BaseDevice {

    public id: string;
    public name: string;
    public icon: string;
    public dev_type: string;
    public ha_type: string;
    public data: any;

    protected tuya: Tuya;

    protected constructor(base: BaseDevice) {
        this.tuya = null;
        this.applyBaseState(base);
    }

    public setTuya(tuya: Tuya): void {
        this.tuya = tuya;
    }

    private applyBaseState(sourceBaseDevice: BaseDevice) {
        this.id = sourceBaseDevice.id;
        this.name = sourceBaseDevice.name;
        this.icon = sourceBaseDevice.icon;
        this.dev_type = sourceBaseDevice.dev_type;
        this.ha_type = sourceBaseDevice.ha_type;
    }

    abstract applySpecificState(data: any): void;

    public abstract createHomekitAccessory(Accessory: any, Service: any, Characteristic: any, UUIDGen: any): any;
    public abstract attachHomekitCharacteristics(accessoryInstance: any, Service: any, Characteristic: any): void;

    protected async control(command: string, payloadName: string, payload: any): Promise<any> {
        if (!this.tuya) {
            throw new Error('Cannot control device, no Tuya instance!');
        }

        const body: DeviceControlPayload = {
            header: {
                name: command,
                namespace: 'control',
                payloadVersion: 1
            },
            payload: {
                accessToken: '',
                devId: this.id
            }
        };
        body.payload[payloadName] = payload;

        const result = await this.tuya.controlDevice(body);
        //TODO: Implement error handling!
        return Promise.resolve();
    }
}

export enum DeviceTypes {
    Light = 'light',
    Outlet = 'switch'
}

export interface DeviceControlPayload {
    header: {
        name: string;
        namespace: string;
        payloadVersion: number;
    };
    payload: {
        accessToken: string;
        devId: string;
        [key: string]: any;
    }
}
