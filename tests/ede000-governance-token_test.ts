
import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { ExecutorDaoClient, ExecutorDaoErrCode } from "./src/executor-dao-client.ts";
import { EDP000BootstrapClient, EDP000BootstrapErrCode } from "./src/edp000-bootstrap-client.ts";
import { EDE000GovernanceTokenClient, EDE000GovernanceTokenErrCode } from "./src/ede000-governance-token-client.ts";
import { EDE001ProposalVotingClient, EDE001ProposalVotingErrCode } from "./src/ede001-proposal-voting-client.ts";
import { EDE002ProposalSubmissionClient, EDE002ProposalSubmissionErrCode } from "./src/ede002-proposal-submission-client.ts";

const setup = (chain: Chain, accounts: Map<string, Account>): {
  administrator: Account;
  deployer: Account;
  contractEXD: string;
  contractEDP000: string;
  contractEDP004: string;
  contractEDP006: string;
  contractEDE000: string;
  contractEDE001: string;
  contractEDE002: string;
  phil: Account;
  daisy: Account;
  bobby: Account;
  ward: Account;
  exeDaoClient: ExecutorDaoClient;
  edp000BootstrapClient: EDP000BootstrapClient;
  ede000GovernanceTokenClient: EDE000GovernanceTokenClient;
  ede001ProposalVotingClient: EDE001ProposalVotingClient;
  ede002ProposalSubmissionClient: EDE002ProposalSubmissionClient;
} => {
  const administrator = accounts.get("deployer")!;
  const deployer = accounts.get("deployer")!;
  const contractEXD = accounts.get("deployer")!.address + '.executor-dao';
  const contractEDP000 = accounts.get("deployer")!.address + '.edp000-bootstrap';
  const contractEDP004 = accounts.get("deployer")!.address + '.edp004-dao-change-governance';
  const contractEDP006 = accounts.get("deployer")!.address + '.edp006-dao-mint-burn-edg';
  const contractEDE000 = accounts.get("deployer")!.address + '.ede000-governance-token';
  const contractEDE001 = accounts.get("deployer")!.address + '.ede001-proposal-voting';
  const contractEDE002 = accounts.get("deployer")!.address + '.ede002-proposal-submission';
  const phil = accounts.get("wallet_1")!;
  const daisy = accounts.get("wallet_2")!;
  const bobby = accounts.get("wallet_3")!;
  const ward = accounts.get("wallet_9")!;
  const exeDaoClient = new ExecutorDaoClient(chain, deployer, 'executor-dao');
  const edp000BootstrapClient = new EDP000BootstrapClient(chain, deployer, 'edp000-bootstrap');
  const ede000GovernanceTokenClient = new EDE000GovernanceTokenClient(chain, deployer, 'ede000-governance-token');
  const ede001ProposalVotingClient = new EDE001ProposalVotingClient(chain, deployer, 'ede001-proposal-voting');
  const ede002ProposalSubmissionClient = new EDE002ProposalSubmissionClient(chain, deployer, 'ede002-proposal-submission');
  return {
      administrator, deployer, contractEXD,
      contractEDP000, contractEDP004, contractEDP006,
      contractEDE000, contractEDE001, contractEDE002, 
      phil, daisy, bobby, ward, exeDaoClient, edp000BootstrapClient, 
      ede000GovernanceTokenClient, ede001ProposalVotingClient, ede002ProposalSubmissionClient };
};

Clarinet.test({
    name: "Ensure edg cant be transferred if tx sender is not the owner or the dao.",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        daisy,
        bobby,
        contractEDP000, 
        ede000GovernanceTokenClient
      } = setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
  
      block = chain.mineBlock([
        ede000GovernanceTokenClient.transfer(100, bobby.address, daisy.address, "for new batons", deployer.address),
      ]);
      block.receipts[0].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_not_token_owner)
    }
});
  
Clarinet.test({
    name: "Ensure transferring edg leads to correct balance sheet.",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        daisy,
        bobby,
        contractEDP000, 
        ede000GovernanceTokenClient
      } = setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
  
      block = chain.mineBlock([
        ede000GovernanceTokenClient.transfer(100, bobby.address, daisy.address, "for new batons", bobby.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(900)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1100)
      ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(0)
    }
});
  
Clarinet.test({
    name: "Ensure owner cant directly mint, burn, unlock or lock edg tokens.",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        daisy,
        bobby,
        contractEDP000, 
        ede000GovernanceTokenClient
      } = setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
  
      block = chain.mineBlock([
        ede000GovernanceTokenClient.edgLock(100, bobby.address, bobby.address),
        ede000GovernanceTokenClient.edgUnlock(100, bobby.address, bobby.address),
        ede000GovernanceTokenClient.edgMint(100, bobby.address, bobby.address),
        ede000GovernanceTokenClient.edgBurn(100, bobby.address, bobby.address),
      ]);
      block.receipts[0].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      block.receipts[1].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      block.receipts[2].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      block.receipts[3].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(0)
      ede000GovernanceTokenClient.edgGetLocked(daisy.address).result.expectOk().expectUint(0)
    }
});
  
