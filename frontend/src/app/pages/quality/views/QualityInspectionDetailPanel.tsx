import { Button, Tag } from 'antd'
import {
  ArrowLeft,
  CheckCheck,
  LayoutDashboard,
  Paperclip,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'

import type { QualityInspection, QualityInspectionInboundEligibility } from '@/api'
import { PanelTitle } from '@/shared/ui'
import { t } from '@/app/appI18n'
import { formatDate, nullableText } from '@/app/pages/appHelpers'

import {
  formatScheduledAt,
  inboundReason,
  issueSeverityLabel,
  issueStatusLabel,
  qualityEventLabel,
  resultLabel,
  taskStatusLabel,
} from '../qualityInspectionMeta'

type Props = {
  inspection: QualityInspection | null
  eligibility: QualityInspectionInboundEligibility | null
  onBack: () => void
  onReinspection: () => void
  onResolveIssue: (issueId: string) => void
}

export function QualityInspectionDetailPanel({
  inspection,
  eligibility,
  onBack,
  onReinspection,
  onResolveIssue,
}: Props) {
  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('quality.inspection.panel.detailTitle')}
        />
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('quality.inspection.action.backToList')}
        </Button>
      </div>
      {inspection ? (
        <>
          <div
            className={`quality-eligibility ${eligibility?.eligible ? 'eligible' : 'blocked'}`}
          >
            <strong>{eligibility?.reason ?? inboundReason(inspection)}</strong>
            <span>
              {t('quality.inspection.panel.taskSummary', {
                status: taskStatusLabel(inspection.status),
                result: resultLabel(inspection.result),
              })}
            </span>
          </div>
          {inspection.status === 'completed' && inspection.result !== 'passed' ? (
            eligibility === null ? null : (
              <div className="detail-action-bar">
                {eligibility.latest_inspection_id === inspection.id ? (
                  <>
                    <Button
                      disabled={inspection.issues.some((issue) => issue.status !== 'resolved')}
                      icon={<RotateCcw size={16} />}
                      title={
                        inspection.issues.some((issue) => issue.status !== 'resolved')
                          ? t('quality.inspection.action.closeIssuesFirst')
                          : t('quality.inspection.action.createReinspectionHint')
                      }
                      type="primary"
                      onClick={onReinspection}
                    >
                      {t('quality.inspection.action.reinspection')}
                    </Button>
                    {inspection.issues.some((issue) => issue.status !== 'resolved') ? (
                      <span>{t('quality.inspection.panel.reinspectionBlocked')}</span>
                    ) : null}
                  </>
                ) : (
                  <span>{t('quality.inspection.panel.reinspectionNotLatest')}</span>
                )}
              </div>
            )
          ) : null}

          <dl className="detail-list">
            <div>
              <dt>{t('quality.inspection.field.code')}</dt>
              <dd>{inspection.code}</dd>
            </div>
            <div>
              <dt>{t('quality.inspection.field.status')}</dt>
              <dd>{taskStatusLabel(inspection.status)}</dd>
            </div>
            <div>
              <dt>{t('quality.inspection.field.scheduledAt')}</dt>
              <dd>{formatScheduledAt(inspection.scheduled_at)}</dd>
            </div>
            <div>
              <dt>{t('quality.inspection.field.inspector')}</dt>
              <dd>{inspection.inspector_name}</dd>
            </div>
            <div>
              <dt>{t('quality.inspection.field.contract')}</dt>
              <dd>{inspection.purchase_contract_no}</dd>
            </div>
            <div>
              <dt>{t('quality.inspection.field.supplier')}</dt>
              <dd>{inspection.supplier_name}</dd>
            </div>
            <div>
              <dt>{t('quality.inspection.field.actualInspectedAt')}</dt>
              <dd>
                {inspection.inspected_at
                  ? formatDate(inspection.inspected_at)
                  : t('quality.inspection.panel.notStarted')}
              </dd>
            </div>
            <div>
              <dt>{t('quality.inspection.field.result')}</dt>
              <dd>{resultLabel(inspection.result)}</dd>
            </div>
            <div>
              <dt>{t('quality.inspection.field.taskNote')}</dt>
              <dd>{nullableText(inspection.issue_summary)}</dd>
            </div>
            <div>
              <dt>{t('quality.inspection.field.attachmentGroup')}</dt>
              <dd>{nullableText(inspection.attachment_group_id)}</dd>
            </div>
            {inspection.parent_inspection_id ? (
              <div>
                <dt>{t('quality.inspection.field.reinspectionSource')}</dt>
                <dd>
                  {t('quality.inspection.panel.reinspectionAttempt', {
                    no: inspection.reinspection_no ?? 1,
                  })}
                </dd>
              </div>
            ) : null}
            {inspection.cancel_reason ? (
              <div>
                <dt>{t('quality.inspection.field.cancelReason')}</dt>
                <dd>{inspection.cancel_reason}</dd>
              </div>
            ) : null}
          </dl>

          <div className="accessory-heading">
            <strong>{t('quality.inspection.panel.linesTitle')}</strong>
            <span>
              {t('quality.inspection.panel.linesCount', {
                count: inspection.lines.length,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('quality.inspection.table.product')}</th>
                <th>{t('quality.inspection.table.inspectedQuantity')}</th>
                <th>{t('quality.inspection.table.failedQuantity')}</th>
                <th>{t('quality.inspection.table.unit')}</th>
                <th>{t('quality.inspection.table.lineResult')}</th>
                <th>{t('quality.inspection.table.remark')}</th>
              </tr>
            </thead>
            <tbody>
              {inspection.lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.product_name}</td>
                  <td>{line.inspected_quantity}</td>
                  <td>{line.failed_quantity}</td>
                  <td>{line.unit}</td>
                  <td>{resultLabel(line.result)}</td>
                  <td>{nullableText(line.remark)}</td>
                </tr>
              ))}
              {inspection.lines.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={6}>
                    {t('quality.inspection.panel.linesEmpty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="accessory-heading">
            <strong>{t('quality.inspection.panel.issuesTitle')}</strong>
            <span>
              {t('quality.inspection.panel.issuesCount', {
                count: inspection.issues.length,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('quality.inspection.table.issueType')}</th>
                <th>{t('quality.inspection.table.severity')}</th>
                <th>{t('quality.inspection.table.description')}</th>
                <th>{t('quality.inspection.table.rectification')}</th>
                <th>{t('quality.inspection.table.issueStatus')}</th>
                <th>{t('quality.inspection.table.resolutionNote')}</th>
                <th>{t('quality.inspection.table.operation')}</th>
              </tr>
            </thead>
            <tbody>
              {inspection.issues.map((issue) => (
                <tr key={issue.id}>
                  <td>{issue.issue_type}</td>
                  <td>{issueSeverityLabel(issue.severity)}</td>
                  <td>{issue.description}</td>
                  <td>{nullableText(issue.corrective_action)}</td>
                  <td>{issueStatusLabel(issue.status)}</td>
                  <td>{nullableText(issue.resolution_note ?? null)}</td>
                  <td>
                    {issue.status === 'open' ? (
                      <Button
                        icon={<CheckCheck size={14} />}
                        size="small"
                        onClick={() => onResolveIssue(issue.id)}
                      >
                        {t('quality.inspection.action.closeIssue')}
                      </Button>
                    ) : (
                      <span>
                        {issue.resolved_by_name ?? t('quality.inspection.panel.issueClosed')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {inspection.issues.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={7}>
                    {t('quality.inspection.panel.issuesEmpty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="accessory-heading">
            <strong>{t('quality.inspection.panel.attachmentsTitle')}</strong>
            <span>
              {t('quality.inspection.panel.attachmentsCount', {
                count: inspection.attachments?.length ?? 0,
              })}
            </span>
          </div>
          <div className="quality-attachment-list">
            {(inspection.attachments ?? []).map((attachment) => (
              <a href={attachment.url} key={attachment.id} rel="noreferrer" target="_blank">
                <Paperclip size={14} />
                {attachment.filename}
                <Tag>
                  {attachment.category === 'resolution'
                    ? t('quality.inspection.panel.attachmentResolution')
                    : t('quality.inspection.panel.attachmentInspection')}
                </Tag>
              </a>
            ))}
            {(inspection.attachments?.length ?? 0) === 0 ? (
              <span>{t('quality.inspection.panel.attachmentsEmpty')}</span>
            ) : null}
          </div>

          <div className="accessory-heading">
            <strong>{t('quality.inspection.panel.eventsTitle')}</strong>
            <span>
              {t('quality.inspection.panel.eventsCount', {
                count: inspection.events?.length ?? 0,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('quality.inspection.field.performedAt')}</th>
                <th>{t('quality.inspection.table.action')}</th>
                <th>{t('quality.inspection.field.actor')}</th>
                <th>{t('quality.inspection.field.notes')}</th>
              </tr>
            </thead>
            <tbody>
              {(inspection.events ?? []).map((event) => (
                <tr key={event.id}>
                  <td>{formatScheduledAt(event.created_at)}</td>
                  <td>{qualityEventLabel(event.event_type)}</td>
                  <td>{event.actor_user_name}</td>
                  <td>{event.notes || t('common.notSet')}</td>
                </tr>
              ))}
              {(inspection.events?.length ?? 0) === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={4}>
                    {t('quality.inspection.panel.eventsEmpty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <ShieldCheck size={28} />
          <strong>{t('quality.inspection.panel.emptyTitle')}</strong>
          <span>{t('quality.inspection.panel.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
