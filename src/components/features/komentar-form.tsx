"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { tambahKomentar } from "@/actions/posts";
import type { ActionState } from "@/actions/auth";

/** Form tambah komentar pada satu postingan. */
export function KomentarForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(tambahKomentar, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Bersihkan input setelah berhasil kirim.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <div className="flex items-end gap-2">
        <textarea
          name="isi"
          rows={1}
          required
          minLength={1}
          maxLength={800}
          placeholder="Tulis komentar…"
          className="min-h-11 flex-1 resize-none rounded-2xl border border-outline px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Kirim komentar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
