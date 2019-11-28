import {Light} from "./light";
import {Outlet} from "./outlet";
import {BaseDevice, DeviceTypes} from "./base-device";

export class DevicePrototypes {

    public static applyPrototype(device: BaseDevice): void {
        switch (device.dev_type) {
            case DeviceTypes.Light:
                Object.setPrototypeOf(device, Light.prototype);
                break;
            case DeviceTypes.Outlet:
                Object.setPrototypeOf(device, Outlet.prototype);
                break;
            default:
                console.log('Unknown device type: ' + device.dev_type);
        }
    }
 }
