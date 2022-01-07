(define-trait governance-token-trait
	(
		(edg-get-balance (principal) (response uint uint))
		(edg-has-percentage-balance (principal uint) (response bool uint))
		(edg-transfer (uint principal principal) (response bool uint))
		(edg-lock (uint principal) (response bool uint))
		(edg-unlock (uint principal) (response bool uint))
		(edg-get-locked (principal) (response uint uint))
		(edg-mint (uint principal) (response bool uint))
		(edg-burn (uint principal) (response bool uint))
	)
)
