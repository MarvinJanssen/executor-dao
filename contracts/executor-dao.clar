;;     _____________  _______ _________  ___  ___  ____  ____
;;     / __/_  __/ _ |/ ___/ //_/ __/ _ \/ _ \/ _ |/ __ \/ __/
;;     _\ \  / / / __ / /__/ ,< / _// , _/ // / __ / /_/ /\ \  
;;    /___/ /_/ /_/ |_\___/_/|_/___/_/|_/____/_/ |_\____/___/  
                                                         
;;    _________  ___  ____                                   
;;    / ___/ __ \/ _ \/ __/                                   
;;   / /__/ /_/ / , _/ _/                                     
;;   \___/\____/_/|_/___/                                     
;;                                                         

(use-trait proposal-trait .proposal-trait.proposal-trait)
(use-trait extension-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_ALREADY_EXECUTED (err u1001))
(define-constant ERR_INVALID_EXTENSION (err u1002))

(define-data-var executive principal tx-sender)
(define-map ExecutedProposals principal uint)
(define-map extensions principal bool)

;; --- Authorization check

(define-private (is-self-or-extension)
	(ok (asserts! (or (is-eq tx-sender (as-contract tx-sender)) (is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Extensions

(define-read-only (is-extension (extension principal))
	(default-to false (map-get? extensions extension))
)

(define-public (set-extension (extension principal) (enabled bool))
	(begin
		(try! (is-self-or-extension))
		(print {event: "extension", extension: extension, enabled: enabled})
		(ok (map-set extensions extension enabled))
	)
)

(define-private (set-extensions-iter (item {extension: principal, enabled: bool}))
	(begin
		(print {event: "extension", extension: (get extension item), enabled: (get enabled item)})
		(map-set extensions (get extension item) (get enabled item))
	)
)

(define-public (set-extensions (extensionList (list 200 {extension: principal, enabled: bool})))
	(begin
		(try! (is-self-or-extension))
		(ok (map set-extensions-iter extensionList))
	)
)

;; --- Proposals

(define-read-only (executed-at (proposal <proposal-trait>))
	(map-get? ExecutedProposals (contract-of proposal))
)

(define-public (execute (proposal <proposal-trait>) (sender principal))
	(begin
		(try! (is-self-or-extension))
		(asserts! (map-insert ExecutedProposals (contract-of proposal) block-height) ERR_ALREADY_EXECUTED)
		(print {event: "execute", proposal: proposal})
		(as-contract (contract-call? proposal execute sender))
	)
)

;; --- Initial DAO setup with extensions, members, team members, and executive members

(define-public (initialize (proposal <proposal-trait>))
	(let ((sender tx-sender))
		(asserts! (is-eq sender (var-get executive)) ERR_UNAUTHORIZED)
		(var-set executive (as-contract tx-sender))
		(print {event: "initialize", proposal: proposal})
		(as-contract (execute proposal sender))
	)
)

;; --- Extension requests

(define-public (request-extension-callback (extension <extension-trait>) (memo (buff 34)))
	(let ((sender tx-sender))
		(asserts! (and (is-extension contract-caller) (is-eq contract-caller (contract-of extension))) ERR_INVALID_EXTENSION)
		(as-contract (contract-call? extension callback sender memo))
	)
)
