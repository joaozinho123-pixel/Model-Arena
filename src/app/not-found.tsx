import Link from "next/link";

/** 404: página sóbria com caminho de volta. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-14 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Erro 404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        O endereço acessado não existe. Volte ao início para escolher um
        duelo.
      </p>
      <Link href="/" className="btn-primary mt-6 px-5 py-2.5 text-sm">
        Voltar ao início
      </Link>
    </div>
  );
}
