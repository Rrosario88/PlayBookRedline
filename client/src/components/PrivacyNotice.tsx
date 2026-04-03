interface PrivacyNoticeProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const PrivacyNotice = ({ onOpenPrivacy, onOpenTerms }: PrivacyNoticeProps) => (
  <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Privacy notice</p>
    <p className="mt-2 text-sm leading-7 text-slate-700">
      Uploaded documents are processed in memory by default and are not intentionally retained server-side unless you explicitly save a matter. If Anthropic is enabled, clause and playbook text may be sent to Anthropic for inference.
    </p>
    <div className="mt-3 flex gap-3 text-sm">
      <button type="button" onClick={onOpenPrivacy} className="rounded-full bg-white px-4 py-2 font-semibold text-slate-900">View privacy policy</button>
      <button type="button" onClick={onOpenTerms} className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700">View terms</button>
    </div>
  </section>
);
