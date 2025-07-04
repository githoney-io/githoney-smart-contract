// This file is auto-generated.

import { Client as TRPClient, type ClientOptions, type TxEnvelope } from 'tx3-sdk/trp';

export const DEFAULT_TRP_ENDPOINT = "http://localhost:3000/trp";

export const DEFAULT_HEADERS = {
};

export const DEFAULT_ENV_ARGS = {
};

export type CreateParams = {
    adminaddr: Uint8Array;
    bountycreationfee: number;
    bountyid: Uint8Array;
    bountyrewardfee: number;
    collateralref: string;
    githoneyaddr: string;
    maintainer: string;
    maintainerpaymentcredential: Uint8Array;
    maintainerstakecredential: Uint8Array;
    mintingpolicyid: Uint8Array;
    rewardamount: number;
    rewardassetname: Uint8Array;
    rewardpolicyid: Uint8Array;
    script: string;
    settingsref: string;
    since: number;
    until: number;
}

export const CREATE_IR = {
    bytecode: "0d03010d010b73657474696e67737265660701106d61696e7461696e65725f696e7075740d010a6d61696e7461696e6572050e010c01000005fc002d31010c010d010e726577617264706f6c6963796964040d010f72657761726461737365746e616d65040d010c726577617264616d6f756e740200000000030d0106736372697074050300060d010961646d696e61646472040300020d011b6d61696e7461696e65727061796d656e7463726564656e7469616c040d01196d61696e7461696e65727374616b6563726564656e7469616c040301000d010f626f756e7479726577617264666565020d0105756e74696c0206000e010e010c01000005fc809698000c010d010f6d696e74696e67706f6c6963796964040d0108626f756e747969640405020c010d010e726577617264706f6c6963796964040d010f72657761726461737365746e616d65040d010c726577617264616d6f756e74020d010c676974686f6e65796164647205000c0100000d0111626f756e74796372656174696f6e666565020d010a6d61696e7461696e657205000e020e020e020f010d02106d61696e7461696e65725f696e7075740d010a6d61696e7461696e6572050e010c01000005fc002d31010c010d010e726577617264706f6c6963796964040d010f72657761726461737365746e616d65040d010c726577617264616d6f756e7402000c0100000d0111626f756e74796372656174696f6e666565020d030c010d010e726577617264706f6c6963796964040d010f72657761726461737365746e616d65040d010c726577617264616d6f756e7402010d010573696e6365020d0105756e74696c02010c010d010f6d696e74696e67706f6c6963796964040d0108626f756e74796964040502030000000100000d010d636f6c6c61746572616c726566070000",
    encoding: "hex",
    version: "v1alpha6",
};

export class Client {
    readonly #client: TRPClient;

    constructor(options: ClientOptions) {
        this.#client = new TRPClient(options);
    }

    async createTx(args: CreateParams): Promise<TxEnvelope> {
        return await this.#client.resolve({
            tir: CREATE_IR,
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
