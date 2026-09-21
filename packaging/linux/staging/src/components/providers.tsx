import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-fg)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
