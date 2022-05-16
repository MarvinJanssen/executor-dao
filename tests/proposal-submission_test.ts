
import { types, Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assert, assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { ExecutorDaoClient, ExecutorDaoErrCode } from "./src/executor-dao-client.ts";
import { EDP000BootstrapClient, EDP000BootstrapErrCode } from "./src/edp000-bootstrap-client.ts";
import { EDE000GovernanceTokenClient, EDE000GovernanceTokenErrCode } from "./src/ede000-governance-token-client.ts";
import { EDE001ProposalVotingClient, EDE001ProposalVotingErrCode } from "./src/ede001-proposal-voting-client.ts";
import { EDE002ProposalSubmissionClient, EDE002ProposalSubmissionErrCode } from "./src/ede002-proposal-submission-client.ts";
import { EDE003EmergencyProposalsClient, EDE003EmergencyProposalsErrCode } from "./src/ede003-emergency-proposals-client.ts";
import { EDE004EmergencyExecuteClient, EDE004EmergencyExecuteErrCode } from "./src/ede004-emergency-execute-client.ts";

const setup = (chain: Chain, accounts: Map<string, Account>): {
    administrator: Account;
    deployer: Account;
    contractEXD: string;
    contractNE: string;
    contractEDP000: string;
    contractEDP001: string;
    contractEDP002: string;
    contractEDP003: string;
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
    edp000BootstrapClient: EDP000BootstrapClient;
    ede000GovernanceTokenClient: EDE000GovernanceTokenClient;
    ede001ProposalVotingClient: EDE001ProposalVotingClient;
    ede002ProposalSubmissionClient: EDE002ProposalSubmissionClient;
    ede003EmergencyProposalsClient: EDE003EmergencyProposalsClient;
    ede004EmergencyExecuteClient: EDE004EmergencyExecuteClient;
  } => {
    const administrator = accounts.get("deployer")!;
    const deployer = accounts.get("deployer")!;
    const contractEXD = accounts.get("deployer")!.address + '.executor-dao';
    const contractNE = accounts.get("deployer")!.address + '.nft-escrow';
    const contractEDP000 = accounts.get("deployer")!.address + '.edp000-bootstrap';
    const contractEDP001 = accounts.get("deployer")!.address + '.edp001-dev-fund';
    const contractEDP002 = accounts.get("deployer")!.address + '.edp002-kill-emergency-execute';
    const contractEDP003 = accounts.get("deployer")!.address + '.edp003-whitelist-escrow-nft';
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
    const edp000BootstrapClient = new EDP000BootstrapClient(chain, deployer, 'edp000-bootstrap');
    const ede000GovernanceTokenClient = new EDE000GovernanceTokenClient(chain, deployer, 'ede000-governance-token');
    const ede001ProposalVotingClient = new EDE001ProposalVotingClient(chain, deployer, 'ede001-proposal-voting');
    const ede002ProposalSubmissionClient = new EDE002ProposalSubmissionClient(chain, deployer, 'ede002-proposal-submission');
    const ede003EmergencyProposalsClient = new EDE003EmergencyProposalsClient(chain, deployer, 'ede003-emergency-proposals');
    const ede004EmergencyExecuteClient = new EDE004EmergencyExecuteClient(chain, deployer, 'ede004-emergency-execute');
    return {
        administrator, deployer, contractEXD, contractNE,
        contractEDP000, contractEDP001, contractEDP002, contractEDP003,
        contractEDE000, contractEDE001, contractEDE002, contractEDE003, contractEDE004, contractEDE005, 
        phil, daisy, bobby, hunter, exeDaoClient, edp000BootstrapClient, 
        ede000GovernanceTokenClient, ede001ProposalVotingClient, ede002ProposalSubmissionClient,
        ede003EmergencyProposalsClient, ede004EmergencyExecuteClient };
  };

  Clarinet.test({
    name: "Ensure voting rejected before start height reached.",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        phil,
        contractEDP000, 
        contractEDP003,
        contractEDE000,
        ede002ProposalSubmissionClient
      } = setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
  
      const startHeight = block.height + 143
      block = chain.mineBlock([
        ede002ProposalSubmissionClient.propose(contractEDP003, startHeight, contractEDE000, phil.address)
      ]);
      block.receipts[0].result.expectErr().expectUint(3104)
    }
  });
  