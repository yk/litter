"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { useState } from "react";
import { SessionProvider } from "next-auth/react"

export default function Providers({ children, session }) {
  const [client] = useState(() => new QueryClient());

  return (
    <SessionProvider session={session}>
    <QueryClientProvider client={client}>
      <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
    </QueryClientProvider>
    </SessionProvider>
  );
}
