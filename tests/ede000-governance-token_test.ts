
import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { ExecutorDaoClient } from "./src/executor-dao-client.ts";
import { EDE000GovernanceTokenClient, EDE000GovernanceTokenErrCode } from "./src/ede000-governance-token-client.ts";
import { EDE001ProposalVotingClient } from "./src/ede001-proposal-voting-client.ts";
import { EDE002ProposalSubmissionClient } from "./src/ede002-proposal-submission-client.ts";
import { Utils } from "./src/utils.ts";

const utils = new Utils();

const assertProposal = (
  chain: Chain,
  exeDaoClient: ExecutorDaoClient, 
  contractEDP000: string, 
  deployer: Account, 
  phil: Account, 
  bobby: Account, 
  ward: Account, 
  daisy: Account, 
  contractEDE000: string, 
  proposal: string, 
  ede002ProposalSubmissionClient: EDE002ProposalSubmissionClient,
  ede000GovernanceTokenClient: EDE000GovernanceTokenClient,
  ede001ProposalVotingClient: EDE001ProposalVotingClient): any => {
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    const propStartDelay = 144
    const startHeight = block.height + propStartDelay
    block = chain.mineBlock([
      ede002ProposalSubmissionClient.propose(proposal, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    chain.mineEmptyBlock(startHeight + 1);

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, proposal, contractEDE000, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    
    chain.mineEmptyBlock(1585);
  
    ede000GovernanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(phil.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(ward.address).result.expectOk().expectUint(0)

    ede000GovernanceTokenClient.getTotalSupply().result.expectOk().expectUint(9000)

    block = chain.mineBlock([
      ede001ProposalVotingClient.conclude(proposal, ward.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(3000)
    ede000GovernanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(phil.address).result.expectOk().expectUint(1900)
    ede000GovernanceTokenClient.edgGetLocked(phil.address).result.expectOk().expectUint(1485)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1010)
    ede000GovernanceTokenClient.edgGetBalance(ward.address).result.expectOk().expectUint(490)
    ede000GovernanceTokenClient.edgGetLocked(ward.address).result.expectOk().expectUint(490)

    ede000GovernanceTokenClient.getTotalSupply().result.expectOk().expectUint(12400)
}

Clarinet.test({
    name: "Ensure edg cant be transferred if tx sender is not the owner or the dao.",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        daisy,
        bobby,
        contractEDP000, 
        ede000GovernanceTokenClient
      } = utils.setup(chain, accounts)
  
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
    fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        daisy,
        bobby,
        contractEDP000, 
        ede000GovernanceTokenClient
      } = utils.setup(chain, accounts)
  
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
    name: "Ensure owner cant directly transfer edg tokens.",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        daisy,
        bobby,
        contractEDP000, 
        ede000GovernanceTokenClient
      } = utils.setup(chain, accounts)
  
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
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(0)
      ede000GovernanceTokenClient.edgGetLocked(daisy.address).result.expectOk().expectUint(0)
    }
});
  
Clarinet.test({
  name: "Ensure dao contract deployer cant directly mint edg tokens.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      daisy,
      bobby,
      contractEDP000, 
      ede000GovernanceTokenClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)

    block = chain.mineBlock([
      ede000GovernanceTokenClient.edgMint(100, bobby.address, deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(0)
    ede000GovernanceTokenClient.edgGetLocked(daisy.address).result.expectOk().expectUint(0)
  }
});

Clarinet.test({
  name: "Ensure dao contract deployer cant directly burn edg tokens.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      daisy,
      bobby,
      contractEDP000, 
      ede000GovernanceTokenClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)

    block = chain.mineBlock([
      ede000GovernanceTokenClient.edgBurn(100, bobby.address, deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(0)
    ede000GovernanceTokenClient.edgGetLocked(daisy.address).result.expectOk().expectUint(0)
  }
});

Clarinet.test({
  name: "Ensure dao contract deployer cant directly lock/unlock edg tokens.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      daisy,
      bobby,
      contractEDP000, 
      ede000GovernanceTokenClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)

    block = chain.mineBlock([
      ede000GovernanceTokenClient.edgLock(100, bobby.address, deployer.address),
      ede000GovernanceTokenClient.edgUnlock(100, bobby.address, deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
    block.receipts[1].result.expectErr().expectUint(EDE000GovernanceTokenErrCode.err_unauthorised)
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(0)
    ede000GovernanceTokenClient.edgGetLocked(daisy.address).result.expectOk().expectUint(0)
  }
});

Clarinet.test({
    name: "Ensure dao contract deployer cant directly change the sip 010 settings on the governance contract.",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        contractEDP000, 
        ede000GovernanceTokenClient
      } = utils.setup(chain, accounts)
  
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
    fn(chain: Chain, accounts: Map<string, Account>) {
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
      } = utils.setup(chain, accounts)
  
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
    name: "Ensure edg tokens can be minted via a proposal.",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const { contractEDP006, bobby, deployer, phil, daisy, ward, ede000GovernanceTokenClient } = utils.setup(chain, accounts)
      utils.passProposal(0, chain, accounts, contractEDP006)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(3000)
      ede000GovernanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(phil.address).result.expectOk().expectUint(1900)
      ede000GovernanceTokenClient.edgGetLocked(phil.address).result.expectOk().expectUint(1485)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1010)
      ede000GovernanceTokenClient.edgGetBalance(ward.address).result.expectOk().expectUint(490)
      ede000GovernanceTokenClient.edgGetLocked(ward.address).result.expectOk().expectUint(490)
      ede000GovernanceTokenClient.getTotalSupply().result.expectOk().expectUint(12400)
    }
  });

  Clarinet.test({
    name: "Ensure edg tokens can be burned via a proposal.",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const { contractEDP006, bobby, deployer, phil, daisy, ward, ede000GovernanceTokenClient } = utils.setup(chain, accounts)
      utils.passProposal(0, chain, accounts, contractEDP006)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(3000)
      ede000GovernanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(phil.address).result.expectOk().expectUint(1900)
      ede000GovernanceTokenClient.edgGetLocked(phil.address).result.expectOk().expectUint(1485)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1010)
      ede000GovernanceTokenClient.edgGetBalance(ward.address).result.expectOk().expectUint(490)
      ede000GovernanceTokenClient.edgGetLocked(ward.address).result.expectOk().expectUint(490)
      ede000GovernanceTokenClient.getTotalSupply().result.expectOk().expectUint(12400)
    }
  });

  Clarinet.test({
    name: "Ensure edg tokens can be transferred via a proposal.",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const { contractEDP006, bobby, deployer, phil, daisy, ward, ede000GovernanceTokenClient } = utils.setup(chain, accounts)
      utils.passProposal(0, chain, accounts, contractEDP006)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(3000)
      ede000GovernanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(phil.address).result.expectOk().expectUint(1900)
      ede000GovernanceTokenClient.edgGetLocked(phil.address).result.expectOk().expectUint(1485)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1010)
      ede000GovernanceTokenClient.edgGetBalance(ward.address).result.expectOk().expectUint(490)
      ede000GovernanceTokenClient.edgGetLocked(ward.address).result.expectOk().expectUint(490)
      ede000GovernanceTokenClient.getTotalSupply().result.expectOk().expectUint(12400)
    }
  });

  Clarinet.test({
    name: "Ensure edg tokens can be locked via a proposal.",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const { contractEDP006, bobby, deployer, phil, daisy, ward, ede000GovernanceTokenClient } = utils.setup(chain, accounts)
      utils.passProposal(0, chain, accounts, contractEDP006)
      ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(3000)
      ede000GovernanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
      ede000GovernanceTokenClient.edgGetBalance(phil.address).result.expectOk().expectUint(1900)
      ede000GovernanceTokenClient.edgGetLocked(phil.address).result.expectOk().expectUint(1485)
      ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1010)
      ede000GovernanceTokenClient.edgGetBalance(ward.address).result.expectOk().expectUint(490)
      ede000GovernanceTokenClient.edgGetLocked(ward.address).result.expectOk().expectUint(490)
      ede000GovernanceTokenClient.getTotalSupply().result.expectOk().expectUint(12400)
    }
  });
  