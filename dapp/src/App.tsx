import { useState, useEffect } from 'react';
import './App.css';
import { Types, AptosClient } from 'aptos';

// Create an AptosClient to interact with devnet.
// export const NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
export const NODE_URL = 'http://localhost:8080/';
const client = new AptosClient(NODE_URL);

function App() {
  // Retrieve aptos.account on initial render and store it.
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => {
    window.aptos
      .account()
      .then((data: { address: string }) => setAddress(data.address));
  }, []);

  // Read account data
  const [account, setAccount] = useState<Types.AccountData | null>(null);
  useEffect(() => {
    if (!address) return;
    client.getAccount(address).then(setAccount);
  }, [address]);

  const isConnected = window.aptos.isConnected();

  console.log(window.aptos)

  return isConnected ? (
    <button onClick={window.aptos.connect}>Connect</button>
  ) : (
    <div className="App">
      <p>
        <code>{address}</code>
        <p>
          <code>{account?.sequence_number}</code>
        </p>
      </p>
      <button onClick={window.aptos.disconnect}>Disconnect</button>
    </div>
  );
}

export default App;
