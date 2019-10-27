import {BaseDevice} from "./base-device";

export class Light implements BaseDevice {

    public readonly id: string;
    public readonly name: string;
    public readonly icon: string;
    public readonly dev_type: string;
    public readonly ha_type: string;
    public readonly data: any;

    public brightness: number;
    public color_mode: string; //White = not in rgb mode!
    public color: TuyaLightColor;
    public online: boolean;
    public state: boolean;
    public color_temp: number;
}

export interface TuyaLightColor {
    saturation: number;
    brightness: number;
    hue: number;
}