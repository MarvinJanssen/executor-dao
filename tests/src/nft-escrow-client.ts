import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";

export enum NftEscrowErrorCode {
  err_sender_same_as_recipient=2,
  err_not_contract_owner=100,
  err_not_allowlisted=101,
  err_unknown_escrow=102,
  err_wrong_nft=103,
  err_not_nft_owner=104,
  }

export class NftEscrowClient {
  contractName = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  setContractOwner(newOwner: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-contract-owner",
      [types.principal(newOwner)], txSender);
  }
  setAllowlisted(nft: string, enabled: boolean, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-allowlisted",
      [types.principal(nft), types.bool(enabled)], txSender);
  }
  placeInEscrow(tokenId: number, recipient: string, amount: number, nft: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "place-in-escrow",
      [types.uint(tokenId), types.principal(recipient), types.uint(amount), types.principal(nft)], txSender);
  }
  payAndRedeem(tokenId: number, nft: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "pay-and-redeem",
      [types.uint(tokenId), types.principal(nft)], txSender);
  }
  cancelEscrow(tokenId: number, recipient: string, nft: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "cancel-escrow",
      [types.uint(tokenId), types.principal(recipient), types.principal(nft)], txSender);
  }

  getEscrow(tokenId: number, recipient: string): ReadOnlyFn {
    return this.callReadOnlyFn("get-escrow", [types.uint(tokenId), types.principal(recipient)]);
  }
  getContractOwner(): ReadOnlyFn {
    return this.callReadOnlyFn("get-contract-owner", []);
  }
  isAllowlisted(nft: string): ReadOnlyFn {
    return this.callReadOnlyFn("is-allowlisted", [types.principal(nft)]);
  }

  private callReadOnlyFn(
    method: string,
    // deno-lint-ignore no-explicit-any
    args: Array<any> = [],
    sender: Account = this.deployer
  ): ReadOnlyFn {
    const result = this.chain.callReadOnlyFn(
      this.contractName,
      method,
      args,
      sender?.address
    );

    return result;
  }
}
