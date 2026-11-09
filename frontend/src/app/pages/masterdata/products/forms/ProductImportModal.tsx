// 商品资料：批量导入弹窗与导入结果

import { Alert, Modal, Table, Upload } from 'antd'
import { Upload as UploadIcon } from 'lucide-react'

import type { ProductImportResult } from '@/api'
import { t } from '@/app/appI18n'

type Props = {
  open: boolean
  importing: boolean
  result: ProductImportResult | null
  onClose: () => void
  onSelectFile: (file: File) => void
}

export function ProductImportModal({ open, importing, result, onClose, onSelectFile }: Props) {
  return (
    <Modal
      centered
      footer={null}
      open={open}
      title={t('masterdata.product.import.title')}
      width={680}
      onCancel={onClose}
    >
      <div className="record-form entity-modal-form">
        <p className="product-image-hint">{t('masterdata.product.import.hint')}</p>
        <Upload.Dragger
          accept=".csv,.xlsx"
          beforeUpload={(file) => {
            onSelectFile(file as unknown as File)
            return false
          }}
          disabled={importing}
          maxCount={1}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadIcon size={28} />
          </p>
          <p className="ant-upload-text">
            {importing ? t('masterdata.product.import.importing') : t('masterdata.product.import.drop')}
          </p>
        </Upload.Dragger>

        {result ? (
          <div className="compact-section">
            <Alert
              type={result.failed > 0 ? 'warning' : 'success'}
              showIcon
              message={t('masterdata.product.import.result', {
                created: result.created,
                updated: result.updated,
                failed: result.failed,
              })}
            />
            {result.errors.length > 0 ? (
              <Table
                className="compact-section"
                columns={[
                  { title: t('masterdata.product.import.row'), dataIndex: 'row', width: 80 },
                  { title: t('masterdata.product.field.code'), dataIndex: 'code', width: 140 },
                  { title: t('masterdata.product.import.reason'), dataIndex: 'message' },
                ]}
                dataSource={result.errors}
                pagination={false}
                rowKey={(record) => `${record.row}`}
                size="small"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
