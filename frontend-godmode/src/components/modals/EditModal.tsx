// components/modals/EditModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function EditModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children 
}: EditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="space-y-4 pb-6">
          <DialogTitle className="text-2xl font-sora text-zinc-100">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-zinc-400 font-poppins text-base">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}