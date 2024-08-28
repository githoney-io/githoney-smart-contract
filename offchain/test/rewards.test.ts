import { describe, it } from "mocha";
import { expect } from "chai";
import { ACCOUNT_GITHONEY, emulator, lucid } from "./emulatorConfig";
import {
  deployUtxo,
  newAssign,
  newBounty,
  newClaim,
  newMerge,
  signAndSubmit
} from "./utils";
import logger from "../src/logger";
import { OutRef } from "lucid-txpipe";
import { addrToWallet } from "../src/utils";
import { updateSettings } from "../src";

describe("Reward bounds", async () => {
  it("0 reward fee", async () => {
    const { settingsUtxo } = await deployUtxo(lucid);

    const settings = {
      githoneyWallet: addrToWallet(ACCOUNT_GITHONEY.address, lucid),
      creationFee: 2000000n,
      rewardFee: 0n
    };

    const updateTx = await updateSettings(settingsUtxo, lucid, settings);
    emulator.awaitBlock(3);
    lucid.selectWalletFromSeed(ACCOUNT_GITHONEY.seedPhrase);
    const updateTxId = await signAndSubmit(lucid, updateTx);
    const [newSettingsUtxo] = await lucid.utxosByOutRef([
      { txHash: updateTxId, outputIndex: 0 }
    ]);

    const createTxId = await newBounty(lucid, newSettingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, newSettingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucid, assignOutRef, newSettingsUtxo);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    const claimTx = await newClaim(lucid, mergeOutRef, newSettingsUtxo);
  });
  it("10000 reward fee", async () => {
    const { settingsUtxo } = await deployUtxo(lucid);

    const settings = {
      githoneyWallet: addrToWallet(ACCOUNT_GITHONEY.address, lucid),
      creationFee: 2000000n,
      rewardFee: 10000n
    };

    const updateTx = await updateSettings(settingsUtxo, lucid, settings);
    emulator.awaitBlock(3);
    lucid.selectWalletFromSeed(ACCOUNT_GITHONEY.seedPhrase);
    const updateTxId = await signAndSubmit(lucid, updateTx);
    const [newSettingsUtxo] = await lucid.utxosByOutRef([
      { txHash: updateTxId, outputIndex: 0 }
    ]);

    const createTxId = await newBounty(lucid, newSettingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, newSettingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucid, assignOutRef, newSettingsUtxo);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    const claimTx = await newClaim(lucid, mergeOutRef, newSettingsUtxo);
  });
});
