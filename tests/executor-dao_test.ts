
import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assert, assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { ExecutorDaoClient, ExecutorDaoErrCode } from "./src/executor-dao-client.ts";
import { GovernanceTokenClient, GovernanceTokenErrCode } from "./src/governance-token-client.ts";
import { ProposalClient, ProposalErrCode } from "./src/proposal-client.ts";

const setup = (chain: Chain, accounts: Map<string, Account>): {
    administrator: Account;
    deployer: Account;
    contractEXD: string;
    contractNE: string;
    contractEDP000: string;
    contractEDE000: string;
    contractEDE001: string;
    contractEDE002: string;
    contractEDE003: string;
    contractEDE004: string;
    contractEDE005: string;
    phil: Account;
    daisy: Account;
    bobby: Account;
    hunter: Account;
    exeDaoClient: ExecutorDaoClient;
    bootstrapClient: ProposalClient;
    governanceTokenClient: GovernanceTokenClient;
  } => {
    const administrator = accounts.get("deployer")!;
    const deployer = accounts.get("deployer")!;
    const contractEXD = accounts.get("deployer")!.address + '.executor-dao';
    const contractNE = accounts.get("deployer")!.address + '.nft-escrow';
    const contractEDP000 = accounts.get("deployer")!.address + '.edp000-bootstrap';
    const contractEDE000 = accounts.get("deployer")!.address + '.ede000-governance-token';
    const contractEDE001 = accounts.get("deployer")!.address + '.ede001-proposal-voting';
    const contractEDE002 = accounts.get("deployer")!.address + '.ede002-proposal-submission';
    const contractEDE003 = accounts.get("deployer")!.address + '.ede003-emergency-proposals';
    const contractEDE004 = accounts.get("deployer")!.address + '.ede004-emergency-execute';
    const contractEDE005 = accounts.get("deployer")!.address + '.ede005-dev-fund';
    const phil = accounts.get("wallet_1")!;
    const daisy = accounts.get("wallet_2")!;
    const bobby = accounts.get("wallet_3")!;
    const hunter = accounts.get("wallet_4")!;
    const exeDaoClient = new ExecutorDaoClient(chain, deployer, 'executor-dao');
    const bootstrapClient = new ProposalClient(chain, deployer, 'edp000-bootstrap');
    const governanceTokenClient = new GovernanceTokenClient(chain, deployer, 'ede000-governance-token');
    return { 
        administrator, deployer, contractEXD, contractNE,
        contractEDP000,
        contractEDE000, contractEDE001, contractEDE002, contractEDE003, contractEDE004, contractEDE005, 
        phil, daisy, bobby, hunter, exeDaoClient, bootstrapClient, governanceTokenClient };
  };
  
Clarinet.test({
  name: "Ensure nothing works prior to construction",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, contractNE, phil, exeDaoClient } = setup(chain, accounts);
    let block = chain.mineBlock([
      exeDaoClient.setExtension(phil.address, false, deployer.address),
      exeDaoClient.setExtension(contractNE, true, deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ExecutorDaoErrCode.err_unauthorised)
    block.receipts[1].result.expectErr().expectUint(ExecutorDaoErrCode.err_unauthorised)
    exeDaoClient.isExtension(contractNE).result.expectBool(false)
  }
});

Clarinet.test({
  name: "Ensure only executive can construct the dao",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, phil, exeDaoClient, governanceTokenClient, contractEDP000 } = setup(chain, accounts)
    try {
      chain.mineBlock([
        exeDaoClient.construct(phil.address, deployer.address)
      ]);
    } catch (e) {
      assert(e !== null)
    }
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address)
    ]);
    console.log(block.receipts[0])
    assertEquals(block.receipts[0].events.filter((o) => o.type === "ft_mint_event").length, 10)
    assert(block.receipts[0].events.filter((o) => o.type === "contract_event").find(((o) => o.contract_event.value === '"ExecutorDAO has risen."')))
    block.receipts[0].result.expectOk().expectBool(true)
    governanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
  }
});
