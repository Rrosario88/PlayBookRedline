import type { LegalDoc } from '../types';

interface LegalModalProps {
  doc: LegalDoc | null;
  onClose: () => void;
}

export const LegalModal = ({ doc, onClose }: LegalModalProps) => {
  if (!doc) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6">
      <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-2xl font-semibold text-slate-950">{doc.title}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">Close</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">{doc.content}</pre>
        </div>
      </div>
    </div>
  );
};
