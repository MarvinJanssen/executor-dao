
import { types, Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assert, assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { ExecutorDaoClient, ExecutorDaoErrCode } from "./src/executor-dao-client.ts";
import { EDP000BootstrapClient, EDP000BootstrapErrCode } from "./src/edp000-bootstrap-client.ts";
import { EDE000GovernanceTokenClient, EDE000GovernanceTokenErrCode } from "./src/ede000-governance-token-client.ts";
import { EDE001ProposalVotingClient, EDE001ProposalVotingErrCode } from "./src/ede001-proposal-voting-client.ts";
import { EDE002ProposalSubmissionClient, EDE002ProposalSubmissionErrCode } from "./src/ede002-proposal-submission-client.ts";
import { EDE003EmergencyProposalsClient, EDE003EmergencyProposalsErrCode } from "./src/ede003-emergency-proposals-client.ts";
import { EDE004EmergencyExecuteClient, EDE004EmergencyExecuteErrCode } from "./src/ede004-emergency-execute-client.ts";
import { Utils } from "./src/utils.ts";

const utils = new Utils();

const getDurations = (blockHeight: number, submissionClient: EDE002ProposalSubmissionClient): any => {
  const duration1 = submissionClient.getParameter('proposal-duration').result.split('ok u')[1]
  const proposalDuration = Number(duration1.split(')')[0])
  const proposalStartDelay = 144
  const startHeight = blockHeight + proposalStartDelay - 1
  const endHeight = startHeight + proposalDuration
  const emergencyProposalDuration = 144
  const emergencyStartHeight = blockHeight + emergencyProposalDuration - 1
  const emergencyEndHeight = blockHeight + emergencyProposalDuration - 1

  return {
    startHeight,
    endHeight,
    proposalDuration,
    proposalStartDelay,
    emergencyProposalDuration,
    emergencyEndHeight,
    emergencyStartHeight,
  }
}
    
  const assertProposal = (
    concluded: boolean, passed: boolean, votesAgainst: number, votesFor: number, startBlockHeight: number, endBlockHeight: number, proposer: string, 
    proposal: string, ede001ProposalVotingClient: EDE001ProposalVotingClient): any => {
    const proposalData = ede001ProposalVotingClient.getProposalData(proposal).result.expectSome().expectTuple()
    assertEquals(proposalData, 
    {
      'concluded': types.bool(concluded),
      'passed': types.bool(passed),
      'votes-against': types.uint(votesAgainst),
      'votes-for':  types.uint(votesFor),
      'start-block-height': types.uint(startBlockHeight),
      'end-block-height': types.uint(endBlockHeight),
      proposer: proposer
    });
  }
    
  Clarinet.test({
    name: "Ensure the governance token can't be reset without permission",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const { 
        deployer, 
        exeDaoClient,
        contractEDP000, 
        contractEDE000, 
        ede001ProposalVotingClient,
        
      } = utils.setup(chain, accounts)
      
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
        ede001ProposalVotingClient.setGovernanceToken(contractEDE000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      block.receipts[1].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_unauthorised)
    }
  });
  
  Clarinet.test({
    name: "Ensure voting restrictions pre setting any proposals",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const { 
        deployer, 
        exeDaoClient,
        contractEDP000, 
        contractEDP001, 
        contractEDE000, 
        contractEDE001,
        ede001ProposalVotingClient,
        
      } = utils.setup(chain, accounts)
      
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
  
      block = chain.mineBlock([
        ede001ProposalVotingClient.vote(10, true, contractEDE001, contractEDE001, deployer.address),
      ]);
      assert(!block.receipts[0])
      console.log('Case 1 -> extension contractEDE001 does not implement governance token trait')
  
      block = chain.mineBlock([
        ede001ProposalVotingClient.vote(10, true, contractEDP001, contractEDE000, deployer.address),
      ]);
      block.receipts[0].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_unknown_proposal)
      console.log('Case 2 -> invalid extension / is not set on the dao')
    }
  });
  
  Clarinet.test({
  name: "Ensure balance of edg tokens respected when voting on single (emergency) proposal",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, bobby,
      contractEDP000, 
      contractEDP002,
      contractEDE000,
      ede000GovernanceTokenClient,
      ede003EmergencyProposalsClient,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
      
    } = utils.setup(chain, accounts)
    
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede001ProposalVotingClient.getProposalData(contractEDP002).result.expectNone()
    ede003EmergencyProposalsClient.isEmergencyTeamMember(phil.address).result.expectBool(true)
    block = chain.mineBlock([
      // Propose the emergency kill proposal
      ede003EmergencyProposalsClient.emergencyPropose(contractEDP002, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (block.height - 1), getDurations(block.height, ede002ProposalSubmissionClient).emergencyEndHeight, phil.address, contractEDP002, ede001ProposalVotingClient)

    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(1001, true, contractEDP002, contractEDE000, bobby.address),
      ede001ProposalVotingClient.vote(0, true, contractEDP002, contractEDE000, bobby.address),
      ede001ProposalVotingClient.vote(1000, true, contractEDP002, contractEDE000, bobby.address),
      ede001ProposalVotingClient.vote(1, true, contractEDP002, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ExecutorDaoErrCode.err_insufficient_balance)
    block.receipts[1].result.expectErr().expectUint(ExecutorDaoErrCode.err_insufficient_balance)
    block.receipts[2].result.expectOk().expectBool(true)
    block.receipts[3].result.expectErr().expectUint(ExecutorDaoErrCode.err_insufficient_balance)
  }
});

