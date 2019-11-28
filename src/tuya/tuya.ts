import {Utils} from "../utils/utils";
import {BaseDevice, DeviceControlPayload, DeviceTypes} from "./base-device";
import {Light} from "./light";
import {Outlet} from "./outlet";

const request = require('request-promise-native');

export class Tuya {

    private readonly username: string;
    private readonly password: string;
    private readonly countryCode: number;
    //TODO: Different regions based on country code!
    private readonly region: string = 'eu';

    private intervalDelay: number = 30000;

    private session: TuyaSession;

    constructor(username: string, password: string, countryCode: number) {
        this.username = username;
        this.password = password;
        this.countryCode = countryCode;
    }

    public async getDevices(): Promise<{ [key: string]: BaseDevice }> {
        const devices: { [key: string]: BaseDevice } = {};

        this.session = await this.authenticate();
        let baseDevicesWithData: BaseDevice[] = await this.getAllDevicesAndData(this.session);

        for (const baseDeviceWithData of baseDevicesWithData) {
            devices[baseDeviceWithData.id] = this.createSpecificDevice(baseDeviceWithData);
        }

        //Update interval to update the state of all devices!
        setInterval(async () => {
            this.session = await this.renewSessionIfNeeded(this.session);
            baseDevicesWithData = await this.getAllDevicesAndData(this.session);

            for (const baseDeviceWithData of baseDevicesWithData) {
                devices[baseDeviceWithData.id].applySpecificState(baseDeviceWithData);
            }
            console.log('Devices updated!');

        }, this.intervalDelay);

        return Promise.resolve(devices);
    }

    public async controlDevice(body: DeviceControlPayload): Promise<any> {
        this.session = await this.renewSessionIfNeeded(this.session);

        body.payload.accessToken = this.session.access_token;

        console.log(body);

        const opts = {
            uri: 'https://px1.tuya' + this.region + '.com/homeassistant/skill',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body,
            json: true,
            strictSSL: false,
            resolveWithFullResponse: true,
            timeout: 1000
        };
        const response: any =  await Utils.backoff(2, request.post(opts), 500);
        //TODO: Implement error handling!
        return Promise.resolve();
    }

    private async authenticate(): Promise<TuyaSession> {
        const opts = {
            uri: 'https://px1.tuya' + this.region + '.com/homeassistant/auth.do',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'userName': this.username,
                'password': this.password,
                'countryCode': this.countryCode,
                'bizType': '',
                'from': 'tuya'
            },
            json: true,
            strictSSL: false,
            resolveWithFullResponse: true,
            timeout: 1000
        };

        const response: any = await Utils.backoff(2, request.post(opts), 500);
        if (response.body && response.body.access_token) {
            return Promise.resolve({
                access_token: response.body.access_token,
                refresh_token: response.body.refresh_token,
                token_type: response.body.token_type,
                expiration: (new Date().getTime() + (response.body.expires_in * 1000))
            });
        } else {
            return Promise.reject('Authentication failed!')
        }
    }

    //TODO: Fix error that randomly occurs when renewing!
    private async renewSessionIfNeeded(session: TuyaSession): Promise<TuyaSession> {
        if (!session) {
            console.log('No session yet, making one!');
            return Promise.resolve(await this.authenticate());

        } else if (new Date().getTime() < (session.expiration - this.intervalDelay)) {
            console.log('Session still valid!');
            return Promise.resolve(session);

        } else {
            console.log('Renewing session...');

            const opts = {
                uri: 'https://px1.tuya' + this.region + '.com/homeassistant/access.do?grant_type=refresh_token&refresh_token=' + session.refresh_token,
                headers: {
                    'Content-Type': 'application/json'
                },
                json: true,
                strictSSL: false,
                resolveWithFullResponse: true,
                timeout: 1000
            };

            try {
                const response: any = await Utils.backoff(2, request.get(opts), 500);
                console.log(response.body);
                if (response.body && response.body.access_token) {
                    session.access_token = response.body.access_token;
                    session.refresh_token = response.body.refresh_token;
                    session.expiration = (new Date().getTime() + (response.body.expires_in * 1000));
                    return Promise.resolve(session);
                } else {
                    return Promise.reject('Could not renew session!')
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    private async getAllDevicesAndData(session: TuyaSession): Promise<BaseDevice[]> {
        const opts = {
            uri: 'https://px1.tuya' + this.region + '.com/homeassistant/skill',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                header: {
                    name: "Discovery",
                    namespace: "discovery",
                    payloadVersion: 1
                },
                payload: {
                    "accessToken": session.access_token
                }
            },
            json: true,
            strictSSL: false,
            resolveWithFullResponse: true,
            timeout: 1000
        };

        const response: any = await Utils.backoff(2, request.post(opts), 500);
        if (response.body && response.body.payload) {
            return Promise.resolve(response.body.payload.devices);
        } else {
            return Promise.reject('Could not get devices & data!')
        }
    }

    private createSpecificDevice(deviceData: BaseDevice): BaseDevice {
        switch (deviceData.dev_type) {
            case DeviceTypes.Light:
                return new Light(deviceData);
            case DeviceTypes.Outlet:
                return new Outlet(deviceData);
            default:
                throw new Error('Device Type: ' + deviceData.dev_type + ' not supported!');
        }
    }
}

export interface TuyaSession {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expiration: number;
}