Clarinet.test({
    name: "Ensure dao contract deployer cant directly mint, burn, unlock or lock edg tokens.",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        daisy,
        bobby,
        contractEDP000, 
        ede000GovernanceTokenClient
      } = setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
  
      block = chain.mineBlock([
        ede000GovernanceTokenClient.edgLock(100, bobby.address, deployer.address),
        ede000GovernanceTokenClient.edgUnlock(100, bobby.address, deployer.address),
        ede000GovernanceTokenClient.edgMint(100, bobby.address, deployer.address),
        ede000GovernanceTokenClient.edgBurn(100, bobby.address, deployer.address),
      ]);
      block.receipts[0].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      block.receipts[1].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      block.receipts[2].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      block.receipts[3].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(0)
      ede000GovernanceTokenClient.edgGetLocked(daisy.address).result.expectOk().expectUint(0)
    }
});
  
Clarinet.test({
    name: "Ensure dao contract deployer cant directly change the sip 010 settings on the governance contract.",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        contractEDP000, 
        ede000GovernanceTokenClient
      } = setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
  
      block = chain.mineBlock([
        ede000GovernanceTokenClient.setSymbol("EDG2", deployer.address),
        ede000GovernanceTokenClient.setName("New Gov Token", deployer.address),
        ede000GovernanceTokenClient.setDecimals(8, deployer.address),
        ede000GovernanceTokenClient.setTokenUri("https://docs.hiro.so/get-started/running-api-node", deployer.address),
      ]);
      block.receipts[0].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      block.receipts[1].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      block.receipts[2].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
      block.receipts[3].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
    }
});
  
Clarinet.test({
    name: "Ensure sip 010 settings on the governance contract can be changed via a proposal.",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        phil, bobby, ward,
        contractEDP000, 
        contractEDP004,
        contractEDE000,
        ede001ProposalVotingClient,
        ede002ProposalSubmissionClient,
        ede000GovernanceTokenClient
      } = setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)

      const propStartDelay = 144
      const startHeight = block.height + propStartDelay
      block = chain.mineBlock([
        ede002ProposalSubmissionClient.propose(contractEDP004, startHeight, contractEDE000, phil.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
  
      chain.mineEmptyBlock(startHeight + 1);
  
      block = chain.mineBlock([
        ede001ProposalVotingClient.vote(500, true, contractEDP004, contractEDE000, bobby.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      
      chain.mineEmptyBlock(1585);
    
      ede000GovernanceTokenClient.getName().result.expectOk().expectAscii("ExecutorDAO Governance Token")
      ede000GovernanceTokenClient.getSymbol().result.expectOk().expectAscii("EDG")
      ede000GovernanceTokenClient.getTokenUri().result.expectOk().expectNone()
      ede000GovernanceTokenClient.getDecimals().result.expectOk().expectUint(6)

      block = chain.mineBlock([
        ede001ProposalVotingClient.conclude(contractEDP004, ward.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
  
      ede000GovernanceTokenClient.getName().result.expectOk().expectAscii("New Governance Token")
      ede000GovernanceTokenClient.getSymbol().result.expectOk().expectAscii("EDG2")
      ede000GovernanceTokenClient.getTokenUri().result.expectOk().expectSome().expectUtf8("https://docs.hiro.so/get-started/running-api-node")
      ede000GovernanceTokenClient.getDecimals().result.expectOk().expectUint(2)
    }
  });
  
  Clarinet.test({
    name: "Ensure edg tokens can be minted, burned, locked, unlocked and transferred via a proposal.",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        phil, daisy, bobby, ward,
        contractEDP000, 
        contractEDP006,
        contractEDE000,
        ede001ProposalVotingClient,
        ede002ProposalSubmissionClient,
        ede000GovernanceTokenClient
      } = setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)

      const propStartDelay = 144
      const startHeight = block.height + propStartDelay
      block = chain.mineBlock([
        ede002ProposalSubmissionClient.propose(contractEDP006, startHeight, contractEDE000, phil.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
  
      chain.mineEmptyBlock(startHeight + 1);
  
      block = chain.mineBlock([
        ede001ProposalVotingClient.vote(500, true, contractEDP006, contractEDE000, bobby.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      
      chain.mineEmptyBlock(1585);
    
      ede000GovernanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(phil.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(ward.address).result.expectOk().expectUint(0)

      ede000GovernanceTokenClient.getTotalSupply().result.expectOk().expectUint(9000)
  
      block = chain.mineBlock([
        ede001ProposalVotingClient.conclude(contractEDP006, ward.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
  
      ede000GovernanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(phil.address).result.expectOk().expectUint(1900)
      ede000GovernanceTokenClient.edgGetLocked(phil.address).result.expectOk().expectUint(1485)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1010)
      ede000GovernanceTokenClient.edgGetBalance(ward.address).result.expectOk().expectUint(490)
      ede000GovernanceTokenClient.edgGetLocked(ward.address).result.expectOk().expectUint(490)

      ede000GovernanceTokenClient.getTotalSupply().result.expectOk().expectUint(10400)
    }
  });
  