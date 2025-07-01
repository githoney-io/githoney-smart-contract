// This file is auto-generated.

import { Client as TRPClient, type ClientOptions, type TxEnvelope } from 'tx3-sdk/trp';

export const DEFAULT_TRP_ENDPOINT = "http://localhost:3000/trp";

export const DEFAULT_HEADERS = {
};

export const DEFAULT_ENV_ARGS = {
};

export type DeploySettingsParams = {
    bountycreationfee: number;
    bountyrewardfee: number;
    githoneyaddr: string;
    githoneyaddress: string;
    settingspolicyid: Uint8Array;
    settingstokenname: Uint8Array;
}

export const DEPLOY_SETTINGS_IR = {
    bytecode: "0d0300010f676974686f6e65795f77616c6c65740d010c676974686f6e657961646472050c01000005fc005a620200000000020d010c676974686f6e65796164647205000e020f010d020f676974686f6e65795f77616c6c65740d010c676974686f6e657961646472050c01000005fc005a6202000f010d03091cf8f51d21a8815a7ea5d463d23daf3c0aa11369685dede63fb4a50b3b0f020300030d010f676974686f6e657961646472657373050d0111626f756e74796372656174696f6e666565020d010f626f756e7479726577617264666565020e010f010d030f010c010d011073657474696e6773706f6c6963796964040d011173657474696e6773746f6b656e6e616d6504050200010c010d011073657474696e6773706f6c6963796964040d011173657474696e6773746f6b656e6e616d6504050203000000000000",
    encoding: "hex",
    version: "v1alpha5",
};

export type CreateBountyParams = {
    adminaddr: Uint8Array;
    bountyid: Uint8Array;
    bydeadline: number;
    githoneyaddr: string;
    maintainer: string;
    maintaineraddr: Uint8Array;
    mintingpolicyid: Uint8Array;
    rewards: any[];
    settingsref: string;
}

export const CREATE_BOUNTY_IR = {
    bytecode: "0d03010d010b73657474696e67737265660701106d61696e7461696e65725f696e7075740d010a6d61696e7461696e6572050c01000005fc002d31010000000003091cf8f51d21a8815a7ea5d463d23daf3c0aa11369685dede63fb4a50b3b0f020300060d010961646d696e61646472040d010e6d61696e7461696e6572616464720403010005000d010a6279646561646c696e650206000e010e010c01000005fc809698000f010c010d010f6d696e74696e67706f6c6963796964040d0108626f756e747969640405020f010d010772657761726473090d010c676974686f6e65796164647205000f010d030d010a6d61696e7461696e657205000e020e020f010d02106d61696e7461696e65725f696e7075740d010a6d61696e7461696e6572050c01000005fc002d3101000f010d030c01000005fc809698000105fca89ec5d00d010a6279646561646c696e6502010c010d010f6d696e74696e67706f6c6963796964040d0108626f756e7479696404050203000000000000",
    encoding: "hex",
    version: "v1alpha5",
};

export class Client {
    readonly #client: TRPClient;

    constructor(options: ClientOptions) {
        this.#client = new TRPClient(options);
    }

    async deploySettingsTx(args: DeploySettingsParams): Promise<TxEnvelope> {
        return await this.#client.resolve({
            tir: DEPLOY_SETTINGS_IR,
            args,
        });
    }
    async createBountyTx(args: CreateBountyParams): Promise<TxEnvelope> {
        return await this.#client.resolve({
            tir: CREATE_BOUNTY_IR,
            args,
        });
    }
}

// Create a default client instance
export const protocol = new Client({
    endpoint: DEFAULT_TRP_ENDPOINT,
    headers: DEFAULT_HEADERS,
    envArgs: DEFAULT_ENV_ARGS,
});
