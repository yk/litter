"use client";

import React from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function Login() {
  const { status } = useSession();
  const { clickAction, buttonText } = {
    loading: {
      clickAction: () => {},
      buttonText: "Loading...",
    },
    authenticated: {
      clickAction: () => signOut({callbackUrl: "/"}),
      buttonText: "Sign out",
    },
    unauthenticated: {
      clickAction: () => signIn("github", { callbackUrl: "/" }),
      buttonText: "Sign in with GitHub",
    },
  }[status];
  return (
    <main className="mx-8 my-8 flex flex-col gap-4 relative">
      <Link href="/" className="w-8 h-8 absolute top-0 left-0">
        <ArrowLeftIcon />
      </Link>
      <div className="flex flex-row justify-center items-center">
        <button
          onClick={clickAction}
          className="bg-black text-white px-8 py-4 border border-1 border-gray-500 rounded-md"
        >
        {buttonText}
        </button>
      </div>
    </main>
  );
}
