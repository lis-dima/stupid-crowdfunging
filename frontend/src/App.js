import "./App.css";
import { useEffect, useState } from "react";
import idl from "./idl.json";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  web3,
  utils,
  BN,
} from "@project-serum/anchor";
import { Buffer } from "buffer";
window.Buffer = Buffer;

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed",
};
const { SystemProgram } = web3;

const App = () => {
  const [wallAddress, setWallAddress] = useState(null);
  const getProvider = () => {
    const connetion = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connetion,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };
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
  const createCampaign = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const [campaign] = await PublicKey.findProgramAddress(
        [
          utils.bytes.utf8.encode("CAMPAGN_DENO"),
          provider.wallet.publicKey.toBuffer(),
        ],
        program.programId
      );
      console.log("---BEFORE--- ");
      console.log("program ", program);
      console.log("campaign ", campaign.toString());
      console.log("provider ", provider);
      await program.rpc.create("campaign name", "camp description", {
        accounts: {
          campaign,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      });
      console.log("created new campaign w/ address ", campaign.toString());
    } catch (err) {
      console.error("err", err);
    }
  };

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet}>Connect to wallet</button>
  );

  const renderCreateCompaign = () => (
    <button onClick={createCampaign}>Create campaign</button>
  );
  useEffect(() => {
    const onLoad = async () => {
      await checkWalletConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <div className="App">
      {!wallAddress && renderNotConnectedContainer()}
      {wallAddress && renderCreateCompaign()}
    </div>
  );
};

export default App;
