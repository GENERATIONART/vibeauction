import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Vibe Auction',
  description: 'Auction site prototype built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
