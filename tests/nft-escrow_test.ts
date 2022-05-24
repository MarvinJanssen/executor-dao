import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { Utils } from "./src/utils.ts";

const utils = new Utils();

Clarinet.test({
  name: "Ensure nft-escrow not a valid extension.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      daisy,
      bobby,
      contractEDE005,
      exeDaoClient,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    exeDaoClient.isExtension(contractEDE005).result.expectBool(false)
    ede005DevFundClient.getDeveloperAllowance(daisy.address).result.expectUint(0)
    ede005DevFundClient.getDeveloperAllowance(bobby.address).result.expectUint(0)
  }
});
