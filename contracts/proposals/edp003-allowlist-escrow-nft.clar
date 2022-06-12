;; Title: EDP003 Allowlist Escrow NFT
;; Author: Marvin Janssen
;; Synopsis:
;; An example proposal to illustrate how ExecutorDAO can manage external
;; ownable contracts.
;; Description:
;; ExecutorDAO is well-equiped to manage external contracts feature have
;; some form of ownership. This proposal updates the allowlist of an
;; example escrow contract that is owned by the ExecutorDAO contract.
;; Note that the ExecutorDAO contract must be the owner of nft-escrow
;; for this proposal to be executed.

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(contract-call? .nft-escrow set-allowlisted .some-nft true)
)
