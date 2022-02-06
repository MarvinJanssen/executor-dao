(define-trait governance-token-trait
	(
		(sdg-get-balance (principal) (response uint uint))
		(sdg-has-percentage-balance (principal uint) (response bool uint))
		(sdg-transfer (uint principal principal) (response bool uint))
		(sdg-lock (uint principal) (response bool uint))
		(sdg-unlock (uint principal) (response bool uint))
		(sdg-get-locked (principal) (response uint uint))
		(sdg-mint (uint principal) (response bool uint))
		(sdg-burn (uint principal) (response bool uint))
	)
)
