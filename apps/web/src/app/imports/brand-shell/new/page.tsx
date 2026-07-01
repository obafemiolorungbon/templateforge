import { api } from '../../../../lib/api';
import { ImportBackLink } from '../../import-back-link';
import { ImportWizard } from '../../import-wizard';

export default async function NewBrandShellImportPage() {
  const shells = await api.brandShells().catch(() => []);

  return (
    <div className="space-y-7">
      <ImportBackLink />

      <header className="max-w-4xl">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
            Add header and footer
          </div>
          <h1 className="mt-3 max-w-[13ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
            Save the parts every email reuses.
          </h1>
        </div>
        <p className="mt-5 max-w-[68ch] text-base leading-7 text-zinc-400">
          Upload screenshots or paste HTML for your existing header and footer.
          You will review the preview before these are reused in future imports.
        </p>
      </header>

      <ImportWizard kind="brand-shell" shells={shells} />
    </div>
  );
}
