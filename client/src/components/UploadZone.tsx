import { FileText, Upload, X } from 'lucide-react';

interface UploadZoneProps {
  label: string;
  fileName?: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  helperText?: string;
}

export const UploadZone = ({ label, fileName, disabled, onChange, helperText }: UploadZoneProps) => (
  <div className="relative">
    <label className="group relative flex min-h-[240px] cursor-pointer flex-col justify-between rounded-[30px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_14px_45px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
            <h3 className="text-[24px] font-semibold tracking-tight text-slate-950">Add a PDF or DOCX</h3>
          </div>
          <div className="rounded-2xl bg-[#f7f4ee] p-3 text-slate-700 transition group-hover:bg-slate-100">
            <Upload size={20} />
          </div>
        </div>

        {!fileName ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#faf8f5] px-5 py-5">
            <p className="text-sm leading-7 text-slate-600">
              {helperText || 'Drop a file here or browse.'}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-[24px] bg-slate-950 px-5 py-4 text-white">
        <div className="flex items-center gap-3 text-sm font-medium text-white/90">
          <FileText size={18} className="shrink-0" />
          <span className="truncate">{fileName || '–'}</span>
        </div>
      </div>

      <input
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        disabled={disabled}
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
    </label>

    {fileName && !disabled ? (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(null); }}
        className="absolute -right-2 -top-2 rounded-full bg-white p-2.5 text-slate-400 shadow-lg border border-slate-200 transition hover:bg-rose-50 hover:text-rose-500 z-20"
        title="Remove file"
      >
        <X size={16} />
      </button>
    ) : null}
  </div>
);
