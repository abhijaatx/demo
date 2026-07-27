import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supademo workspace",
  description: "Create clear, interactive demos from the workflows your team already knows."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" data-brand="blue">
      <body>{children}</body>
    </html>
  );
}
