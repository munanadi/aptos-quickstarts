// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// export const NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
export const NODE_URL = 'http://localhost:8080';
// export const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';
export const FAUCET_URL = 'http://localhost:8081';

import { AptosAccount, TxnBuilderTypes, BCS, MaybeHexString } from 'aptos';
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

/**
 * Transfers a given coin amount from a given accountFrom to the recipient's account address.
 * Returns the transaction hash of the transaction used to transfer.
 */
async function transfer(
  accountFrom: AptosAccount,
  recipient: MaybeHexString,
  amount: number
): Promise<string> {
  const token = new TxnBuilderTypes.TypeTagStruct(
    TxnBuilderTypes.StructTag.fromString('0x1::aptos_coin::AptosCoin')
  );

  const scriptFunctionPayload =
    new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        '0x1::coin',
        'transfer',
        [token],
        [
          BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(recipient)),
          BCS.bcsSerializeUint64(amount),
        ]
      )
    );

  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(accountFrom.address()),
    client.getChainId(),
  ]);

  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(accountFrom.address()),
    BigInt(sequenceNumber),
    scriptFunctionPayload,
    1000n,
    1n,
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId)
  );

  const bcsTxn = AptosClient.generateBCSTransaction(accountFrom, rawTxn);
  const pendingTxn = await client.submitSignedBCSTransaction(bcsTxn);

  return pendingTxn.hash;
}

/** Faucet creates and funds accounts. */
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

/** run our demo! */
async function main() {
  // Create two accounts, Alice and Bob, and fund Alice but not Bob
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

  await faucetClient.fundAccount(alice.address(), 5_000);
  await faucetClient.fundAccount(bob.address(), 0);

  console.log('\n=== Initial Balances ===');
  console.log(`Alice: ${await accountBalance(alice.address())}`);
  console.log(`Bob: ${await accountBalance(bob.address())}`);

  // Have Alice give Bob 1000 coins
  const txHash = await transfer(alice, bob.address(), 1_000);
  await client.waitForTransaction(txHash);

  console.log('\n=== Final Balances ===');
  console.log(`Alice: ${await accountBalance(alice.address())}`);
  console.log(`Bob: ${await accountBalance(bob.address())}`);
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
