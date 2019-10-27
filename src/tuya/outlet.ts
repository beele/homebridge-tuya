import {BaseDevice} from "./base-device";

export class Outlet implements BaseDevice {

    public readonly id: string;
    public readonly name: string;
    public readonly icon: string;
    public readonly dev_type: string;
    public readonly ha_type: string;
    public readonly data: any;

    public online: boolean;
    public state: boolean;
}