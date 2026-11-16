import { Button, Input } from 'antd'
import { ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

import { uploadImage } from '@/api'
import { t } from '@/app/appI18n'
import { showError } from '@/shared/errors'

export type SampleImageValue = {
  file_id: string
  filename: string
  url: string
  caption: string
}

type Props = {
  value: SampleImageValue
  onChange: (patch: Partial<SampleImageValue>) => void
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () =>
      reject(reader.error ?? new Error(t('sample.record.message.imageUploadFailed')))
    reader.readAsDataURL(file)
  })
}

/** 样品图片统一走文件上传，不再要求用户手填文件标识、文件名和地址。 */
export function SampleImageUploadFields({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showError(
        new Error(t('sample.record.message.imageTypeInvalid')),
        t('sample.record.message.imageUploadFailed'),
      )
      return
    }
    setUploading(true)
    try {
      const contentBase64 = await readFileAsDataUrl(file)
      const uploaded = await uploadImage(file.name, contentBase64)
      onChange({
        file_id: uploaded.url.slice(0, 120),
        filename: uploaded.filename,
        url: uploaded.url,
      })
    } catch (caught) {
      showError(caught, t('sample.record.message.imageUploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="sample-image-upload">
      <div className="sample-image-upload-head">
        <span className="sample-image-upload-label">{t('sample.record.field.image')}</span>
        <Button
          icon={<ImagePlus size={14} />}
          loading={uploading}
          size="small"
          onClick={() => inputRef.current?.click()}
        >
          {t('sample.record.action.uploadImage')}
        </Button>
        {value.url ? (
          <Button
            icon={<Trash2 size={14} />}
            size="small"
            type="text"
            onClick={() => onChange({ file_id: '', filename: '', url: '' })}
          >
            {t('sample.record.action.removeImage')}
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        accept="image/*"
        aria-label={t('sample.record.action.uploadImage')}
        hidden
        type="file"
        onChange={handleFile}
      />
      {value.url ? (
        <div className="sample-image-upload-preview">
          <img
            alt={value.filename}
            src={value.url}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }}
          />
          <span>{value.filename}</span>
        </div>
      ) : (
        <p className="sample-image-upload-empty">{t('sample.record.form.noImage')}</p>
      )}
      <label>
        {t('sample.record.field.imageCaption')}
        <Input
          value={value.caption}
          onChange={(event) => onChange({ caption: event.target.value })}
        />
      </label>
    </div>
  )
}
