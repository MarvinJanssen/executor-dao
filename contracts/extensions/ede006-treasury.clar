;; Title: EDE006 Treasury
;; Author: Marvin Janssen
;; Depends-On:
;; Synopsis:
;; A treasury that can manage STX, SIP009, SIP010, and SIP013 tokens.
;; Description:
;; An extension contract that is meant to hold tokens on behalf of the
;; DAO. It can hold and transfer STX, SIP009, SIP010, and SIP013 tokens.
;; They can be deposited by simply transferring them to the contract.
;; Any extension of executing proposal can trigger transfers.
;; Technically, the ExecutorDAO core can hold and transfer tokens
;; directly. The treasury extension merely adds a bit of separation.

(impl-trait .extension-trait.extension-trait)

(define-constant err-unauthorised (err u3000))

;; --- Transferable traits

(define-trait sip009-transferable
	(
		(transfer (uint principal principal) (response bool uint))
	)
)

(define-trait sip010-transferable
	(
		(transfer (uint principal principal (optional (buff 34))) (response bool uint))
	)
)

(define-trait sip013-transferable
	(
		(transfer (uint uint principal principal) (response bool uint))
		(transfer-memo (uint uint principal principal (buff 34)) (response bool uint))
	)
)

(define-trait sip013-transferable-many
	(
		(transfer-many ((list 200 {token-id: uint, amount: uint, sender: principal, recipient: principal})) (response bool uint))
		(transfer-many-memo ((list 200 {token-id: uint, amount: uint, sender: principal, recipient: principal, memo: (buff 34)})) (response bool uint))
	)
)

;; --- Authorisation check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) err-unauthorised))
)

;; --- Internal DAO functions

;; STX

(define-public (stx-transfer (amount uint) (recipient principal) (memo (optional (buff 34))))
	(begin
		(try! (is-dao-or-extension))
		(match memo to-print (print to-print) 0x)
		(as-contract (stx-transfer? amount tx-sender recipient))
	)
)

(define-public (stx-transfer-many (transfers (list 200 {amount: uint, recipient: principal, memo: (optional (buff 34))})))
	(begin
		(try! (is-dao-or-extension))
		(as-contract (fold stx-transfer-many-iter transfers (ok true)))
	)
)

;; SIP009

(define-public (sip009-transfer (amount uint) (recipient principal) (asset <sip009-transferable>))
	(begin
		(try! (is-dao-or-extension))
		(as-contract (contract-call? asset transfer amount tx-sender recipient))
	)
)

(define-public (sip009-transfer-many (data (list 200 {amount: uint, recipient: principal})) (asset <sip009-transferable>))
	(begin
		(as-contract (fold sip009-transfer-many-iter data asset))
		(ok true)
	)
)

;; SIP010

(define-public (sip010-transfer (amount uint) (recipient principal) (memo (optional (buff 34))) (asset <sip010-transferable>))
	(begin
		(try! (is-dao-or-extension))
		(as-contract (contract-call? asset transfer amount tx-sender recipient memo))
	)
)

(define-public (sip010-transfer-many (data (list 200 {amount: uint, recipient: principal, memo: (optional (buff 34))})) (asset <sip010-transferable>))
	(begin
		(as-contract (fold sip010-transfer-many-iter data asset))
		(ok true)
	)
)

;; SIP013

(define-public (sip013-transfer (token-id uint) (amount uint) (recipient principal) (memo (optional (buff 34))) (asset <sip013-transferable>))
	(begin
		(try! (is-dao-or-extension))
		(as-contract (match memo memo-buff
			(contract-call? asset transfer-memo token-id amount tx-sender recipient memo-buff)
			(contract-call? asset transfer token-id amount tx-sender recipient)
		))
	)
)

(define-public (sip013-transfer-many (transfers (list 200 {token-id: uint, amount: uint, sender: principal, recipient: principal})) (asset <sip013-transferable-many>))
	(begin
		(try! (is-dao-or-extension))
		(as-contract (contract-call? asset transfer-many transfers))
	)
)

(define-public (sip013-transfer-many-memo (transfers (list 200 {token-id: uint, amount: uint, sender: principal, recipient: principal, memo: (buff 34)})) (asset <sip013-transferable-many>))
	(begin
		(try! (is-dao-or-extension))
		(as-contract (contract-call? asset transfer-many-memo transfers))
	)
)

;; --- Iterator functions

(define-private (stx-transfer-many-iter (data {amount: uint, recipient: principal, memo: (optional (buff 34))}) (previous-result (response bool uint)))
	(begin
		(try! previous-result)
		(match (get memo data) to-print (print to-print) 0x)
		(stx-transfer? (get amount data) tx-sender (get recipient data))
	)
)

(define-private (sip009-transfer-many-iter (data {amount: uint, recipient: principal}) (asset <sip009-transferable>))
	(begin
		(unwrap-panic (contract-call? asset transfer (get amount data) tx-sender (get recipient data)))
		asset
	)
)

(define-private (sip010-transfer-many-iter (data {amount: uint, recipient: principal, memo: (optional (buff 34))}) (asset <sip010-transferable>))
	(begin
		(unwrap-panic (contract-call? asset transfer (get amount data) tx-sender (get recipient data) (get memo data)))
		asset
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