Clarinet.test({
  name: "Ensure balance of edg tokens respected when voting across multiple (emergency + 003) proposals",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, bobby,
      contractEDP000, 
      contractEDP002,
      contractEDP003,
      contractEDE000,
      ede000GovernanceTokenClient,
      ede003EmergencyProposalsClient,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)
    

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede001ProposalVotingClient.getProposalData(contractEDP002).result.expectNone()
    ede001ProposalVotingClient.getProposalData(contractEDP003).result.expectNone()
    ede003EmergencyProposalsClient.isEmergencyTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede003EmergencyProposalsClient.emergencyPropose(contractEDP002, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (block.height - 1), getDurations(block.height, ede002ProposalSubmissionClient).emergencyEndHeight, phil.address, contractEDP002, ede001ProposalVotingClient)
    const startHeight = getDurations(block.height, ede002ProposalSubmissionClient).startHeight
    block = chain.mineBlock([
      ede002ProposalSubmissionClient.propose(contractEDP003, startHeight, contractEDE000, phil.address),
      ede002ProposalSubmissionClient.propose(contractEDP003, startHeight + 1, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE002ProposalSubmissionErrCode.err_proposal_minimum_start_delay)
    block.receipts[1].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (startHeight + 1), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP003, ede001ProposalVotingClient)
    
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP002, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    chain.mineEmptyBlock(250);
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(500)
    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP003, contractEDE000, bobby.address),
      ede001ProposalVotingClient.vote(1, true, contractEDP003, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectErr().expectUint(1)
    ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(1000)
  }
});

Clarinet.test({
  name: "Ensure votes before start height or after end height are rejected.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, bobby,
      contractEDP000, 
      contractEDP003,
      contractEDE000,
      ede000GovernanceTokenClient,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    const startHeight = getDurations(block.height, ede002ProposalSubmissionClient).startHeight + 1
    block = chain.mineBlock([
      ede002ProposalSubmissionClient.propose(contractEDP003, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP003, ede001ProposalVotingClient)
    
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP003, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_proposal_inactive)
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)

    const endHeight = getDurations(block.height, ede002ProposalSubmissionClient).endHeight
    chain.mineEmptyBlock(endHeight);
    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP003, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_proposal_inactive)
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
  }
});

