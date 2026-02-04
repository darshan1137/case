import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Chatbot from "@/components/Chatbot";
import ScreenReader from "@/components/ScreenReader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CASE Platform - Civic Action & Service Excellence",
  description: "Modern civic infrastructure management platform. Capture, Assess, Serve, and Evolve city services with real-time reporting and resolution.",
  keywords: "civic issues, municipal corporation, city infrastructure, smart city, CASE platform, Built in Bharat",
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <head>
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                if (window.google && window.google.translate) {
                  new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,mr,gu,ta,te,bn,kn,ml,pa',
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                  }, 'google_translate_element');
                  try { window.dispatchEvent(new Event('googleTranslateLoaded')); } catch (e) {}
                }
              }
            `
          }}
        />
        <Script
          id="google-translate-script"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

          <AuthProvider>
            {children}
            <Chatbot />
            <ScreenReader />
          </AuthProvider>
      
      </body>
    </html>
  );
}
