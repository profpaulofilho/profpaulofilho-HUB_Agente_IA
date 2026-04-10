export async function sendFirstAccessEmail(params: {
  email: string
  full_name: string
  tempPassword: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ''

  if (!apiKey || !from) {
    return { skipped: true }
  }

  const body = {
    from,
    to: [params.email],
    subject: 'Acesso ao Hub de Agentes IA',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Olá, ${escapeHtml(params.full_name || params.email)}.</h2>
        <p>Seu acesso ao Hub de Agentes IA foi criado.</p>
        <p><strong>E-mail:</strong> ${escapeHtml(params.email)}<br/>
        <strong>Senha provisória:</strong> ${escapeHtml(params.tempPassword)}</p>
        <p>No primeiro acesso, o sistema solicitará a definição de uma nova senha.</p>
        ${appUrl ? `<p><a href="${appUrl}">Acessar o sistema</a></p>` : ''}
        <p>Atenciosamente,<br/>Equipe SENAI</p>
      </div>
    `,
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Falha ao enviar e-mail: ${text}`)
  }

  return res.json()
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
