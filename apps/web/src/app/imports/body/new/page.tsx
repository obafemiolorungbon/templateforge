import { api } from '../../../../lib/api';
import { ImportBackLink } from '../../import-back-link';
import { ImportWizard } from '../../import-wizard';

export default async function NewBodyImportPage() {
  const shells = await api.brandShells().catch(() => []);

  return (
    <div className="space-y-7">
      <ImportBackLink />

      <header className="max-w-4xl">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
            Import Email Body
          </div>
          <h1 className="mt-3 max-w-[13ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
            Convert an existing email into editable MJML.
          </h1>
        </div>
        <p className="mt-5 max-w-[68ch] text-base leading-7 text-zinc-400">
          Paste HTML, attach a screenshot, and review the reconstructed MJML
          before it enters your template library.
        </p>
      </header>

      <ImportWizard kind="body" shells={shells} />
    </div>
  );
}
