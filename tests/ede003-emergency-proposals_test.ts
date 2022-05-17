
import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { ExecutorDaoClient, ExecutorDaoErrCode } from "./src/executor-dao-client.ts";
import { EDP000BootstrapClient, EDP000BootstrapErrCode } from "./src/edp000-bootstrap-client.ts";
import { EDE003EmergencyProposalsClient, EDE003EmergencyProposalsErrCode } from "./src/ede003-emergency-proposals-client.ts";
import { EDE001ProposalVotingClient, EDE001ProposalVotingErrCode } from "./src/ede001-proposal-voting-client.ts";
import { EDE002ProposalSubmissionClient, EDE002ProposalSubmissionErrCode } from "./src/ede002-proposal-submission-client.ts";

const setup = (chain: Chain, accounts: Map<string, Account>): {
  administrator: Account;
  deployer: Account;
  contractEXD: string;
  contractEDP000: string;
  contractEDP002: string;
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
  ede003EmergencyProposalsClient: EDE003EmergencyProposalsClient;
  ede001ProposalVotingClient: EDE001ProposalVotingClient;
  ede002ProposalSubmissionClient: EDE002ProposalSubmissionClient;
} => {
  const administrator = accounts.get("deployer")!;
  const deployer = accounts.get("deployer")!;
  const contractEXD = accounts.get("deployer")!.address + '.executor-dao';
  const contractEDP000 = accounts.get("deployer")!.address + '.edp000-bootstrap';
  const contractEDP002 = accounts.get("deployer")!.address + '.edp002-kill-emergency-execute';
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
  const ede003EmergencyProposalsClient = new EDE003EmergencyProposalsClient(chain, deployer, 'ede003-emergency-proposals');
  const ede001ProposalVotingClient = new EDE001ProposalVotingClient(chain, deployer, 'ede001-proposal-voting');
  const ede002ProposalSubmissionClient = new EDE002ProposalSubmissionClient(chain, deployer, 'ede002-proposal-submission');
  return {
      administrator, deployer, contractEXD,
      contractEDP000, contractEDP002, contractEDP006,
      contractEDE000, contractEDE001, contractEDE002, 
      phil, daisy, bobby, ward, exeDaoClient, edp000BootstrapClient, 
      ede003EmergencyProposalsClient, ede001ProposalVotingClient, ede002ProposalSubmissionClient };
};

Clarinet.test({
    name: "Ensure emergency proposals parameters cant be changed without an emergancy proposal.",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        bobby,
        contractEDP000,
        ede003EmergencyProposalsClient
      } = setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
        ede003EmergencyProposalsClient.setEmergencyTeaMmember(bobby.address, true, deployer.address),
        ede003EmergencyProposalsClient.setEmergencyTeamSunsetHeight(90, deployer.address),
        ede003EmergencyProposalsClient.setEmergencyProposalDuration(100, deployer.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      block.receipts[1].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_unauthorised)
      block.receipts[2].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_unauthorised)
      block.receipts[3].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_unauthorised)
    }
});

Clarinet.test({
  name: "Ensure emergency proposal can only be proposed by an emergency team member ",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { 
      deployer, 
      exeDaoClient,
      bobby,
      contractEDP000,
      contractEDP002,
      ede003EmergencyProposalsClient,
      ede001ProposalVotingClient,      
    } = setup(chain, accounts)
    
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede001ProposalVotingClient.getProposalData(contractEDP002).result.expectNone()
    ede003EmergencyProposalsClient.isEmergencyTeamMember(bobby.address).result.expectBool(false)
    block = chain.mineBlock([
      ede003EmergencyProposalsClient.emergencyPropose(contractEDP002, bobby.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_not_emergency_team_member)

  }
});

Clarinet.test({
  name: "Ensure emergency proposal can only be proposed before sunset",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { 
      deployer,
      exeDaoClient,
      phil,
      contractEDP000,
      contractEDP002,
      ede003EmergencyProposalsClient,
      ede001ProposalVotingClient,      
    } = setup(chain, accounts)
    
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    
    chain.mineEmptyBlock(13140);

    ede001ProposalVotingClient.getProposalData(contractEDP002).result.expectNone()
    ede003EmergencyProposalsClient.isEmergencyTeamMember(phil.address).result.expectBool(true)
    block = chain.mineBlock([
      ede003EmergencyProposalsClient.emergencyPropose(contractEDP002, phil.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_sunset_height_reached)
  }
});

Clarinet.test({
  name: "Ensure emergency proposal can be proposed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { 
      deployer,
      exeDaoClient,
      phil,
      contractEDP000,
      contractEDP002,
      ede003EmergencyProposalsClient,
      ede001ProposalVotingClient,      
    } = setup(chain, accounts)
    
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    
    // chain.mineEmptyBlock(13140);

    ede001ProposalVotingClient.getProposalData(contractEDP002).result.expectNone()
    ede003EmergencyProposalsClient.isEmergencyTeamMember(phil.address).result.expectBool(true)
    block = chain.mineBlock([
      ede003EmergencyProposalsClient.emergencyPropose(contractEDP002, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
  }
});
