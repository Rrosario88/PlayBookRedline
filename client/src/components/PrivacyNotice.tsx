interface PrivacyNoticeProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const PrivacyNotice = ({ onOpenPrivacy, onOpenTerms }: PrivacyNoticeProps) => (
  <section className="rounded-[28px] border border-slate-200/80 bg-[#f8f6f2] px-6 py-6 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Privacy notice</p>
    <p className="mt-3 text-sm leading-7 text-slate-600">
      Files stay transient by default. If enabled, Anthropic may process clause text for analysis.
    </p>
    <div className="mt-5 flex flex-wrap gap-3 text-sm">
      <button type="button" onClick={onOpenPrivacy} className="rounded-full bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-50">View privacy policy</button>
      <button type="button" onClick={onOpenTerms} className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950">View terms</button>
    </div>
  </section>
);
