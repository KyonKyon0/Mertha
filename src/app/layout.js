import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mertha | Too Good To Be Waste",
  description: "Selamatkan Makanan, Selamatkan Bumi",
};

import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col mx-auto max-w-md bg-white shadow-xl relative overflow-x-hidden">
        {children}
        {/* UI Enhancer for interactions */}
        <Script src="/assets/js/ui-enhancer.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
