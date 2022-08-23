// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// export const NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
export const NODE_URL = 'http://localhost:8080';
// export const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';
export const FAUCET_URL = 'http://localhost:8081';

import {
  AptosAccount,
  TxnBuilderTypes,
  BCS,
  MaybeHexString,
  TokenClient,
} from 'aptos';
import { AptosClient, FaucetClient } from 'aptos';

const client = new AptosClient(NODE_URL);

/** Helper method returns the coin balance associated with the account */
export async function accountBalance(
  accountAddress: MaybeHexString
): Promise<number | null> {
  // Gets all resources for a given account address.
  // const data = await client.getAccountResources(accountAddress);

  const resource = await client.getAccountResource(
    accountAddress,
    '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
  );
  if (resource == null) {
    return null;
  }

  return parseInt((resource.data as any)['coin']['value']);
}

/** Faucet creates and funds accounts. */
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

/** Create a Token client  */
const tokenClient = new TokenClient(client);

/** run our demo! */
async function main() {
  // Create two accounts, Alice and Bob, and fund them
  const alice = new AptosAccount();
  const bob = new AptosAccount();

  console.log('\n=== Addresses ===');
  console.log(
    `Alice: ${alice.address()}. Key Seed: ${Buffer.from(
      alice.signingKey.secretKey
    )
      .toString('hex')
      .slice(0, 64)}`
  );
  console.log(
    `Bob: ${bob.address()}. Key Seed: ${Buffer.from(bob.signingKey.secretKey)
      .toString('hex')
      .slice(0, 64)}`
  );

  await faucetClient.fundAccount(alice.address(), 200_000_000);
  await faucetClient.fundAccount(bob.address(), 200_000_000);

  console.log('\n=== INITIAL BALANCES ===');
  console.log(`Alice: ${await accountBalance(alice.address())}`);
  console.log(`Bob: ${await accountBalance(bob.address())}`);

  // Create Collection for Alice's NFT's
  console.log('\n=== CREATING COLLECTION ===');

  const COLLECTION_NAME = "Alice NFT's";

  const createCollectionHash = await tokenClient.createCollection(
    alice,
    COLLECTION_NAME,
    "Collection of Alice's NFT's",
    'example.com'
  );

  console.log(createCollectionHash, ' is the hash for create collection');

  // Create a token from the above collection
  const tokenHash = await tokenClient.createToken(
    alice,
    COLLECTION_NAME,
    'First Token', // Name
    'Minted this token first', // Description
    1, // Supply
    'https://aptos.dev/img/nyan.jpeg', // URI
    0 // Royalty per million
  );

  console.log(tokenHash, ' hash of the create token txn');

  // // These didn't work. IDK WHY
  // console.log('\n=== READING COLLECTION DATA ===');
  // const collectionData = await tokenClient.getCollectionData(
  //   alice.address(),
  //   COLLECTION_NAME
  // );
  // console.log(collectionData);

  // console.log('\n=== READING TOKEN DATA ===');
  // const tokenData = await tokenClient.getTokenData(
  //   alice.address(),
  //   COLLECTION_NAME,
  //   'First Token'
  // );
  // console.log(tokenData);

  // console.log('\n=== TOKEN BALANCE ===');
  // const tokenBalance = await tokenClient.getTokenBalance(
  //   alice.address(),
  //   COLLECTION_NAME,
  //   'First Token'
  // );
  // console.log(tokenBalance);

  console.log('\n=== Alice Resources ===');
  const aliceResources = await client.getAccountResources(alice.address());
  console.log(aliceResources);

  console.log('\n=== Final Balances ===');
  console.log(`Alice: ${await accountBalance(alice.address())}`);
  console.log(`Bob: ${await accountBalance(bob.address())}`);
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
