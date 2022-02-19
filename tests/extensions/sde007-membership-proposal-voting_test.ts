
import { 
  Clarinet, 
  Tx, 
  Chain, 
  Account, 
  types, 
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { ExecutorDao } from '../models/executor-dao-model.ts';
import { SDE007MembershipProposalVoting, MEMBERSHIP_PROPOSAL_VOTING_CODES } from '../models/sde007-membership-proposal-voting-model.ts';
import { EXTENSIONS, PROPOSALS } from '../models/utils/contract-addresses.ts';

Clarinet.test({
  name: 'SDE008MembershipProposalVoting',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let Dao = new ExecutorDao(chain);
    let ProposalVoting = new SDE007MembershipProposalVoting(chain);
    let result: any = null;

    // TODO: add tests
    
  },
});
