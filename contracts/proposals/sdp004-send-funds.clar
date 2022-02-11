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
;; Author: StackerDAO Dev Team
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

(define-constant ERR_NOT_ENOUGH_FUNDS (err u2000))

(define-constant percentage u30)

(define-public (execute (sender principal))
  (let
    (
      (currentBalance (stx-get-balance .sde009-safe))
      (amount (/ (* currentBalance percentage) u100))
    )
    (asserts! (> currentBalance amount) ERR_NOT_ENOUGH_FUNDS)
    ;; Send 30% of the current funds in the vault
    (contract-call? .sde009-safe send-stx amount 'STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6)
  )
)
