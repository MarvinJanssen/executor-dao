import { 
  Account, 
  Chain, 
  Tx 
} from './utils/helpers.ts';
import { PROPOSALS } from './utils/contract-addresses.ts';

export enum SDE008_PROPOSAL_SUBMISSION_CODES {
  ERR_UNAUTHORIZED = 3100,
  ERR_NOT_MEMBER_CONTRACT = 3101,
  ERR_UNKNOWN_PARAMETER = 3102,
  ERR_PROPOSAL_MINIMUM_START_DELAY = 3103,
  ERR_PROPOSAL_MAXIMUM_START_DELAY = 3104,
}

export class SDE008ProposalSubmission {
  chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  };

  setMemberContract(sender: Account, memberContract: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde008-proposal-submission', 'set-member-contract', [memberContract], sender.address),
    ]);

    return block.receipts[0].result;
  };

  getParameter(sender: Account, parameter: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde008-proposal-submission', 'get-parameter', [parameter], sender.address),
    ]);

    return block.receipts[0].result;
  };

  propose(sender: Account, proposal: string, startBlockHeight: string, memberContract: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde008-proposal-submission', 'propose', [proposal, startBlockHeight, memberContract], sender.address),
    ]);

    return block.receipts[0].result;
  };
};