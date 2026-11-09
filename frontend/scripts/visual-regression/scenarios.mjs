/**
 * 视觉回归场景清单。
 * 覆盖：登录页、工作台、财务页（分片最多）、表格密集列表页、带弹窗的表单页、
 * 详情页、窄窗口响应式。
 *
 * 详情页需要真实数据 id，由 run.mjs 通过接口解析；解析不到时自动跳过。
 */
export function buildScenarios({ productId, inboundOrderId, contractId }) {
  const scenarios = [
    { name: 'login', path: '/login', auth: false },
    { name: 'dashboard', path: '/' },
    { name: 'en-sidebar', path: '/', language: 'en-US', expandNav: true },
    {
      name: 'en-sidebar-1024',
      path: '/',
      language: 'en-US',
      expandNav: true,
      viewport: { width: 1024, height: 900 },
    },
    { name: 'finance-home', path: '/finance' },
    { name: 'finance-receipts', path: '/finance/receipts' },
    { name: 'finance-tax', path: '/finance/tax' },
    { name: 'finance-reports', path: '/finance/reports' },
    { name: 'products-list', path: '/masterdata/products' },
    { name: 'inbound-list', path: '/warehouse/inbound-orders' },
    { name: 'purchase-contracts', path: '/purchase/contracts' },
    { name: 'inbound-modal', path: '/warehouse/inbound-orders', clickTestId: 'inbound-workflow-open' },
    {
      name: 'narrow-420-inbound',
      path: '/warehouse/inbound-orders',
      viewport: { width: 420, height: 860 },
    },
    {
      name: 'narrow-768-finance',
      path: '/finance/receipts',
      viewport: { width: 768, height: 900 },
    },
    { name: 'sample-requests', path: '/sample/requests' },
    { name: 'sample-records', path: '/sample/records' },
    { name: 'sample-deliveries', path: '/sample/deliveries' },
    { name: 'purchase-inquiries', path: '/purchase/inquiries' },
    { name: 'purchase-followup', path: '/purchase/followup' },
    { name: 'purchase-invoice-notices', path: '/purchase/invoice-notices' },
    { name: 'quality-inspections', path: '/quality/inspections' },
    { name: 'quality-tasks', path: '/quality/tasks' },
    { name: 'inbound-plans', path: '/warehouse/inbound-plans' },
    { name: 'outbound-plans', path: '/warehouse/outbound-plans' },
    { name: 'outbound-orders', path: '/warehouse/outbound-orders' },
    { name: 'sales-quotations', path: '/sales/quotations' },
    { name: 'sales-shipments', path: '/sales/shipments' },
    { name: 'sales-contracts', path: '/sales/contracts' },
    { name: 'organization-users', path: '/organization/users' },
  ]

  if (productId) {
    scenarios.push({ name: 'product-detail', path: `/masterdata/products/${productId}` })
  }
  if (contractId) {
    scenarios.push({ name: 'sales-contract-detail', path: `/sales/contracts/${contractId}` })
  }
  if (inboundOrderId) {
    scenarios.push({
      name: 'inbound-order-detail',
      path: `/warehouse/inbound-orders/${inboundOrderId}`,
    })
  }

  return scenarios
}

/** 需要逐元素比对的计算样式属性。 */
export const STYLE_PROPS = [
  'display',
  'position',
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderTopWidth',
  'borderRadius',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'paddingTop',
  'paddingLeft',
  'marginTop',
  'marginBottom',
  'height',
  'width',
  'boxShadow',
  'gap',
  'gridTemplateColumns',
  'flexDirection',
  'opacity',
  'transform',
  'overflowX',
  'minHeight',
]
