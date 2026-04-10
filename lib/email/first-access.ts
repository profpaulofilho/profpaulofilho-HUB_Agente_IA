import { APP_URL } from '../config'

type FirstAccessEmailPayload = {
  to: string
  fullName: string
  temporaryPassword: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendFirstAccessEmail({
  to,
  fullName,
  temporaryPassword,
}: FirstAccessEmailPayload) {
  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!resendApiKey || !from) {
    console.warn(
      '[email] RESEND_API_KEY ou RESEND_FROM_EMAIL não configurados. E-mail não enviado.'
    )
    return { sent: false as const, provider: 'none' as const }
  }

  const safeName = escapeHtml(fullName)
  const safeEmail = escapeHtml(to)
  const safePassword = escapeHtml(temporaryPassword)
  const safeUrl = escapeHtml(APP_URL)

  const subject = 'Acesso criado - Hub de Agentes IA'
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin-bottom:8px">Olá, ${safeName}.</h2>
      <p>Seu acesso ao <strong>Hub de Agentes IA</strong> foi criado com sucesso.</p>
      <p><strong>Dados de acesso:</strong></p>
      <ul>
        <li><strong>E-mail:</strong> ${safeEmail}</li>
        <li><strong>Senha provisória:</strong> ${safePassword}</li>
      </ul>
      <p>No primeiro acesso, o sistema irá redirecionar automaticamente para a página de definição de nova senha.</p>
      <p>
        <a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">
          Acessar o sistema
        </a>
      </p>
      <p>Se você não solicitou este acesso, desconsidere esta mensagem.</p>
      <p style="margin-top:24px">Equipe SENAI Bahia</p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Falha ao enviar e-mail: ${body}`)
  }

  return { sent: true as const, provider: 'resend' as const }
}
