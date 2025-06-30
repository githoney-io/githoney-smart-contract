// This file is auto-generated.

import { Client as TRPClient, type ClientOptions, type TxEnvelope } from 'tx3-sdk/trp';

export const DEFAULT_TRP_ENDPOINT = "http://localhost:3000/trp";

export const DEFAULT_HEADERS = {
};

export const DEFAULT_ENV_ARGS = {
};

export type CreateBountyParams = {
    bountyId: Uint8Array;
    mintingpolicyid: Uint8Array;
}

export const CREATE_BOUNTY_IR = {
    bytecode: "1200000001000001010c010d0f6d696e74696e67706f6c6963796964040d09626f756e74795f69640405020103000000000000",
    encoding: "hex",
    version: "v1alpha5",
};

export class Client {
    readonly #client: TRPClient;

    constructor(options: ClientOptions) {
        this.#client = new TRPClient(options);
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
