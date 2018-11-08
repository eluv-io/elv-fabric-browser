// Create initial library + content objects needed to store fabric browser info

const ElvClient = require("elv-client-js/ElvClient-node-min").ElvClient;
const fs = require("fs");
const configuration = JSON.parse(fs.readFileSync("./configuration.json"));

const client = new ElvClient({
  //contentSpaceId: AppConfiguration.fabric.contentSpaceId,
  hostname: configuration.fabric.hostname,
  port: configuration.fabric.port,
  useHTTPS: configuration.fabric.use_https,
  ethHostname: configuration.ethereum.hostname,
  ethPort: configuration.ethereum.port,
  ethUseHTTPS: configuration.ethereum.use_https
});

const GetByName = async (name) => {
  try {
    return await client.GetByName({name});
  } catch(error) {
    if(error.status !== 404) {
      console.error(error);
    }
  }
};

const SeedLibrary = async (fabricBrowserInfo, signer) => {
  // Get/create library
  try {
    if(fabricBrowserInfo) {
      const libraryResponse = await client.ContentLibrary({libraryId: fabricBrowserInfo.libraryId});
      return {
        libraryId: fabricBrowserInfo.libraryId,
        contractAddress: libraryResponse.meta["eluv.contract_address"]
      };
    } else {
      const libraryInfo = await client.CreateContentLibrary({
        libraryName: "Eluvio Content Fabric Browser",
        libraryDescription: "Information used by Eluvio Content Fabric Browser",
        signer
      });

      return {
        libraryId: libraryInfo.libraryId,
        contractAddress: libraryInfo.contractAddress
      };
    }
  } catch(error) {
    console.error(error);
    console.error(error.stack);
  }
};

const SeedContracts = async (fabricBrowserInfo, libraryInfo, signer) => {
  try {
    // Get/create library
    if (fabricBrowserInfo && fabricBrowserInfo.contracts) {
      return fabricBrowserInfo.contracts;
    } else {
      const createResponse = await client.CreateContentObject({
        libraryId: libraryInfo.libraryId,
        libraryContractAddress: libraryInfo.contractAddress,
        options: {
          meta: {
            "eluv.name": "Contracts",
            contracts: {}
          }
        },
        signer
      });

      const finalizeResponse = await client.FinalizeContentObject({
        libraryId: libraryInfo.libraryId,
        writeToken: createResponse.write_token
      });

      return finalizeResponse.id;
    }
  } catch(error) {
    console.error(error);
    console.error(error.stack);
  }
};

const Seed = async (signer) => {
  try {
    // Get / Create seeded info
    let fabricBrowserInfo = await GetByName("elv-fabric-browser");
    if(fabricBrowserInfo) { fabricBrowserInfo = JSON.parse(fabricBrowserInfo.target); }

    const libraryInfo = await SeedLibrary(fabricBrowserInfo, signer);

    console.log(libraryInfo);
    const contractsObjectId = await SeedContracts(fabricBrowserInfo, libraryInfo, signer);

    await client.SetByName({
      name: "elv-fabric-browser",
      target: JSON.stringify({
        libraryId: libraryInfo.libraryId,
        contracts: contractsObjectId
      })
    });
  } catch(e) {
    console.log(e);
    console.error(error.stack);
  }
};


if(process.argv.length !== 3) {
  console.error("Usage: node Seed.js <private-key>");
  process.exit();
}

const wallet = client.GenerateWallet();
const signer = wallet.AddAccount({
  accountName: "seeder",
  privateKey: process.argv[2]
});

Seed(signer).then(async () => {
  console.log(await client.GetByName({name: "elv-fabric-browser"}));
});
