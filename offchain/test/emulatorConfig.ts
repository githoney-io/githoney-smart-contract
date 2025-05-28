import {
  Assets,
  Crypto,
  Emulator,
  fromText,
  Lucid,
  toUnit
} from "@spacebudz/lucid";

const tokenA = {
  policy_id: "bab31a281f888aa25f6fd7b0754be83729069d66ad76c98be4a06deb",
  asset_name: "tokenA"
};
export const tokens: { policy_id: string; asset_name: string }[] = [];
for (let index = 0; index < 13; index++) {
  tokens.push({
    policy_id: "bab31a281f888aa25f6fd7b0754be83729069d66ad76c98be4a06deb",
    asset_name: `token${index}`
  });
}

const bounty_id = "Bounty Name Test";

const tokenAUnit = toUnit(tokenA.policy_id, fromText(tokenA.asset_name));

const generateAccount = async (assets: Assets, seed?: string) => {
  const seedPhrase = seed ?? Crypto.generateSeed();
  return {
    seedPhrase,
    address: await new Lucid({
      wallet: { Seed: { seed: seedPhrase } }
    }).wallet.address(),
    assets
  };
};

const ACCOUNT_ADMIN = await generateAccount({
  lovelace: 10_000_000_000n,
  [tokenAUnit]: 10_000_000_000n
});

const maintainerAssets = {
  lovelace: 10_000_000_000n,
  [tokenAUnit]: 10_000_000_000n
};

tokens.forEach((token) => {
  maintainerAssets[toUnit(token.policy_id, fromText(token.asset_name))] = 1000n;
});

const ACCOUNT_MANTAINER = await generateAccount(maintainerAssets);

const ACCOUNT_GITHONEY = await generateAccount({
  lovelace: 10_000_000_000n,
  [tokenAUnit]: 10_000_000_000n
});

const ACCOUNT_0 = await generateAccount({
  lovelace: 10_000_000_000n,
  [tokenAUnit]: 10_000_000_000n
});

const ACCOUNT_CONTRIBUTOR = await generateAccount({
  lovelace: 500_000_000n
});

const emulator = new Emulator([
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_GITHONEY,
  ACCOUNT_0
]);

const lucid = new Lucid({ provider: emulator });

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
