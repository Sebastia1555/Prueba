import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-sm">
      <p className="text-[15px] leading-relaxed text-[color:var(--ap-ink-2)]">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="ap-btn ap-btn-sm ap-btn-neutral">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`ap-btn ap-btn-sm ${danger ? 'ap-btn-danger' : 'ap-btn-primary'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
