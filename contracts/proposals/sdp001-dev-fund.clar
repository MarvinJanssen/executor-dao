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

;; Title: SDP001 Dev Fund
;; Author: Marvin Janssen / StackerDAO Dev Team
;; Synopsis:
;; This proposal creates a simple dev fund that pays developers on a monthly basis.
;; Description:
;; If this proposal passes, it mints new governance tokens equal to 30% of the total
;; supply and awards them to the SDE005 Dev Fund extension. It contains a number of
;; principals and set allowances. Any principal with an allowance is able to claim
;; an amount of tokens equal to the allowance on a (roughly) monthly basis.
;; Principals can be added and removed, and allowances can be changed via future
;; proposals.

(impl-trait .proposal-trait.proposal-trait)

(define-constant DEV_FUND_PERCENTAGE u30)

(define-public (execute (sender principal))
	(let
		(
			(totalSupply (unwrap-panic (contract-call? .sde000-governance-token get-total-supply)))
			(devFundAmount (/ (* totalSupply DEV_FUND_PERCENTAGE) u100))
		)
		(try! (contract-call? .executor-dao set-extension .sde005-dev-fund true))
		(try! (contract-call? .sde005-dev-fund set-allowance-start-height block-height))
		(try! (contract-call? .sde005-dev-fund set-developer-allowances (list
			{who: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG, allowance: u100}
			{who: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC, allowance: u20}
		)))
		(contract-call? .sde000-governance-token sdg-mint devFundAmount .sde005-dev-fund)
	)
)
