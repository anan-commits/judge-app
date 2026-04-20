import Link from "next/link";
import RelationshipLog from "../../components/RelationshipLog";

export default function LogPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href="/" className="text-xs font-semibold tracking-[0.18em] text-zinc-900">
            JUDGE CODE
          </Link>
          <span className="text-[11px] font-medium tracking-wide text-zinc-500">関係ログ</span>
        </div>
      </header>
      <RelationshipLog />
    </main>
  );
}
