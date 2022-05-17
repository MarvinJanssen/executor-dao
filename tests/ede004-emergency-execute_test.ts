
import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { ExecutorDaoClient, ExecutorDaoErrCode } from "./src/executor-dao-client.ts";
import { EDP000BootstrapClient, EDP000BootstrapErrCode } from "./src/edp000-bootstrap-client.ts";
import { EDE004EmergencyExecuteClient, EDE004EmergencyExecuteErrCode } from "./src/ede004-emergency-execute-client.ts";
import { EDE001ProposalVotingClient, EDE001ProposalVotingErrCode } from "./src/ede001-proposal-voting-client.ts";
import { EDE002ProposalSubmissionClient, EDE002ProposalSubmissionErrCode } from "./src/ede002-proposal-submission-client.ts";
import { EDE003EmergencyProposalsClient, EDE003EmergencyProposalsErrCode } from "./src/ede003-emergency-proposals-client.ts";

const setup = (chain: Chain, accounts: Map<string, Account>): {
  administrator: Account;
  deployer: Account;
  contractEXD: string;
  contractEDP000: string;
  contractEDP002: string;
  contractEDP007: string;
  contractEDE000: string;
  contractEDE001: string;
  contractEDE002: string;
  contractEDE004: string;
  phil: Account;
  daisy: Account;
  bobby: Account;
  ward: Account;
  exeDaoClient: ExecutorDaoClient;
  edp000BootstrapClient: EDP000BootstrapClient;
  ede004EmergencyExecuteClient: EDE004EmergencyExecuteClient;
  ede001ProposalVotingClient: EDE001ProposalVotingClient;
  ede002ProposalSubmissionClient: EDE002ProposalSubmissionClient;
  ede003EmergencyProposalsClient: EDE003EmergencyProposalsClient;
} => {
  const administrator = accounts.get("deployer")!;
  const deployer = accounts.get("deployer")!;
  const contractEXD = accounts.get("deployer")!.address + '.executor-dao';
  const contractEDP000 = accounts.get("deployer")!.address + '.edp000-bootstrap';
  const contractEDP002 = accounts.get("deployer")!.address + '.edp002-kill-emergency-execute';
  const contractEDP007 = accounts.get("deployer")!.address + '.edp007-dao-update-executive';
  
  const contractEDE000 = accounts.get("deployer")!.address + '.ede000-governance-token';
  const contractEDE001 = accounts.get("deployer")!.address + '.ede001-proposal-voting';
  const contractEDE002 = accounts.get("deployer")!.address + '.ede002-proposal-submission';
  const contractEDE004 = accounts.get("deployer")!.address + '.ede004-emergency-execute';
  const phil = accounts.get("wallet_1")!;
  const daisy = accounts.get("wallet_2")!;
  const bobby = accounts.get("wallet_3")!;
  const ward = accounts.get("wallet_9")!;
  const exeDaoClient = new ExecutorDaoClient(chain, deployer, 'executor-dao');
  const edp000BootstrapClient = new EDP000BootstrapClient(chain, deployer, 'edp000-bootstrap');
  const ede004EmergencyExecuteClient = new EDE004EmergencyExecuteClient(chain, deployer, 'ede004-emergency-execute');
  const ede003EmergencyProposalsClient = new EDE003EmergencyProposalsClient(chain, deployer, 'ede003-emergency-proposals');
  const ede001ProposalVotingClient = new EDE001ProposalVotingClient(chain, deployer, 'ede001-proposal-voting');
  const ede002ProposalSubmissionClient = new EDE002ProposalSubmissionClient(chain, deployer, 'ede002-proposal-submission');
  return {
      administrator, deployer, contractEXD,
      contractEDP000, contractEDP002, contractEDP007,
      contractEDE000, contractEDE001, contractEDE002, contractEDE004,
      phil, daisy, bobby, ward, exeDaoClient, edp000BootstrapClient, 
      ede004EmergencyExecuteClient, ede001ProposalVotingClient, ede002ProposalSubmissionClient, ede003EmergencyProposalsClient };
};

Clarinet.test({
  name: "Ensure extension parameters cannot be changed without authority.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      bobby,
      contractEDP000,
      ede004EmergencyExecuteClient
    } = setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.isExecutiveTeamMember(bobby.address).result.expectBool(true)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.setExecutiveTeamMember(bobby.address, false, deployer.address),
      ede004EmergencyExecuteClient.setExecutiveTeamSunsetHeight(90, deployer.address),
      ede004EmergencyExecuteClient.setSignalsRequired(100, deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_unauthorised)
    block.receipts[1].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_unauthorised)
    block.receipts[2].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_unauthorised)

    ede004EmergencyExecuteClient.isExecutiveTeamMember(bobby.address).result.expectBool(true)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
  }
});

Clarinet.test({
  name: "Ensure extension parameters cannot be changed without authority.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      bobby,
      contractEDP000,
      ede004EmergencyExecuteClient
    } = setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(bobby.address).result.expectBool(true)
    
    block = chain.mineBlock([
      ede004EmergencyExecuteClient.setExecutiveTeamMember(bobby.address, false, deployer.address),
      ede004EmergencyExecuteClient.setExecutiveTeamSunsetHeight(90, deployer.address),
      ede004EmergencyExecuteClient.setSignalsRequired(100, deployer.address)
    ]);

    block.receipts[0].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_unauthorised)
    block.receipts[1].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_unauthorised)
    block.receipts[2].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_unauthorised)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(bobby.address).result.expectBool(true)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
  }
});

Clarinet.test({
  name: "Ensure only executive team members can take an executive action.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      ward,
      contractEDP000, 
      contractEDP007,
      ede004EmergencyExecuteClient
    } = setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, ward.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_not_executive_team_member)
  }
});

Clarinet.test({
  name: "Ensure executive team members cant signal multiple times on same proposal.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil,
      contractEDP000, 
      contractEDP007,
      ede004EmergencyExecuteClient
    } = setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)
  }
});

Clarinet.test({
  name: "Ensure settings on the emergency execute extension can be changed via a proposal.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby,
      contractEDP000, 
      contractEDP007,
      ede004EmergencyExecuteClient
    } = setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(2)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(4)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(false)
  }
});

Clarinet.test({
  name: "Ensure same proposal cat be executed twice.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby, ward,
      contractEDP000, 
      contractEDP007,
      ede004EmergencyExecuteClient
    } = setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, daisy.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    block.receipts[1].result.expectOk().expectUint(2)
    block.receipts[2].result.expectOk().expectUint(3)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(4)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(false)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(ward.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, ward.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, daisy.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, bobby.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(ExecutorDaoErrCode.err_already_executed)
  }
});

Clarinet.test({
  name: "Ensure an extension can be switched off via an emergency execute.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby, ward,
      contractEDP000, 
      contractEDP002,
      contractEDP007,
      contractEDE000,
      contractEDE001,
      contractEDE002,
      contractEDE004,
      ede004EmergencyExecuteClient
    } = setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE000).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE001).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE002).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE004).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP002, phil.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP002, daisy.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP002, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    block.receipts[1].result.expectOk().expectUint(2)
    block.receipts[2].result.expectOk().expectUint(3)
    exeDaoClient.isExtension(contractEDE004).result.expectBool(false)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, daisy.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    block.receipts[1].result.expectOk().expectUint(2)
    block.receipts[2].result.expectErr().expectUint(ExecutorDaoErrCode.err_unauthorised)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE000).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE001).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE002).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE004).result.expectBool(false)
  }
});
