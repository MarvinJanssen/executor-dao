;; Title: SDP003 Whitelist Escrow NFT
;; Original Author: Marvin Janssen
;; Maintaining Author: Ryan Waits
;; Synopsis:
;; An example proposal to illustrate how StackerDAO can manage external
;; ownable contracts.
;; Description:
;; StackerDAO is well-equiped to manage external contracts feature have
;; some form of ownership. This proposal updates the whitelist of an
;; example escrow contract that is owned by the StackerDAO contract.
;; Note that the StackerDAO contract must be the owner of nft-escrow
;; for this proposal to be executed.

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(contract-call? .nft-escrow set-whitelisted .some-nft true)
)
