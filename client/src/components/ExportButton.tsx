import { Download } from 'lucide-react';

interface ExportButtonProps {
  disabled?: boolean;
  onClick: () => Promise<void> | void;
}

export const ExportButton = ({ disabled, onClick }: ExportButtonProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => void onClick()}
    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
  >
    <Download size={16} />
    Export DOCX
  </button>
);
