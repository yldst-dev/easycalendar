import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyCalendar",
  description: "Chat-based schedule assistant powered by Groq & OpenRouter",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "일정을 쉽고 빠르게 채팅하듯이, EASYCALENDAR",
    description: "Chat-based schedule assistant powered by Groq & OpenRouter",
    siteName: "EasyCalendar",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "일정을 쉽고 빠르게 채팅하듯이, EASYCALENDAR",
    description: "Chat-based schedule assistant powered by Groq & OpenRouter",
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
      <body className="antialiased font-sans min-h-screen bg-background">
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border bg-background/95">
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
        </div>
      </body>
    </html>
  );
}
