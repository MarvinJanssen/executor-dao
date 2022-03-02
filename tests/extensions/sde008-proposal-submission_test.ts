import { 
  Account, 
  Clarinet,
  Chain, 
  types,
} from '../utils/helpers.ts';
import { ExecutorDao } from '../models/executor-dao-model.ts';
import { SDE008ProposalSubmission, SDE008_PROPOSAL_SUBMISSION_CODES } from '../models/sde008-proposal-submission-model.ts';
import { SDE007ProposalVoting, SDE007_PROPOSAL_VOTING_CODES } from '../models/sde007-proposal-voting-model.ts';
import { EXTENSIONS, TEST_EXTENSIONS, PROPOSALS, TEST_PROPOSALS } from '../utils/contract-addresses.ts';

Clarinet.test({
  name: 'sde008-proposal-submission',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let voter1 = accounts.get('wallet_1')!;
    let voter2 = accounts.get('wallet_2')!;
    let Dao = new ExecutorDao(chain);
    let ProposalSubmission = new SDE008ProposalSubmission(chain);
    let ProposalVoting = new SDE007ProposalVoting(chain);
    let data: any = null;
    let validStartHeight: number = 150;
    let proposalDuration: number = 1440;

    // 1a. should return current member contract as sde006Membership
    data = await ProposalSubmission.getMemberContract(deployer);
    data.result.expectPrincipal(EXTENSIONS.sde006Membership);

    // 1b. should return an err response unauthorized
    data = await ProposalSubmission.setMemberContract(deployer, types.principal(EXTENSIONS.sde006Membership));
    data.result.expectErr().expectUint(SDE008_PROPOSAL_SUBMISSION_CODES.ERR_UNAUTHORIZED);

    // 2a. initialize members and extensions
    data = await Dao.initialize(deployer);
    data.result.expectOk().expectBool(true);

    // 2b. add proposal to change the membership contract address
    data = await ProposalSubmission.propose(deployer, types.principal(TEST_PROPOSALS.sdp008TestProposalSubmission), types.uint(validStartHeight), types.principal(EXTENSIONS.sde006Membership));
    data.result.expectOk().expectBool(true);

    // 2c. verify new proposal is added to the proposal queue
    data = await ProposalVoting.getProposalData(deployer, types.principal(TEST_PROPOSALS.sdp008TestProposalSubmission));
    data.result.expectSome().expectTuple({
      votesFor: types.uint(0),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + proposalDuration),
      concluded: types.bool(false),
      passed: types.bool(false),
      proposer: types.principal(deployer.address),
    });

    // 3a. simulate approval votes for proposal
    chain.mineEmptyBlockUntil(validStartHeight); // mine empty blocks to get to the start height
    let vote1 = await ProposalVoting.vote(voter1, types.bool(true), types.principal(TEST_PROPOSALS.sdp008TestProposalSubmission), types.principal(EXTENSIONS.sde006Membership));
    let vote2 = await ProposalVoting.vote(voter2, types.bool(true), types.principal(TEST_PROPOSALS.sdp008TestProposalSubmission), types.principal(EXTENSIONS.sde006Membership));
    vote1.result.expectOk().expectBool(true);
    vote2.result.expectOk().expectBool(true);

    // 3b. conclude approval vote for the proposal
    chain.mineEmptyBlockUntil(validStartHeight + proposalDuration); // mine empty blocks to get to the end block height
    data = await ProposalVoting.conclude(deployer, types.principal(TEST_PROPOSALS.sdp008TestProposalSubmission));
    data.result.expectOk().expectBool(true);

    // 4a. verify the proposal data is updated
    data = await ProposalVoting.getProposalData(deployer, types.principal(TEST_PROPOSALS.sdp008TestProposalSubmission));
    data.result.expectSome().expectTuple({
      votesFor: types.uint(2),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + proposalDuration),
      concluded: types.bool(true),
      passed: types.bool(true),
      proposer: types.principal(deployer.address),
    });

    // 5a. verify the proposal is executed and the extension rules are updated
    data = await ProposalSubmission.getMemberContract(deployer);
    data.result.expectPrincipal(TEST_EXTENSIONS.sde006TestMembership);

    // 5b. verify that sde006TestMembership is enabled
    data = await Dao.isExtension(deployer, types.principal(TEST_EXTENSIONS.sde006TestMembership));
    data.result.expectBool(true);

    // 5c. verify that sde006Membership is disabled
    data = await Dao.isExtension(deployer, types.principal(EXTENSIONS.sde006Membership));
    data.result.expectBool(false);

    // 5d. check the proposal duration has been updated
    data = await ProposalSubmission.getParameter(deployer, types.ascii('proposalDuration'));
    data.result.expectOk().expectUint(2016);

    // 5e. check the proposal min delay has been updated
    data = await ProposalSubmission.getParameter(deployer, types.ascii('minimumProposalStartDelay'));
    data.result.expectOk().expectUint(288);

    // 5f. check the proposal max delay has been updated
    data = await ProposalSubmission.getParameter(deployer, types.ascii('maximumProposalStartDelay'));
    data.result.expectOk().expectUint(2016);
  },
});
