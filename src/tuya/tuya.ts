import {Utils} from "../utils/utils";
import {BaseDevice} from "./base-device";

const request = require('request-promise-native');

export class Tuya {

    private readonly username: string;
    private readonly password: string;
    private readonly countryCode: number;

    //TODO: Different regions based on country code!
    private readonly region: string = 'eu';

    constructor(username: string, password: string, countryCode: number) {
        this.username = username;
        this.password = password;
        this.countryCode = countryCode;
    }

    public async init(): Promise<any> {
        let session: TuyaSession = await this.authenticate();
        let baseDevicesWithData: BaseDevice[] = await this.getAllDevicesAndData(session);

        for (const baseDeviceWithData of baseDevicesWithData) {
            console.log('- ' + baseDeviceWithData.name);
            //TODO: Create devices!
        }

        //Update interval to update the state of all devices!
        setInterval(async () => {
            session = await this.renewSessionIfNeeded(session);
            baseDevicesWithData = await this.getAllDevicesAndData(session);

            //TODO: Update devices with new state!

        }, 10000); //TODO: Parametrize update interval delay!

        return Promise.resolve('Tuya logic started!');
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
                expires_in: response.body.expires_in,
                timestamp: new Date().getTime()
            });
        } else {
            return Promise.reject('Authentication failed!')
        }
    }

    private async renewSessionIfNeeded(session: TuyaSession): Promise<TuyaSession> {
        //TODO: Implement!
        return Promise.resolve(session);
    }

    private async getAllDevicesAndData(session: TuyaSession): Promise<BaseDevice[]> {
        const opts = {
            uri: 'https://px1.tuya' + this.region + '.com//homeassistant/skill',
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
}

export interface TuyaSession {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number; //TODO: is this in seconds?
    timestamp: number;
}