Clarinet.test({
  name: "Ensure voting balance reflects two voters voting in opposition.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby,
      contractEDP000, 
      contractEDP003,
      contractEDE000,
      ede000GovernanceTokenClient,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    const startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP003, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP003, ede001ProposalVotingClient)

    chain.mineEmptyBlock(startHeight);

    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP003, contractEDE000, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, false, contractEDP003, contractEDE000, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(500)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetLocked(daisy.address).result.expectOk().expectUint(500)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP003, daisy.address, contractEDE000).result.expectUint(500)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP003, bobby.address, contractEDE000).result.expectUint(500)
    assertProposal(false, false, 500, 500, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP003, ede001ProposalVotingClient)

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(100, false, contractEDP003, contractEDE000, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(100, false, contractEDP003, contractEDE000, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(600)
    ede000GovernanceTokenClient.edgGetLocked(daisy.address).result.expectOk().expectUint(600)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP003, daisy.address, contractEDE000).result.expectUint(600)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP003, bobby.address, contractEDE000).result.expectUint(600)
    assertProposal(false, false, 700, 500, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP003, ede001ProposalVotingClient)
  }
});

Clarinet.test({
  name: "Ensure voting balance reflects three voters voting on two proposals.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby,
      contractEDP000, 
      contractEDP001,
      contractEDP003,
      contractEDE000,
      ede000GovernanceTokenClient,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    const startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP001, startHeight, contractEDE000, phil.address),
      ede002ProposalSubmissionClient.propose(contractEDP003, startHeight, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, bobby.address, contractEDP003, ede001ProposalVotingClient)

    chain.mineEmptyBlock(startHeight);

    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(100, true, contractEDP001, contractEDE000, bobby.address),
      ede001ProposalVotingClient.vote(100, false, contractEDP003, contractEDE000, bobby.address),
      ede001ProposalVotingClient.vote(100, true, contractEDP001, contractEDE000, daisy.address),
      ede001ProposalVotingClient.vote(100, false, contractEDP003, contractEDE000, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectOk().expectBool(true)
    block.receipts[3].result.expectOk().expectBool(true)
    ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(200)
    ede000GovernanceTokenClient.edgGetLocked(daisy.address).result.expectOk().expectUint(200)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP001, daisy.address, contractEDE000).result.expectUint(100)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP001, bobby.address, contractEDE000).result.expectUint(100)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP003, daisy.address, contractEDE000).result.expectUint(100)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP003, bobby.address, contractEDE000).result.expectUint(100)
    assertProposal(false, false, 0, 200, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
    assertProposal(false, false, 200, 0, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, bobby.address, contractEDP003, ede001ProposalVotingClient)

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, false, contractEDP001, contractEDE000, phil.address),
      ede001ProposalVotingClient.vote(500, false, contractEDP003, contractEDE000, phil.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    ede000GovernanceTokenClient.edgGetLocked(phil.address).result.expectOk().expectUint(1000)
    assertProposal(false, false, 500, 200, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
    assertProposal(false, false, 700, 0, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, bobby.address, contractEDP003, ede001ProposalVotingClient)
  }
});

