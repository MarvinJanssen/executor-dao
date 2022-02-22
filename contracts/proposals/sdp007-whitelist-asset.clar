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

;; Title: SDP007 Whitelist Asset
;; Author: StackerDAO Dev Team
;; Synopsis:
;; This proposal whitelists a specific asset, allowing it to be deposited into a safe.
;; Description:
;; If this proposal passes, the specific asset will be whitelisted 
;; for deposit into its associated safe. In order to delist an assest,
;; a proposal must be written to get the balance of that asset, 
;; send the asset to a specified address and then the asset
;; must be delisted.

(impl-trait .proposal-trait.proposal-trait)

(define-constant contractAddress 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC.token)

(define-public (execute (sender principal))
  (contract-call? .sde009-safe set-whitelisted contractAddress true)
)