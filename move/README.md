### To compile the contract
```
aptos move compile
``` 

This will produce a `build` dir and that will have the required `bytecodes` and `sources` of the files and its corresponding dependencies

> We get a `build/Examples/bytecode_modules/message.mv` for the `hello_blockchain::message` example in `sources/hello_blockchain.move`

```ts
// hello_blockchain.ts
// This `modulePath` here is the above `.mv` file 
const moduleHex = fs.readFileSync(modulePath).toString("hex");
let txHash = await publishModule(alice, moduleHex);
```

---
### To run the example

```
npm run hello_blockchain ./build/Examples/bytecode_modules/message.mv 
```

1. This will just publish and run the demo given in `hello_blockchain.ts`
2. This will pause and ask you to copy paste Alice's address into `Move.toml` in `hello_blockchain`

3. `localhost:8080` can be used to track REST API calls. [This](https://fullnode.devnet.aptoslabs.com/v1/spec#/) can be used to see the spec


> Keeps failing, IDK for what. Not able to read back the set message. The transaction to set the message fails maybe. 
> `"vm_status": "Transaction Executed and Committed with Error LINKER_ERROR",` Something.