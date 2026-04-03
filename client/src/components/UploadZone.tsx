import { FileText, Upload } from 'lucide-react';

interface UploadZoneProps {
  label: string;
  fileName?: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  helperText?: string;
}

export const UploadZone = ({ label, fileName, disabled, onChange, helperText }: UploadZoneProps) => (
  <label className="flex min-h-48 cursor-pointer flex-col justify-between rounded-2xl border border-slate-300 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Upload PDF or DOCX</h3>
        </div>
        <div className="rounded-full bg-slate-100 p-3 text-slate-700">
          <Upload size={22} />
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-600">
        {helperText || 'Drag a file here or click to browse. Text will be extracted securely for clause-by-clause review.'}
      </p>
    </div>

    <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
      <div className="flex items-center gap-3 font-medium text-slate-900">
        <FileText size={18} />
        {fileName || 'No file selected'}
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
);
