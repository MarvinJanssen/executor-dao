import { 
  Clarinet, 
  Tx, 
  Chain, 
  Account, 
  types, 
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { PROPOSALS } from './utils/contract-addresses.ts';

export enum SAFE_CODES {
  ERR_UNAUTHORIZED = 3200,
  ERR_ASSET_NOT_WHITELISTED = 3201,
  ERR_FAILED_TO_TRANSFER_STX = 3202,
  ERR_FAILED_TO_TRANSFER_FT = 3203,
  ERR_FAILED_TO_TRANSFER_NFT = 3204,
}

export class SDE009Safe {
  chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  };

  setWhitelisted(sender: Account, assetContract: string, whitelisted: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde009-safe', 'set-whitelisted', [assetContract, whitelisted], sender.address),
    ]);

    return block.receipts[0].result;
  };
};