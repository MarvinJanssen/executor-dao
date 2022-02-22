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

;; Title: SDE000 Governance Token
;; Author: Marvin Janssen / StackerDAO Dev Team
;; Depends-On: 
;; Synopsis:
;; This extension defines the governance token of StackerDAO.
;; Description:
;; The governance token is a simple SIP010-compliant fungible token
;; with some added functions to make it easier to manage by
;; StackerDAO proposals and extensions.

(impl-trait .governance-token-trait.governance-token-trait)
(impl-trait .sip010-ft-trait.sip010-ft-trait)
(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u2400))
(define-constant ERR_NOT_TOKEN_OWNER (err u4))

(define-fungible-token Stacker-DAO-Token)
(define-fungible-token Stacker-DAO-Token-Locked)

(define-data-var tokenName (string-ascii 32) "StackerDAO Governance Token")
(define-data-var tokenSymbol (string-ascii 10) "SDG")
(define-data-var tokenUri (optional (string-utf8 256)) none)
(define-data-var tokenDecimals uint u6)

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

;; governance-token-trait

(define-public (sdg-transfer (amount uint) (sender principal) (recipient principal))
	(begin
		(try! (is-dao-or-extension))
		(ft-transfer? Stacker-DAO-Token amount sender recipient)
	)
)

(define-public (sdg-lock (amount uint) (owner principal))
	(begin
		(try! (is-dao-or-extension))
		(try! (ft-burn? Stacker-DAO-Token amount owner))
		(ft-mint? Stacker-DAO-Token-Locked amount owner)
	)
)

(define-public (sdg-unlock (amount uint) (owner principal))
	(begin
		(try! (is-dao-or-extension))
		(try! (ft-burn? Stacker-DAO-Token-Locked amount owner))
		(ft-mint? Stacker-DAO-Token amount owner)
	)
)

(define-public (sdg-mint (amount uint) (recipient principal))
	(begin
		(try! (is-dao-or-extension))
		(ft-mint? Stacker-DAO-Token amount recipient)
	)
)

(define-public (sdg-burn (amount uint) (owner principal))
	(begin
		(try! (is-dao-or-extension))
		(ft-burn? Stacker-DAO-Token amount owner)
	)
)

;; --- Public functions

(define-public (set-name (newName (string-ascii 32)))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set tokenName newName))
	)
)

(define-public (set-symbol (newSymbol (string-ascii 10)))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set tokenSymbol newSymbol))
	)
)

(define-public (set-decimals (newDecimals uint))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set tokenDecimals newDecimals))
	)
)

(define-public (set-token-uri (newUri (optional (string-utf8 256))))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set tokenUri newUri))
	)
)

(define-private (sdg-mint-many-iter (item {amount: uint, recipient: principal}))
	(ft-mint? Stacker-DAO-Token (get amount item) (get recipient item))
)

(define-public (sdg-mint-many (recipients (list 200 {amount: uint, recipient: principal})))
	(begin
		(try! (is-dao-or-extension))
		(ok (map sdg-mint-many-iter recipients))
	)
)

;; sip010-ft-trait

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
	(begin
		(asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) ERR_NOT_TOKEN_OWNER)
		(ft-transfer? Stacker-DAO-Token amount sender recipient)
	)
)

(define-read-only (get-name)
	(ok (var-get tokenName))
)

(define-read-only (get-symbol)
	(ok (var-get tokenSymbol))
)

(define-read-only (get-decimals)
	(ok (var-get tokenDecimals))
)

(define-read-only (get-balance (who principal))
	(ok (+ (ft-get-balance Stacker-DAO-Token who) (ft-get-balance Stacker-DAO-Token-Locked who)))
)

(define-read-only (get-total-supply)
	(ok (+ (ft-get-supply Stacker-DAO-Token) (ft-get-supply Stacker-DAO-Token-Locked)))
)

(define-read-only (get-token-uri)
	(ok (var-get tokenUri))
)

;; governance-token-trait

(define-read-only (sdg-get-balance (who principal))
	(get-balance who)
)

(define-read-only (sdg-has-percentage-balance (who principal) (factor uint))
	(ok (>= (* (unwrap-panic (get-balance who)) factor) (* (unwrap-panic (get-total-supply)) u1000)))
)

(define-read-only (sdg-get-locked (owner principal))
	(ok (ft-get-balance Stacker-DAO-Token-Locked owner))
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
