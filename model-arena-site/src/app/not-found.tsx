import Link from "next/link";

/** 404 genérico: sem detalhes internos, só navegação segura. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-14 text-center">
      <p className="text-sm font-extrabold tracking-[0.25em] text-indigo-600 uppercase">
        Erro 404
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
        ringue não encontrado
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600">
        Esta página saiu da arena. Volte ao início para escolher um duelo.
      </p>
      <Link
        href="/"
        className="btn-primary mt-6 rounded-xl px-5 py-2.5 text-sm"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
