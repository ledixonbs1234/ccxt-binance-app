// File: app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans"; // Import trực tiếp từ geist/font
import { GeistMono } from "geist/font/mono"; // Import trực tiếp từ geist/font
import "./globals.css";
import { ThemeProvider } from "./providers"; // Import ThemeProvider đã tạo

export const metadata: Metadata = {
  // Cập nhật metadata cho phù hợp hơn
  title: "Binance Sandbox Trading App",
  description: "Giao diện giao dịch giả lập trên Binance Sandbox",
  // Thêm viewport cho responsive
  viewport: "width=device-width, initial-scale=1",
  // Thêm icon nếu có
  // icons: {
  //   icon: "/favicon.ico",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Thêm suppressHydrationWarning khi dùng next-themes với attribute="class"
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`} // Sử dụng font-sans làm mặc định
      >
        {/* Bọc toàn bộ nội dung bằng ThemeProvider */}
        <ThemeProvider>
            {/* 
              Sử dụng flex-col và min-h-screen để đảm bảo layout chiếm toàn bộ chiều cao
              và đẩy footer (nếu có) xuống dưới.
            */}
            <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-150">
              {/* Header (Navbar) - Component riêng nếu cần */}
              {/* <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="container mx-auto flex h-16 items-center justify-between p-4">
                  <span className="font-bold">Trading App</span>
                  {/* Thêm nút chuyển đổi theme, nav links... */}
              {/*</div>
              </header> */}

              {/* Phần nội dung chính */}
              <main className="flex-grow">
                  {/* Children sẽ được render ở đây */}
                  {children}
              </main>

              {/* Footer - Component riêng nếu cần */}
              <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 py-4">
                <div className="container mx-auto text-center text-xs text-gray-500 dark:text-gray-400">
                  © {new Date().getFullYear()} Binance Sandbox Trading. Lưu ý: Đây là môi trường giả lập.
                </div>
              </footer>
            </div>
        </ThemeProvider>
      </body>
    </html>
  );
}