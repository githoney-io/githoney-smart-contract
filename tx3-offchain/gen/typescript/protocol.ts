// This file is auto-generated.

import { Client as TRPClient, type ClientOptions, type TxEnvelope } from 'tx3-sdk/trp';

export const DEFAULT_TRP_ENDPOINT = "http://localhost:3000/trp";

export const DEFAULT_HEADERS = {
};

export const DEFAULT_ENV_ARGS = {
};

export type DeployParams = {
    bountycreationfee: number;
    bountyrewardfee: number;
    collateralref: string;
    githoneyaddr: string;
    script: string;
    settingspolicyid: Uint8Array;
    settingstokenname: Uint8Array;
}

export const DEPLOY_IR = {
    bytecode: "0d0300010f676974686f6e65795f77616c6c65740d010c676974686f6e657961646472050c01000005fc005a620200000000020d010c676974686f6e65796164647205000e020f010d020f676974686f6e65795f77616c6c65740d010c676974686f6e657961646472050c01000005fc005a6202000f010d030d0106736372697074050f020300030d010c676974686f6e657961646472050d0111626f756e74796372656174696f6e666565020d010f626f756e7479726577617264666565020e010f010d030f010c010d011073657474696e6773706f6c6963796964040d011173657474696e6773746f6b656e6e616d6504050200010c010d011073657474696e6773706f6c6963796964040d011173657474696e6773746f6b656e6e616d65040502030000000100000d010d636f6c6c61746572616c726566070000",
    encoding: "hex",
    version: "v1alpha5",
};

export class Client {
    readonly #client: TRPClient;

    constructor(options: ClientOptions) {
        this.#client = new TRPClient(options);
    }

    async deployTx(args: DeployParams): Promise<TxEnvelope> {
        return await this.#client.resolve({
            tir: DEPLOY_IR,
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
