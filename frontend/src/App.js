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
  const [campaings, setCampaings] = useState([]);
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
      console.log(
        "provider.wallet.publicKey ",
        provider.wallet.publicKey.toString()
      );
      await program.rpc.create("campaign name 2", "camp description 2", {
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
  const getCampaings = async () => {
    const connetion = new Connection(network, opts.preflightCommitment);
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    Promise.all(
      (await connetion.getProgramAccounts(programID)).map(async (campaign) => ({
        ...(await program.account.campaign.fetch(campaign.pubkey)),
        pubkey: campaign.pubkey,
      }))
    ).then((campaigns) => setCampaings(campaigns));
  };
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet}>Connect to wallet</button>
  );

  const donate = async (campaingPublicKey) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.donate(new BN(0.2 * web3.LAMPORTS_PER_SOL), {
        accounts: {
          campaign: campaingPublicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      });
      console.log("Donated some money to: ", campaingPublicKey.toString());
      getCampaings();
    } catch (err) {
      console.error("doante ERR: ", err);
    }
  };

  const renderCreateCompaign = () => (
    <>
      <button onClick={createCampaign}>Create campaign</button>
      <br />
      <button onClick={getCampaings}>Get campaigns</button>
      <hr />
      {campaings.map((campaing) => (
        <div key={campaing.pubkey.toString()}>
          <p>camp ID: {campaing.pubkey.toString()}</p>
          <p>
            Balance:{" "}
            {(campaing.amountDonated / web3.LAMPORTS_PER_SOL).toString()}
          </p>
          <p>Name: {campaing.name}</p>
          <p>Desc: {campaing.descriptiomn}</p>
          <button onClick={() => donate(campaing.pubkey)}>Donate</button>
        </div>
      ))}
    </>
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
