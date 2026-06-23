import { api } from '../../lib/api';
import { BrandWorkspaceForm } from './brand-workspace-form';

export default async function BrandPage() {
  const workspace = await api.brand();

  return (
    <div className="space-y-7">
      <header className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
            Brand assets
          </div>
          <h1 className="mt-3 max-w-[13ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
            One brand source for every template.
          </h1>
        </div>
        <p className="self-end text-sm leading-7 text-zinc-400">
          Configure colors, assets, tone, and reusable header/footer components
          once. Template generation will retrieve these defaults instead of
          inventing brand chrome every time.
        </p>
      </header>

      <BrandWorkspaceForm initialWorkspace={workspace} />
    </div>
  );
}
