;;     _____________  _______ _________  ___  ___  ____  ____
;;     / __/_  __/ _ |/ ___/ //_/ __/ _ \/ _ \/ _ |/ __ \/ __/
;;     _\ \  / / / __ / /__/ ,< / _// , _/ // / __ / /_/ /\ \  
;;    /___/ /_/ /_/ |_\___/_/|_/___/_/|_/____/_/ |_\____/___/  
;;                                                          
;;     _____  _____________  ______________  _  __           
;;    / __/ |/_/_  __/ __/ |/ / __/  _/ __ \/ |/ /           
;;   / _/_>  <  / / / _//    /\ \_/ // /_/ /    /            
;;  /___/_/|_| /_/ /___/_/|_/___/___/\____/_/|_/             
;;                                                           

;; Title: SDE010 MiamiCoin Stacking
;; Author: StackerDAO Dev Team
;; Depends-On:
;; Synopsis:
;; This extension part of the core of StackerDAO. It allows for basic treasury operations.
;; Description:
;; Proposals may be submitted by any members to send funds from the treasury.

(use-trait ft-trait .sip010-ft-trait.sip010-ft-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u3300))


;; --- Authorization check

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Public functions

;; --- Read Only Functions

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
