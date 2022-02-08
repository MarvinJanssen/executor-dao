;; Title: SDP005 Disable Emergency Proposal
;; Original Author: Marvin Janssen
;; Maintaining Author: Ryan Waits
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

(define-public (execute (sender principal))
  (contract-call? .executor-dao set-extension .sde003-emergency-proposals false)
)
