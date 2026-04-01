import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrimeFit - Fitness Center",
  description: "Transform your fitness journey with PrimeFit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
