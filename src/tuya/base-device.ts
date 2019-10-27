export interface BaseDevice {
    readonly id: string;
    readonly name: string;
    readonly icon: string;
    readonly dev_type: string;
    readonly ha_type: string;
    readonly data: any;
}