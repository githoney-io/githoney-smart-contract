# githoney

Implementation of GitHoney smart contract. Onchain aiken code and offchain typescript code for tx building and querying

# Installation

First install the dependencies

```sh
npm i
```

and make a local package with

```sh
npm pack
```

which builds the code and produces `txpipe-domain-marketplace-0.0.0.tgz` file.

Finally, in another npm project we can install the library as a local npm package via

```sh
npm i /path/to/txpipe-domain-marketplace-0.0.0.tgz
```
