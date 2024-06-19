import {
  Assets,
  Emulator,
  fromText,
  generateSeedPhrase,
  Lucid,
  toUnit
} from "lucid-cardano";
import { deployUtxo } from "./utils";

const tokenA = {
  policy_id: "bab31a281f888aa25f6fd7b0754be83729069d66ad76c98be4a06deb",
  asset_name: "tokenA"
};

const bounty_id = "Bounty Name Test";

const tokenAUnit = toUnit(tokenA.policy_id, fromText(tokenA.asset_name));

const generateAccount = async (assets: Assets) => {
  const seedPhrase = generateSeedPhrase();
  return {
    seedPhrase,
    address: await (await Lucid.new(undefined, "Custom"))
      .selectWalletFromSeed(seedPhrase)
      .wallet.address(),
    assets
  };
};

const ACCOUNT_ADMIN = await generateAccount({
  lovelace: 1_000_000_000n,
  [tokenAUnit]: 1_000_000_000n
});

const ACCOUNT_MANTAINER = await generateAccount({
  lovelace: 1_000_000_000n,
  [tokenAUnit]: 1_000_000_000n
});

const ACCOUNT_GITHONEY = {
  seedPhrase: process.env.GITHONEY_SEED!,
  address: await (await Lucid.new(undefined, "Custom"))
    .selectWalletFromSeed(process.env.GITHONEY_SEED!)
    .wallet.address(),
  assets: {
    lovelace: 1_000_000_000n,
    [tokenAUnit]: 1_000_000_000n
  }
};

const ACCOUNT_0 = await generateAccount({
  lovelace: 1_000_000_000n,
  [tokenAUnit]: 1_000_000_000n
});

const ACCOUNT_CONTRIBUTOR = await generateAccount({
  lovelace: 50_000_000n
});

const emulator = new Emulator([
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_GITHONEY,
  ACCOUNT_0
]);

const lucid = await Lucid.new(emulator, "Custom");

export {
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  ACCOUNT_GITHONEY,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_0,
  emulator,
  tokenAUnit,
  bounty_id,
  lucid
};
