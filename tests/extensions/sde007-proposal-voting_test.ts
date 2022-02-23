import { 
  Account, 
  Clarinet,
  Chain, 
  types,
} from '../models/utils/helpers.ts';
import { ExecutorDao } from '../models/executor-dao-model.ts';
import { SDE008ProposalSubmission, SDE008_PROPOSAL_SUBMISSION_CODES } from '../models/sde008-proposal-submission-model.ts';
import { SDE007ProposalVoting, SDE007_PROPOSAL_VOTING_CODES } from '../models/sde007-proposal-voting-model.ts';
import { EXTENSIONS, PROPOSALS } from '../models/utils/contract-addresses.ts';

Clarinet.test({
  name: 'SDE008ProposalVoting',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let Dao = new ExecutorDao(chain);
    let ProposalVoting = new SDE007ProposalVoting(chain);
    let data: any = null;

    // TODO: add tests
    
  },
});
