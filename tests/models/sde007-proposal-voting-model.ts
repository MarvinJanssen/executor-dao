import { 
  Account, 
  Chain, 
  Tx 
} from '../utils/helpers.ts';
import { PROPOSALS } from '../utils/contract-addresses.ts';

export enum SDE007_PROPOSAL_VOTING_CODES {
  ERR_UNAUTHORIZED = 3000,
  ERR_NOT_MEMBER_CONTRACT = 3001,
  ERR_PROPOSAL_ALREADY_EXECUTED = 3002,
  ERR_PROPOSAL_ALREADY_EXISTS = 3003,
  ERR_UNKNOWN_PROPOSAL = 3004,
  ERR_PROPOSAL_ALREADY_CONCLUDED = 3005,
  ERR_PROPOSAL_INACTIVE = 3006,
  ERR_PROPOSAL_NOT_CONCLUDED = 3007,
  ERR_NO_VOTES_TO_RETURN = 3008,
  ERR_END_BLOCK_HEIGHT_NOT_REACHED = 3009,
  ERR_DISABLED_PROPOSAL = 3010,
  ERR_QUORUM_THRESHOLD_NOT_REACHED = 3011,
}

export class SDE007ProposalVoting {
  chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  };

  isMemberContract(sender: Account, memberContract: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde007-proposal-voting', 'is-member-contract', [memberContract], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  };

  getProposalData(sender: Account, proposal: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde007-proposal-voting', 'get-proposal-data', [proposal], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  };

  vote(sender: Account, voteFor: string, proposal: string, memberContract: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde007-proposal-voting', 'vote', [voteFor, proposal, memberContract], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  };

  conclude(sender: Account, proposal: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde007-proposal-voting', 'conclude', [proposal], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  };
};