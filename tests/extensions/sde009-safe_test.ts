
import { 
  Clarinet, 
  Tx, 
  Chain, 
  Account, 
  types, 
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { SDE009Safe, SAFE_CODES } from '../models/sde009-safe-model.ts'; 
import { ExecutorDao } from '../models/executor-dao-model.ts';
import { SDE006Membership, MEMBERSHIP_CODES } from '../models/sde006-membership-model.ts';
import { SDE008MembershipProposalSubmission, MEMBERSHIP_PROPOSAL_SUBMISSION_CODES } from '../models/sde008-membership-proposal-submission-model.ts';
import { SDE007MembershipProposalVoting, MEMBERSHIP_PROPOSAL_VOTING_CODES } from '../models/sde007-membership-proposal-voting-model.ts';
import { EXTENSIONS, PROPOSALS } from '../models/utils/contract-addresses.ts';


Clarinet.test({
  name: '😢 SDE009Safe',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let Safe = new SDE009Safe(chain);
    let result: any = null
    let tokenToWhitelist: string = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC.token'
    
    //Test should ERR Unauthorized because the principal must be the DAO or an Extension
    result = await Safe.setWhitelisted(deployer, types.principal(tokenToWhitelist), types.bool(true))
    result.expectErr().expectUint(SAFE_CODES.ERR_UNAUTHORIZED)
  }
});

Clarinet.test({
  name: '😃 SDE009Safe',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let voter1 = accounts.get('wallet_1')!;
    let voter2 = accounts.get('wallet_2')!;
    let proposedNewMember = accounts.get('wallet_3')!;
    let Dao = new ExecutorDao(chain);
    let Membership = new SDE006Membership(chain);
    let ProposalSubmission = new SDE008MembershipProposalSubmission(chain);
    let ProposalVoting = new SDE007MembershipProposalVoting(chain);
    let Safe = new SDE009Safe(chain);
    let result: any = null;
    let validStartHeight: number = 150;
    let proposalDuration: number = 1440;
    let tokenToWhitelist: string = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC.token'
    
    // 1a. initialize the DAO with enabled extensions and set deployer as a member
    result = await Dao.initialize(deployer);
    result.expectOk().expectBool(true);
    
    // 3a. add proposal to whitelist an asset
    result = await ProposalSubmission.propose(deployer, types.principal(PROPOSALS.sdp007WhitelistAsset), types.uint(validStartHeight), types.principal(EXTENSIONS.sde006Membership));
    result.expectOk().expectBool(true);

    // 3b. verify new proposal is added to the proposal queue
    result = await ProposalVoting.getProposalData(deployer, types.principal(PROPOSALS.sdp007WhitelistAsset));
    result.expectSome().expectTuple({
      votesFor: types.uint(0),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + proposalDuration),
      concluded: types.bool(false),
      passed: types.bool(false),
      proposer: types.principal(deployer.address),
    });

    // 4a. simulate approval votes for proposal
    chain.mineEmptyBlockUntil(validStartHeight); // mine empty blocks to get to the start height
    let vote1 = await ProposalVoting.vote(voter1, types.bool(true), types.principal(PROPOSALS.sdp007WhitelistAsset), types.principal(EXTENSIONS.sde006Membership));
    let vote2 = await ProposalVoting.vote(voter2, types.bool(true), types.principal(PROPOSALS.sdp007WhitelistAsset), types.principal(EXTENSIONS.sde006Membership));
    vote1.expectOk().expectBool(true);
    vote2.expectOk().expectBool(true);

    // 4b. conclude approval vote for the proposal
    chain.mineEmptyBlockUntil(validStartHeight + proposalDuration); // mine empty blocks to get to the end block height
    result = await ProposalVoting.conclude(deployer, types.principal(PROPOSALS.sdp007WhitelistAsset));
    result.expectOk().expectBool(true);

    // 5a. verify the proposal data is updated
    result = await ProposalVoting.getProposalData(deployer, types.principal(PROPOSALS.sdp007WhitelistAsset));
    result.expectSome().expectTuple({
      votesFor: types.uint(2),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + proposalDuration),
      concluded: types.bool(true),
      passed: types.bool(true),
      proposer: types.principal(deployer.address),
    });

    // 6a. confirm that token is whitelisted
    result = await Safe.setWhitelisted(deployer, types.principal(tokenToWhitelist), types.bool(true))
    result.expectErr().expectUint(SAFE_CODES.ERR_UNAUTHORIZED);
  },
});

