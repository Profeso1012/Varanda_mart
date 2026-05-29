const BASE_URL = import.meta.env.VITE_API_BASE_URL // https://api.varanda.com/api/v1
const EXT_URL = import.meta.env.VITE_EXT_API_URL // https://api.varanda.com/ext/v1
// Storefront — determined by the Host the storefront is served on
// teststore.varanda.com → all storefront calls go to BASE_URL
// The tenant is resolved server-side from the Host header; in dev pass X-Tenant-Domain header
const DEV_TENANT_DOMAIN = import.meta.env.VITE_DEV_TENANT_DOMAIN // 'teststore.varanda.com'
