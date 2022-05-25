import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";

const setup = (accounts: Map<string, Account>): {
  administrator: Account;
  deployer: Account;
  contractEXD: string;
  contractEDP000: string;
} => {
  const administrator = accounts.get("deployer")!;
  const deployer = accounts.get("deployer")!;
  const contractEXD = accounts.get("deployer")!.address + '.executor-dao';
  const contractEDP000 = accounts.get("deployer")!.address + '.edp000-bootstrap';
  return {
      administrator, deployer, contractEXD, contractEDP000
  };
};

Clarinet.test({
    name: "Ensure edg cant be transferred if tx sender is not the owner or the dao.",
    fn(chain: Chain, accounts: Map<string, Account>) {
  
      // TODO test proposal
    }
});
