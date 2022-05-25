import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Utils } from "./src/utils.ts";
import { NftEscrowErrorCode } from "./src/nft-escrow-client.ts";

const utils = new Utils();

Clarinet.test({
  name: "Ensure nft-escrow not a valid extension.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      contractEDP000,
      contractNftEscrow,
      contractNft,
      exeDaoClient,
      nftEscrowClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)
    exeDaoClient.isExtension(contractNftEscrow).result.expectBool(false)
    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(false)
    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(false)
  }
});

Clarinet.test({
  name: "Ensure only contract owner can enable an nft contract.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      phil,
      contractEDP000,
      contractNft,
      exeDaoClient,
      nftEscrowClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)
    const block = chain.mineBlock([
      nftEscrowClient.setWhitelisted(contractNft, true, phil.address),
      nftEscrowClient.setWhitelisted(contractNft, true, deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(NftEscrowErrorCode.err_not_contract_owner)
    block.receipts[1].result.expectOk().expectBool(true)

    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(true)
  }
});

Clarinet.test({
  name: "Ensure contract deployer cannot enable an nft contract after transferring control to the dao.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      contractEXD,
      contractEDP000,
      contractNft,
      exeDaoClient,
      nftEscrowClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)
    const block = chain.mineBlock([
      nftEscrowClient.setContractOwner(contractEXD, deployer.address),
      nftEscrowClient.setWhitelisted(contractNft, true, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectErr().expectUint(NftEscrowErrorCode.err_not_contract_owner)

    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(false)
  }
});

Clarinet.test({
  name: "Ensure dao can enable an nft contract after receiving control.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      contractEXD,
      contractEDP000,
      contractEDP008_1,
      contractNft,
      exeDaoClient,
      nftEscrowClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)

    const block = chain.mineBlock([
      nftEscrowClient.setContractOwner(contractEXD, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    utils.passProposal(block.height, chain, accounts, contractEDP008_1)

    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(true)
  }
});

Clarinet.test({
  name: "Ensure ownership of nfts minted before the dao takes control is't changed.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      daisy,
      bobby,
      contractEXD,
      contractEDP000,
      contractEDP008_1,
      contractNft,
      exeDaoClient,
      nftEscrowClient,
      nftClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)
    let block = chain.mineBlock([
      nftClient.mint(daisy.address, deployer.address),
      nftClient.mint(bobby.address, deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    block.receipts[1].result.expectOk().expectUint(2)
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(daisy.address)
    nftClient.getOwner(2).result.expectOk().expectSome().expectPrincipal(bobby.address)

    block = chain.mineBlock([
      nftEscrowClient.setContractOwner(contractEXD, deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    utils.passProposal(block.height, chain, accounts, contractEDP008_1)

    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(true)
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(daisy.address)
    nftClient.getOwner(2).result.expectOk().expectSome().expectPrincipal(bobby.address)
  }
});

Clarinet.test({
  name: "Ensure daisy can place her nft in escrow to bobby",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      daisy,
      bobby,
      contractEXD,
      contractEDP000,
      contractEDP008_1,
      contractNftEscrow,
      contractNft,
      exeDaoClient,
      nftEscrowClient,
      nftClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)
    let block = chain.mineBlock([
      nftClient.mint(daisy.address, deployer.address),
      nftClient.mint(bobby.address, deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    block.receipts[1].result.expectOk().expectUint(2)
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(daisy.address)
    nftClient.getOwner(2).result.expectOk().expectSome().expectPrincipal(bobby.address)

    block = chain.mineBlock([
      nftEscrowClient.setContractOwner(contractEXD, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    utils.passProposal(block.height, chain, accounts, contractEDP008_1)
    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(true)

    block = chain.mineBlock([
      nftEscrowClient.placeInEscrow(1, bobby.address, 100, contractNft, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    nftEscrowClient.getEscrow(1, daisy.address).result.expectNone()
    nftEscrowClient.getEscrow(1, bobby.address).result.expectSome().expectTuple()

    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(contractNftEscrow)
    nftClient.getOwner(2).result.expectOk().expectSome().expectPrincipal(bobby.address)
  }
});

Clarinet.test({
  name: "Ensure bobby can redeem an nft escrowed to her by daisy",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      daisy,
      bobby,
      contractEXD,
      contractEDP000,
      contractEDP008_1,
      contractNftEscrow,
      contractNft,
      exeDaoClient,
      nftEscrowClient,
      nftClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)
    let block = chain.mineBlock([
      nftClient.mint(daisy.address, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(daisy.address)

    block = chain.mineBlock([
      nftEscrowClient.setContractOwner(contractEXD, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    utils.passProposal(block.height, chain, accounts, contractEDP008_1)
    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(true)

    block = chain.mineBlock([
      nftEscrowClient.placeInEscrow(1, bobby.address, 100, contractNft, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    nftEscrowClient.getEscrow(1, daisy.address).result.expectNone()
    nftEscrowClient.getEscrow(1, bobby.address).result.expectSome().expectTuple()
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(contractNftEscrow)

    block = chain.mineBlock([
      nftEscrowClient.payAndRedeem(1, contractNft, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    nftEscrowClient.getEscrow(1, daisy.address).result.expectNone()
    nftEscrowClient.getEscrow(1, bobby.address).result.expectNone()
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(bobby.address)

  }
});

Clarinet.test({
  name: "Ensure daisy can place her nft in escrow to herself",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      daisy,
      contractEXD,
      contractEDP000,
      contractEDP008_1,
      contractNftEscrow,
      contractNft,
      exeDaoClient,
      nftEscrowClient,
      nftClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)
    let block = chain.mineBlock([
      nftClient.mint(daisy.address, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(daisy.address)

    block = chain.mineBlock([
      nftEscrowClient.setContractOwner(contractEXD, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    utils.passProposal(block.height, chain, accounts, contractEDP008_1)
    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(true)

    block = chain.mineBlock([
      nftEscrowClient.placeInEscrow(1, daisy.address, 100, contractNft, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    nftEscrowClient.getEscrow(1, daisy.address).result.expectSome().expectTuple()
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(contractNftEscrow)
  }
});
Clarinet.test({
  name: "Ensure daisy cant redeem her own escrowed nft",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      daisy,
      contractEXD,
      contractEDP000,
      contractEDP008_1,
      contractNftEscrow,
      contractNft,
      exeDaoClient,
      nftEscrowClient,
      nftClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)
    let block = chain.mineBlock([
      nftClient.mint(daisy.address, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(daisy.address)

    block = chain.mineBlock([
      nftEscrowClient.setContractOwner(contractEXD, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    utils.passProposal(block.height, chain, accounts, contractEDP008_1)
    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(true)

    block = chain.mineBlock([
      nftEscrowClient.placeInEscrow(1, daisy.address, 100, contractNft, daisy.address),
      nftEscrowClient.payAndRedeem(1, contractNft, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectErr().expectUint(NftEscrowErrorCode.err_sender_same_as_recipient)
    nftEscrowClient.getEscrow(1, daisy.address).result.expectSome().expectTuple()
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(contractNftEscrow)
  }
});

Clarinet.test({
  name: "Ensure daisy can cancel her own escrowed nft",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      daisy,
      contractEXD,
      contractEDP000,
      contractEDP008_1,
      contractNft,
      exeDaoClient,
      nftEscrowClient,
      nftClient
    } = utils.setup(chain, accounts);

    utils.constructDao(chain, contractEDP000, deployer, exeDaoClient)
    let block = chain.mineBlock([
      nftClient.mint(daisy.address, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(daisy.address)

    block = chain.mineBlock([
      nftEscrowClient.setContractOwner(contractEXD, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    utils.passProposal(block.height, chain, accounts, contractEDP008_1)
    nftEscrowClient.isWhitelisted(contractNft).result.expectBool(true)

    block = chain.mineBlock([
      nftEscrowClient.placeInEscrow(1, daisy.address, 100, contractNft, daisy.address),
      nftEscrowClient.cancelEscrow(1, daisy.address, contractNft, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    nftEscrowClient.getEscrow(1, daisy.address).result.expectNone()
    nftClient.getOwner(1).result.expectOk().expectSome().expectPrincipal(daisy.address)
  }
});

