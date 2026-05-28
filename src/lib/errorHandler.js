export function getErrorMessage(err) {
const apiError = err.response?.data?.error
if (!apiError) return 'Something went wrong. Please try again.'
return apiError.message || 'An error occurred.'
}


export function getFieldErrors(err) {
// Returns { fieldName: 'error message' } map for form validation
const details = err.response?.data?.error?.details || []
return Object.fromEntries(details.map(d => [d.field, d.message]))
}


export function isPlanLimitError(err) {
return err.response?.data?.error?.code === 'PLAN_LIMIT'
}


export function isSubscriptionRequired(err) {
return err.response?.data?.error?.code === 'SUBSCRIPTION_REQUIRED'
}