Clarinet.test({
  name: "Ensure cannot conclude before end height is reached or after conclusion.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, ward,
      contractEDP000, 
      contractEDP001,
      contractEDE000,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    const startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP001, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)

    // NB ward is not in the bootstrap contract so this also shows anyone can call conclude
    assertProposal(false, false, 0, 0, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
    block = chain.mineBlock([
      ede001ProposalVotingClient.conclude(contractEDP001, ward.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_end_block_height_not_reached)
    assertProposal(false, false, 0, 0, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)

    chain.mineEmptyBlock(1585);
    block = chain.mineBlock([
      ede001ProposalVotingClient.conclude(contractEDP001, ward.address),
      ede001ProposalVotingClient.conclude(contractEDP001, ward.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(false)
    block.receipts[1].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_proposal_already_concluded)
    assertProposal(true, false, 0, 0, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
  }
});

Clarinet.test({
  name: "Ensure proposal a passes and proposal b fails to pass.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby, ward,
      contractEDP000, 
      contractEDP001,
      contractEDP003,
      contractEDE000,
      ede000GovernanceTokenClient,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    const startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP001, startHeight, contractEDE000, phil.address),
      ede002ProposalSubmissionClient.propose(contractEDP003, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)

    chain.mineEmptyBlock(startHeight);

    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance(daisy.address).result.expectOk().expectUint(1000)
    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(101, true, contractEDP001, contractEDE000, bobby.address),
      ede001ProposalVotingClient.vote(100, false, contractEDP001, contractEDE000, daisy.address),
      ede001ProposalVotingClient.vote(100, true, contractEDP003, contractEDE000, bobby.address),
      ede001ProposalVotingClient.vote(101, false, contractEDP003, contractEDE000, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectOk().expectBool(true)
    block.receipts[3].result.expectOk().expectBool(true)
    

    chain.mineEmptyBlock(1585);
    block = chain.mineBlock([
      ede001ProposalVotingClient.conclude(contractEDP001, ward.address),
      ede001ProposalVotingClient.conclude(contractEDP003, daisy.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(false)

    assertProposal(true, true, 100, 101, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
    assertProposal(true, false, 101, 100, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP003, ede001ProposalVotingClient)
  }
});

Clarinet.test({
  name: "Ensure proposal fails if vote for and against are equal.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby, ward,
      contractEDP000, 
      contractEDP001,
      contractEDE000,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    const startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP001, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)

    chain.mineEmptyBlock(startHeight);

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP001, contractEDE000, bobby.address),
      ede001ProposalVotingClient.vote(500, false, contractEDP001, contractEDE000, daisy.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    
    chain.mineEmptyBlock(1585);

    block = chain.mineBlock([
      ede001ProposalVotingClient.conclude(contractEDP001, ward.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(false)

    assertProposal(true, false, 500, 500, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
  }
});

Clarinet.test({
  name: "Ensure same proposal cannot be executed twice.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, bobby, ward,
      contractEDP000, 
      contractEDP001,
      contractEDE000,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    const startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP001, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)

    chain.mineEmptyBlock(startHeight);

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP001, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    
    chain.mineEmptyBlock(1585);
    block = chain.mineBlock([
      ede001ProposalVotingClient.conclude(contractEDP001, ward.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block = chain.mineBlock([
      ede002ProposalSubmissionClient.propose(contractEDP001, 1880, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_proposal_already_executed)

    assertProposal(true, true, 0, 500, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
  }
});

Clarinet.test({
  name: "Ensure same proposal cannot be proposed twice.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, bobby,
      contractEDP000, 
      contractEDP001,
      contractEDE000,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    const startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP001, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)

    chain.mineEmptyBlock(startHeight);

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP001, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    
    block = chain.mineBlock([
      ede002ProposalSubmissionClient.propose(contractEDP001, 295, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_proposal_already_exists)
  }
});

Clarinet.test({
  name: "Ensure user can reclaim their votes only after conclusion.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, bobby, ward,
      contractEDP000, 
      contractEDP001,
      contractEDE000,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    const startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP001, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)

    chain.mineEmptyBlock(startHeight);

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP001, contractEDE000, bobby.address),
      ede001ProposalVotingClient.reclaimVotes(contractEDP001, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_proposal_not_concluded)
    

    chain.mineEmptyBlock(1585);
    block = chain.mineBlock([
      ede001ProposalVotingClient.conclude(contractEDP001, ward.address),
      ede001ProposalVotingClient.reclaimVotes(contractEDP001, contractEDE000, bobby.address),
      ede001ProposalVotingClient.reclaimVotes(contractEDP001, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_no_votes_to_return)

    assertProposal(true, true, 0, 500, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
  }
});

Clarinet.test({
  name: "Ensure user can reclaim their votes after conclusion and vote for another proposal in same transaction.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, bobby, ward,
      contractEDP000, 
      contractEDP001,
      contractEDP002,
      contractEDE000,
      ede000GovernanceTokenClient,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient
    } = utils.setup(chain, accounts)

    let startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP001, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)

    chain.mineEmptyBlock(startHeight);

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(1000, true, contractEDP001, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    
    chain.mineEmptyBlock(1585);
    startHeight = getDurations(block.height + 1585, ede002ProposalSubmissionClient).startHeight + 10
    block = chain.mineBlock([
      ede001ProposalVotingClient.conclude(contractEDP001, ward.address),
      ede002ProposalSubmissionClient.propose(contractEDP002, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)

    chain.mineEmptyBlock(152);
    assertProposal(true, true, 0, 1000, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
    assertProposal(false, false, 0, 0, 1886, 3326, phil.address, contractEDP002, ede001ProposalVotingClient)
    block = chain.mineBlock([
      ede001ProposalVotingClient.reclaimAndVote(200, true, contractEDP002, contractEDP001, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    assertProposal(true, true, 0, 1000, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
    assertProposal(false, false, 0, 200, 1886, 3326, phil.address, contractEDP002, ede001ProposalVotingClient)

    ede000GovernanceTokenClient.edgGetBalance(bobby.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetLocked(bobby.address).result.expectOk().expectUint(200)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP001, bobby.address, contractEDE000).result.expectUint(0)
    ede001ProposalVotingClient.getCurrentTotalVotes(contractEDP002, bobby.address, contractEDE000).result.expectUint(200)
    assertProposal(true, true, 0, 1000, (getDurations(2, ede002ProposalSubmissionClient).startHeight), getDurations(2, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP001, ede001ProposalVotingClient)
    assertProposal(false, false, 0, 200, 1886, 3326, phil.address, contractEDP002, ede001ProposalVotingClient)
  }
});

Clarinet.test({
  name: "Ensure a proposal can be voted in to e.g. change the governance token used by the dao and to change dao configuration settings in general.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, bobby, ward,
      contractEDP000, 
      contractEDP005,
      contractEDE000,
      ede001ProposalVotingClient,
      ede002ProposalSubmissionClient,
      ede003EmergencyProposalsClient,
      ede004EmergencyExecuteClient
    } = utils.setup(chain, accounts)

    const startHeight = getDurations(0, ede002ProposalSubmissionClient).startHeight + 2
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
      ede002ProposalSubmissionClient.propose(contractEDP005, startHeight, contractEDE000, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    assertProposal(false, false, 0, 0, (getDurations(block.height, ede002ProposalSubmissionClient).startHeight), getDurations(block.height, ede002ProposalSubmissionClient).endHeight, phil.address, contractEDP005, ede001ProposalVotingClient)

    chain.mineEmptyBlock(startHeight);

    block = chain.mineBlock([
      ede001ProposalVotingClient.vote(500, true, contractEDP005, contractEDE000, bobby.address),
      ede001ProposalVotingClient.reclaimVotes(contractEDP005, contractEDE000, bobby.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectErr().expectUint(EDE001ProposalVotingErrCode.err_proposal_not_concluded)
    
    chain.mineEmptyBlock(1585);

    ede003EmergencyProposalsClient.isEmergencyTeamMember('ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC').result.expectBool(false)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)

    block = chain.mineBlock([
      ede001ProposalVotingClient.conclude(contractEDP005, ward.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    assert(ede001ProposalVotingClient.getGovernanceToken().result === 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ede000-governance-token-v2')
    assert(ede002ProposalSubmissionClient.getGovernanceToken().result === 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ede000-governance-token-v2')
    ede003EmergencyProposalsClient.isEmergencyTeamMember('ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC').result.expectBool(true)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(2)
    ede002ProposalSubmissionClient.getParameter("minimum-proposal-start-delay").result.expectOk().expectUint(288)
  }
});
