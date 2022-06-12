import {
  Chain,
  Account
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { ExecutorDaoClient } from "./executor-dao-client.ts";
import { EDP000BootstrapClient } from "./edp000-bootstrap-client.ts";
import { EDE000GovernanceTokenClient } from "./ede000-governance-token-client.ts";
import { EDE001ProposalVotingClient } from "./ede001-proposal-voting-client.ts";
import { EDE002ProposalSubmissionClient } from "./ede002-proposal-submission-client.ts";
import { EDE003EmergencyProposalsClient } from "./ede003-emergency-proposals-client.ts";
import { EDE004EmergencyExecuteClient } from "./ede004-emergency-execute-client.ts";
import { EDE005DevFundClient } from "./ede005-dev-fund-client.ts";
import { NftEscrowClient } from "./nft-escrow-client.ts";
import { NftClient } from "./nft-client.ts";

export class Utils {
  constructor() {}
  // deno-lint-ignore no-explicit-any
  constructDao = (chain: Chain, contractEDP000: string, deployer: Account, exeDaoClient: ExecutorDaoClient): any => {
    const block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
}

  passProposal = (blockHeight: number, chain: Chain, accounts: Map<string, Account>, proposal: string): any => {
    const {
        deployer, 
        exeDaoClient,
        phil, bobby, ward,
        contractEDP000, 
        contractEDE000,
        ede001ProposalVotingClient,
        ede002ProposalSubmissionClient
      } = utils.setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
      ]);
      if (blockHeight === 0) block.receipts[0].result.expectOk().expectBool(true)
  
      const propStartDelay = 144
      let startHeight = 1
      startHeight = block.height + propStartDelay
      block = chain.mineBlock([
        ede002ProposalSubmissionClient.propose(proposal, startHeight, contractEDE000, phil.address),
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
  
      if (blockHeight === 0) chain.mineEmptyBlock(startHeight + 1);
      else chain.mineEmptyBlock(144);
      // console.log('Block Height: ' + block.height + ' Start Height: ' + startHeight)
      
      block = chain.mineBlock([
        ede001ProposalVotingClient.vote(500, true, proposal, contractEDE000, bobby.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      
      chain.mineEmptyBlock(1585);  
      block = chain.mineBlock([
        ede001ProposalVotingClient.conclude(proposal, ward.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      return block
  }
  
  setup = (chain: Chain, accounts: Map<string, Account>): {
    administrator: Account;
    deployer: Account;
    phil: Account;
    daisy: Account;
    bobby: Account;
    hunter: Account;
    ward: Account;
    contractEXD: string;
    contractEDP000: string;
    contractEDP001: string;
    contractEDP001_1: string;
    contractEDP002: string;
    contractEDP003: string;
    contractEDP004: string;
    contractEDP005: string;
    contractEDP006: string;
    contractEDP007: string;
    contractEDP008_1: string;
    contractEDE000: string;
    contractEDE000_1: string;
    contractEDE001: string;
    contractEDE002: string;
    contractEDE003: string;
    contractEDE004: string;
    contractEDE005: string;
    contractNftEscrow: string;
    contractNft: string;
    exeDaoClient: ExecutorDaoClient;
    edp000BootstrapClient: EDP000BootstrapClient;
    ede000GovernanceTokenClient: EDE000GovernanceTokenClient;
    ede001ProposalVotingClient: EDE001ProposalVotingClient;
    ede002ProposalSubmissionClient: EDE002ProposalSubmissionClient;
    ede003EmergencyProposalsClient: EDE003EmergencyProposalsClient;
    ede004EmergencyExecuteClient: EDE004EmergencyExecuteClient;
    ede005DevFundClient: EDE005DevFundClient;
    nftEscrowClient: NftEscrowClient;
    nftClient: NftClient;
  } => {
    const administrator = accounts.get("deployer")!;
    const deployer = accounts.get("deployer")!;
    const contractEXD = accounts.get("deployer")!.address + '.executor-dao';
    const contractEDP000 = accounts.get("deployer")!.address + '.edp000-bootstrap';
    const contractEDP001 = accounts.get("deployer")!.address + '.edp001-dev-fund';
    const contractEDP001_1 = accounts.get("deployer")!.address + '.edp001-1-dev-fund';
    const contractEDP002 = accounts.get("deployer")!.address + '.edp002-kill-emergency-execute';
    const contractEDP003 = accounts.get("deployer")!.address + '.edp003-allowlist-escrow-nft';
    const contractEDP004 = accounts.get("deployer")!.address + '.edp004-dao-change-governance';
    const contractEDP005 = accounts.get("deployer")!.address + '.edp005-dao-change-sample-config';
    const contractEDP006 = accounts.get("deployer")!.address + '.edp006-dao-mint-burn-edg';
    const contractEDP007 = accounts.get("deployer")!.address + '.edp007-dao-update-executive';
    const contractEDP008_1 = accounts.get("deployer")!.address + '.edp008-1-allowlist-nft-escrow';
    const contractEDE000 = accounts.get("deployer")!.address + '.ede000-governance-token';
    const contractEDE000_1 = accounts.get("deployer")!.address + '.ede000-governance-token-v2';
    const contractEDE001 = accounts.get("deployer")!.address + '.ede001-proposal-voting';
    const contractEDE002 = accounts.get("deployer")!.address + '.ede002-proposal-submission';
    const contractEDE003 = accounts.get("deployer")!.address + '.ede003-emergency-proposals';
    const contractEDE004 = accounts.get("deployer")!.address + '.ede004-emergency-execute';
    const contractEDE005 = accounts.get("deployer")!.address + '.ede005-dev-fund';
    const contractNftEscrow = accounts.get("deployer")!.address + '.nft-escrow';
    const contractNft = accounts.get("deployer")!.address + '.sip009-nft';
    const phil = accounts.get("wallet_1")!;
    const daisy = accounts.get("wallet_2")!;
    const bobby = accounts.get("wallet_3")!;
    const hunter = accounts.get("wallet_4")!;
    const ward = accounts.get("wallet_9")!;
    const exeDaoClient = new ExecutorDaoClient(chain, deployer, 'executor-dao');
    const edp000BootstrapClient = new EDP000BootstrapClient(chain, deployer, 'edp000-bootstrap');
    const ede000GovernanceTokenClient = new EDE000GovernanceTokenClient(chain, deployer, 'ede000-governance-token');
    const ede001ProposalVotingClient = new EDE001ProposalVotingClient(chain, deployer, 'ede001-proposal-voting');
    const ede002ProposalSubmissionClient = new EDE002ProposalSubmissionClient(chain, deployer, 'ede002-proposal-submission');
    const ede003EmergencyProposalsClient = new EDE003EmergencyProposalsClient(chain, deployer, 'ede003-emergency-proposals');
    const ede004EmergencyExecuteClient = new EDE004EmergencyExecuteClient(chain, deployer, 'ede004-emergency-execute');
    const ede005DevFundClient = new EDE005DevFundClient(chain, deployer, 'ede005-dev-fund');
    const nftEscrowClient = new NftEscrowClient(chain, deployer, 'nft-escrow');
    const nftClient = new NftClient(chain, deployer, 'sip009-nft');
    return {
        administrator, 
        deployer, 
        phil, 
        daisy, 
        bobby, 
        hunter, 
        ward, 
        contractEXD, 
        contractEDP000, 
        contractEDP001, 
        contractEDP001_1, 
        contractEDP002, 
        contractEDP003, 
        contractEDP004, 
        contractEDP005, 
        contractEDP006,
        contractEDP007,
        contractEDP008_1,
        contractEDE000, 
        contractEDE000_1, 
        contractEDE001, 
        contractEDE002, 
        contractEDE003, 
        contractEDE004, 
        contractEDE005, 
        contractNftEscrow, 
        contractNft, 
        exeDaoClient, 
        edp000BootstrapClient,
        ede000GovernanceTokenClient, 
        ede001ProposalVotingClient, 
        ede002ProposalSubmissionClient, 
        ede003EmergencyProposalsClient,
        ede004EmergencyExecuteClient,
        ede005DevFundClient,
        nftEscrowClient,
        nftClient 
      };
  };
}
const utils = new Utils();
