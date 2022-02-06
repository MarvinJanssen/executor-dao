;; Title: SDP001 Dev Fund
;; Author: Marvin Janssen
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

(define-constant err-not-enough-funds (err u2000))

(define-constant percentage u30)

(define-public (execute (sender principal))
  (let
    (
      (current-balance (stx-get-balance .sde009-vault))
      (amount (/ (* current-balance percentage) u100))
    )
    (asserts! (> current-balance amount) err-not-enough-funds)
    ;; Send 30% of the current funds in the vault
    (contract-call? .sde009-vault move-stx amount 'STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6)
  )
)
