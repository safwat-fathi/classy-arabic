import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800", "900"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title:
    "تِجارتك بوت | منصة البيع الذكي وأتمتة أوردرات فيسبوك، إنستجرام وواتساب",
  description:
    "حوّل شات السوشيال ميديا لمتجر إلكتروني متكامل يبيع 24/7. تصفح الكتالوج داخل الشات، رد فوري بالذكاء الاصطناعي يفهم العامية والفرانكو، وتفريغ تلقائي لبيانات الشحن بدون أخطاء. جرب أول 30 أوردر مجاناً!",
  openGraph: {
    title:
      "تِجارتك بوت | متجرك شغال ويقفل الأوردرات في شات السوشيال ميديا 24/7",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
