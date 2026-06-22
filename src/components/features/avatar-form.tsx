"use client";

import { useActionState, useRef } from "react";
import { Camera } from "lucide-react";
import { simpanAvatar } from "@/actions/profile";
import type { ActionState } from "@/actions/auth";

export function AvatarForm() {
  const [state, action] = useActionState<ActionState, FormData>(simpanAvatar, null);
  const ref = useRef<HTMLFormElement>(null);

  return (
    <>
      <form
        ref={ref}
        action={action}
        className="absolute -bottom-1 -right-1"
      >
        <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-white active:scale-90">
          <Camera size={13} className="text-muted" />
          <input
            type="file"
            name="avatar"
            accept="image/*"
            className="hidden"
            onChange={() => ref.current?.requestSubmit()}
          />
        </label>
      </form>
      {state?.error && (
        <p className="absolute -bottom-6 left-0 text-[10px] text-red-600 whitespace-nowrap">
          {state.error}
        </p>
      )}
    </>
  );
}
