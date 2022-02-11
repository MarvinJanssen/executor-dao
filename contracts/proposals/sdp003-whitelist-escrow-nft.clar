;;     _____________  _______ _________  ___  ___  ____  ____
;;     / __/_  __/ _ |/ ___/ //_/ __/ _ \/ _ \/ _ |/ __ \/ __/
;;     _\ \  / / / __ / /__/ ,< / _// , _/ // / __ / /_/ /\ \  
;;    /___/ /_/ /_/ |_\___/_/|_/___/_/|_/____/_/ |_\____/___/  
;;                                                          
;;     ___  ___  ____  ___  ____  _______   __               
;;    / _ \/ _ \/ __ \/ _ \/ __ \/ __/ _ | / /               
;;   / ___/ , _/ /_/ / ___/ /_/ /\ \/ __ |/ /__              
;;  /_/  /_/|_|\____/_/   \____/___/_/ |_/____/              
;;                                                         

;; Title: SDP003 Whitelist Escrow NFT
;; Author: Marvin Janssen / StackerDAO Dev Team
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
