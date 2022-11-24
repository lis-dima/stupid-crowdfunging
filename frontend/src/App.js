import "./App.css";
import { useEffect, useState } from "react";

const App = () => {
  const [wallAddress, setWallAddress] = useState(null);
  const checkWalletConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("solana.isPhantom is detected");
          const response = await solana.connect({
            onlyIfTrusted: true,
          });
          console.log("Connected with pubKey: ", response.publicKey.toString());
          setWallAddress(response.publicKey.toString());
        }
      } else {
        alert("solana obj not found!");
      }
    } catch (err) {
      console.error(err);
    }
  };
  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      setWallAddress(response.publicKey.toString());
      console.log("Connected with pubKey: ", response.publicKey.toString());
    }
  };
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet}>Connect to wallet</button>
  );
  useEffect(() => {
    const onLoad = async () => {
      await checkWalletConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <div className="App">{!wallAddress && renderNotConnectedContainer()}</div>
  );
};

export default App;
