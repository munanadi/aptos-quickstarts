### Aptos Quickstart guides

> Run all things in a local testnet only. `aptos node --run-local-testnet --with-facuet` to start the node.

#### 1. Basic Transaction using TS SDK.
  - `src/basicTxn.ts` shows how to create two accounts and trasnfer funds between them.

  > NOTE: The API used in this example is outdated. No `EntryPayload` thing exists in the latest package. Neeed to revist this.


#### 2. Create NFT using SDK
  - `src/firstNFT.ts` create a collections and mints one token from that.

  This seems to fail maybe because of the improper SDK support currently. Need to revisit