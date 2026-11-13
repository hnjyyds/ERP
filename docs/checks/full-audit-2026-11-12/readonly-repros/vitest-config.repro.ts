import base from './vitest.config'
export default { ...base, test: { ...base.test, include: ['.audit-readonly.test.tsx'] } }
