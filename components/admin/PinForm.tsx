import { adminLoginAction } from "@/app/actions";

export function PinForm({ hasError }: { hasError: boolean }) {
  return (
    <form action={adminLoginAction} className="mx-auto mt-24 max-w-xs space-y-3 px-4">
      <h1 className="text-center font-display text-4xl tracking-wide text-accent-bright">
        Bookmaker-adgang
      </h1>
      <input
        type="password"
        inputMode="numeric"
        name="pin"
        placeholder="PIN"
        autoFocus
        className="w-full rounded-lg border border-felt-600 bg-felt-800 px-4 py-3 text-center text-2xl tracking-widest text-neutral-100 focus:border-accent focus:outline-none"
      />
      {hasError && <p className="text-center text-sm text-accent-bright">Forkert PIN.</p>}
      <button
        type="submit"
        className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-white active:bg-accent-dim"
      >
        Lås op
      </button>
    </form>
  );
}
