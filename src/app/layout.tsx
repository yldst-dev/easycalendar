import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyCalendar",
  description: "Chat-based schedule assistant powered by OpenRouter",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

const PRIVACY_POLICY_URL = process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL?.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <div className="min-h-screen pb-24">{children}</div>
        <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 text-xs text-muted-foreground">
            <span>© 2025 EASYCALENDAR</span>
            <nav className="flex items-center gap-4">
              <a
                href="https://github.com/yldst-dev/easycalendar"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                GitHub
              </a>
              {PRIVACY_POLICY_URL ? (
                <a
                  href={PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  개인정보처리방침
                </a>
              ) : (
                <span className="italic opacity-70">Privacy URL 미설정</span>
              )}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
