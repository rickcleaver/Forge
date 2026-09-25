import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Discard",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-surface text-fg">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted">{body}</DialogDescription>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" variant="secondary" onClick={onClose}>
            Keep
          </Button>
          <Button className="flex-1" variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
