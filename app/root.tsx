import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Toaster } from "sonner";

import type { Route } from "./+types/root";
import { ThemeProvider, useTheme } from "./core/theme/ThemeProvider";
import { QueryProvider } from "./core/query/QueryProvider";
import { AuthGuard } from "./core/auth";
import "./app.css";

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function AppContent() {
  const { theme } = useTheme();
  /* TODO: Standalone custome CSS file for toast? */
  /* TODO: Popconfirm to replace browser native confirm. */
  return (
    <AuthGuard>
      <Outlet />
      <Toaster
        theme={theme}
        position="bottom-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '2px'
          },
        }}
      />
    </AuthGuard>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
