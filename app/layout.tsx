import './globals.css'

export const metadata = {
  title: 'Hub de Agentes IA · SENAI Bahia',
  description: 'Portal interno de agentes de IA do SENAI Bahia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
