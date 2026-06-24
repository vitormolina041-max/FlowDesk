import { ChangeEvent, DragEvent, ReactNode, useMemo, useRef, useState } from 'react'

type CardType = 'História' | 'Bug' | 'Melhoria' | 'Tarefa técnica' | 'Investigação' | 'Débito técnico'

type ImageItem = {
  id: string
  name: string
  src: string
  caption: string
}

type FormData = {
  type: CardType
  title: string
  context: string
  objective: string
  currentBehavior: string
  expectedBehavior: string
  scope: string
  rules: string
  reproduction: string
  environment: string
  technicalNotes: string
}

type CardTemplate = {
  context: string
  objective: string
  currentBehavior: string
  expectedBehavior: string
  scope: string
  rules: string
  reproduction: string
  environment: string
  technicalNotes: string
  criteria: string[]
}

type QualityItem = {
  label: string
  complete: boolean
  points: number
  hint: string
}

type JiraConfig = {
  siteUrl: string
  projectKey: string
  issueType: string
  webhookUrl: string
}

const cardTypes: { name: CardType; icon: string; hint: string }[] = [
  { name: 'História', icon: '✦', hint: 'Nova necessidade do usuário' },
  { name: 'Bug', icon: '⚠', hint: 'Comportamento inesperado' },
  { name: 'Melhoria', icon: '↗', hint: 'Evolução de algo existente' },
  { name: 'Tarefa técnica', icon: '</>', hint: 'Implementação interna' },
  { name: 'Investigação', icon: '⌕', hint: 'Descoberta e análise' },
  { name: 'Débito técnico', icon: '◇', hint: 'Qualidade e manutenção' },
]

const initialForm: FormData = {
  type: 'História',
  title: '',
  context: '',
  objective: '',
  currentBehavior: '',
  expectedBehavior: '',
  scope: '',
  rules: '',
  reproduction: '',
  environment: '',
  technicalNotes: '',
}

const defaultCriteria = [
  'O fluxo principal deve funcionar conforme o comportamento esperado.',
  'Mensagens de erro devem orientar o usuário de forma clara.',
  'A implementação não deve causar regressão nos fluxos relacionados.',
]

const initialJiraConfig: JiraConfig = {
  siteUrl: '',
  projectKey: '',
  issueType: 'Task',
  webhookUrl: '',
}

const cardTemplates: Record<CardType, CardTemplate> = {
  História: {
    context: 'Como [persona], preciso de [necessidade] para [valor esperado].\n\nContexto de negócio:\n- Quem é impactado?\n- Qual problema ou oportunidade originou a demanda?',
    objective: 'Entregar valor ao usuário permitindo que ele realize a ação esperada com clareza e segurança.',
    currentBehavior: 'Hoje, o usuário ainda não possui uma forma adequada de resolver essa necessidade.',
    expectedBehavior: 'O usuário deve conseguir executar o fluxo principal e receber retorno claro de sucesso, erro ou pendência.',
    scope: 'Dentro do escopo:\n- Fluxo principal da necessidade descrita.\n- Validações essenciais para uso.\n\nFora do escopo:\n- Mudanças em fluxos não relacionados.',
    rules: 'Definir permissões, validações, exceções e mensagens obrigatórias.',
    reproduction: '',
    environment: '',
    technicalNotes: 'Mapear dependências, integrações e impactos em fluxos existentes.',
    criteria: [
      'O usuário consegue realizar o fluxo principal sem apoio externo.',
      'O sistema apresenta retorno claro para sucesso, erro ou pendência.',
      'As regras de negócio definidas são respeitadas.',
    ],
  },
  Bug: {
    context: 'Foi identificado um comportamento inesperado que impacta o uso do sistema.\n\nImpacto observado:\n- Quem é afetado?\n- Em qual fluxo ocorre?\n- Qual consequência para o usuário ou operação?',
    objective: 'Corrigir o comportamento para que o fluxo volte a funcionar conforme esperado, sem causar regressões.',
    currentBehavior: 'Hoje, ao executar o fluxo informado, o sistema apresenta comportamento incorreto.',
    expectedBehavior: 'O sistema deve executar o fluxo corretamente ou apresentar uma mensagem clara quando houver impedimento.',
    scope: 'Dentro do escopo:\n- Correção do cenário informado.\n- Validação do fluxo afetado.\n\nFora do escopo:\n- Melhorias não relacionadas ao bug.',
    rules: 'Confirmar quais regras deveriam permitir, bloquear ou validar a ação.',
    reproduction: '1. Acessar o ambiente afetado.\n2. Executar o fluxo descrito.\n3. Observar o comportamento atual.\n4. Comparar com o comportamento esperado.',
    environment: 'Ambiente:\nNavegador/dispositivo:\nUsuário/perfil:\nData aproximada:',
    technicalNotes: 'Verificar logs, integrações, permissões e possíveis impactos em fluxos relacionados.',
    criteria: [
      'O cenário relatado é corrigido e pode ser validado pelo QA.',
      'O sistema exibe mensagem clara quando a ação não puder ser concluída.',
      'A correção não causa regressão nos fluxos relacionados.',
    ],
  },
  Melhoria: {
    context: 'Existe uma oportunidade de melhorar um fluxo já existente.\n\nProblema atual:\n- O que gera atrito?\n- Quem é impactado?\n- Qual ganho esperamos obter?',
    objective: 'Melhorar a experiência, reduzir esforço operacional e tornar o fluxo mais claro para o usuário.',
    currentBehavior: 'Hoje, o fluxo funciona, mas apresenta pontos de atrito ou baixa clareza.',
    expectedBehavior: 'O fluxo deve ficar mais simples, previsível e fácil de validar.',
    scope: 'Dentro do escopo:\n- Ajustes no fluxo existente.\n- Melhorias diretamente ligadas ao problema descrito.\n\nFora do escopo:\n- Redesenho completo sem necessidade confirmada.',
    rules: 'Confirmar regras que não podem ser alteradas pela melhoria.',
    reproduction: '',
    environment: '',
    technicalNotes: 'Avaliar impacto visual, operacional e técnico antes da implementação.',
    criteria: [
      'O usuário entende melhor como executar o fluxo.',
      'A melhoria reduz esforço, dúvida ou retrabalho no cenário informado.',
      'Fluxos relacionados continuam funcionando sem regressão.',
    ],
  },
  'Tarefa técnica': {
    context: 'Existe uma necessidade técnica necessária para sustentar evolução, correção ou manutenção do produto.',
    objective: 'Executar a atividade técnica com baixo risco e impacto controlado.',
    currentBehavior: 'Hoje, a base técnica possui uma limitação, pendência ou necessidade operacional.',
    expectedBehavior: 'A solução técnica deve ser implementada sem alterar comportamentos de negócio não previstos.',
    scope: 'Dentro do escopo:\n- Alteração técnica descrita.\n- Validação dos pontos impactados.\n\nFora do escopo:\n- Mudanças funcionais não relacionadas.',
    rules: 'Não alterar regras de negócio sem validação do PO.',
    reproduction: '',
    environment: '',
    technicalNotes: 'Descrever dependências, riscos, plano de validação e possível plano de rollback.',
    criteria: [
      'A alteração técnica é concluída conforme objetivo descrito.',
      'Não há regressão funcional nos fluxos impactados.',
      'Riscos e dependências são documentados.',
    ],
  },
  Investigação: {
    context: 'Há uma dúvida, comportamento ou hipótese que precisa ser investigada antes de definir a solução.',
    objective: 'Entender causa, impacto e alternativas para orientar a próxima decisão.',
    currentBehavior: 'Ainda não há diagnóstico suficiente para definir implementação.',
    expectedBehavior: 'A investigação deve produzir uma conclusão clara, com evidências e próximos passos recomendados.',
    scope: 'Dentro do escopo:\n- Levantar evidências.\n- Analisar causa provável.\n- Recomendar próximos passos.\n\nFora do escopo:\n- Implementar solução definitiva sem aprovação.',
    rules: 'Registrar regras ou hipóteses que precisam ser confirmadas.',
    reproduction: '',
    environment: '',
    technicalNotes: 'Listar logs, bases, integrações, hipóteses e pessoas consultadas.',
    criteria: [
      'A causa ou hipótese principal é documentada.',
      'Evidências analisadas são registradas no card.',
      'Próximos passos são recomendados com clareza.',
    ],
  },
  'Débito técnico': {
    context: 'Foi identificado um ponto técnico que aumenta custo, risco ou dificuldade de manutenção.',
    objective: 'Reduzir risco técnico, melhorar manutenibilidade e sustentar futuras evoluções.',
    currentBehavior: 'Hoje, a solução atual gera complexidade, fragilidade ou retrabalho técnico.',
    expectedBehavior: 'A base deve ficar mais simples, confiável e preparada para manutenção ou evolução.',
    scope: 'Dentro do escopo:\n- Ajuste técnico descrito.\n- Validação dos fluxos afetados.\n\nFora do escopo:\n- Mudanças funcionais sem relação com o débito.',
    rules: 'Preservar comportamento funcional existente, salvo exceções aprovadas.',
    reproduction: '',
    environment: '',
    technicalNotes: 'Documentar risco atual, proposta técnica, impacto esperado e plano de validação.',
    criteria: [
      'O débito técnico descrito é reduzido ou removido.',
      'O comportamento funcional existente é preservado.',
      'A solução melhora manutenção, confiabilidade ou clareza técnica.',
    ],
  },
}

function Icon({ children }: { children: ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>
}

function App() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [criteria, setCriteria] = useState<string[]>([''])
  const [images, setImages] = useState<ImageItem[]>([])
  const [activeStep, setActiveStep] = useState(1)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [jiraConfigOpen, setJiraConfigOpen] = useState(false)
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>(initialJiraConfig)
  const [jiraStatus, setJiraStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const qualityItems = useMemo<QualityItem[]>(() => {
    const filledCriteria = criteria.filter((item) => item.trim())

    return [
      {
        label: 'Título objetivo',
        complete: form.title.trim().length >= 12,
        points: 15,
        hint: 'Use ação + objeto + resultado esperado.',
      },
      {
        label: 'Contexto claro',
        complete: form.context.trim().length >= 40,
        points: 20,
        hint: 'Explique origem, usuário afetado e motivo da demanda.',
      },
      {
        label: 'Objetivo de negócio',
        complete: form.objective.trim().length >= 30,
        points: 15,
        hint: 'Declare o resultado esperado para usuário ou operação.',
      },
      {
        label: 'Comportamento esperado',
        complete: form.expectedBehavior.trim().length >= 30,
        points: 15,
        hint: 'Descreva o que deve acontecer depois da entrega.',
      },
      {
        label: 'Critérios de aceite',
        complete: filledCriteria.length >= 2,
        points: 15,
        hint: 'Inclua ao menos dois itens validáveis pelo QA.',
      },
      {
        label: 'Escopo e regras',
        complete: Boolean(form.scope.trim() || form.rules.trim()),
        points: 10,
        hint: 'Defina limites, validações ou regras envolvidas.',
      },
      {
        label: form.type === 'Bug' ? 'Reprodução e ambiente' : 'Riscos ou evidências',
        complete: form.type === 'Bug'
          ? Boolean(form.reproduction.trim() && form.environment.trim())
          : Boolean(form.technicalNotes.trim() || images.length),
        points: 10,
        hint: form.type === 'Bug'
          ? 'Informe passos e ambiente para o QA reproduzir.'
          : 'Registre riscos, dependências ou evidências úteis.',
      },
    ]
  }, [criteria, form, images.length])

  const qualityScore = useMemo(() => {
    const total = qualityItems.reduce((sum, item) => sum + item.points, 0)
    const completed = qualityItems.filter((item) => item.complete).reduce((sum, item) => sum + item.points, 0)
    return Math.round((completed / total) * 100)
  }, [qualityItems])

  const refinementQuestions = useMemo(() => {
    const questions: string[] = []
    const filledCriteria = criteria.filter((item) => item.trim())

    if (!form.context.trim()) questions.push('Qual problema, necessidade ou oportunidade originou essa demanda?')
    if (!form.objective.trim()) questions.push('Qual resultado de negócio ou usuário esperamos alcançar?')
    if (!form.expectedBehavior.trim()) questions.push('O que deve acontecer para considerarmos a entrega correta?')
    if (!form.scope.trim()) questions.push('O que está dentro e fora do escopo desta demanda?')
    if (!form.rules.trim()) questions.push('Existe alguma regra de negócio, permissão ou validação obrigatória?')
    if (filledCriteria.length < 2) questions.push('Quais critérios objetivos o QA deve validar?')
    if (form.type === 'Bug' && !form.reproduction.trim()) questions.push('Quais passos reproduzem o problema?')
    if (form.type === 'Bug' && !form.environment.trim()) questions.push('Em qual ambiente, navegador, dispositivo ou perfil o problema ocorre?')
    if (!form.technicalNotes.trim() && !images.length) questions.push('Existe evidência, risco técnico, dependência ou print relevante?')

    return questions.slice(0, 5)
  }, [criteria, form, images.length])

  const isBug = form.type === 'Bug'
  const isInvestigation = form.type === 'Investigação'

  function updateField(field: keyof FormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setGenerated(false)
  }

  function updateJiraConfig(field: keyof JiraConfig, value: string) {
    setJiraConfig((current) => ({ ...current, [field]: value }))
    setJiraStatus('')
  }

  function applyTemplate() {
    const template = cardTemplates[form.type]

    setForm((current) => ({
      ...current,
      context: current.context || template.context,
      objective: current.objective || template.objective,
      currentBehavior: current.currentBehavior || template.currentBehavior,
      expectedBehavior: current.expectedBehavior || template.expectedBehavior,
      scope: current.scope || template.scope,
      rules: current.rules || template.rules,
      reproduction: current.reproduction || template.reproduction,
      environment: current.environment || template.environment,
      technicalNotes: current.technicalNotes || template.technicalNotes,
    }))
    setCriteria((current) => current.some((item) => item.trim()) ? current : template.criteria)
    setGenerated(false)
  }

  function addCriterion() {
    setCriteria((current) => [...current, ''])
  }

  function updateCriterion(index: number, value: string) {
    setCriteria((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
    setGenerated(false)
  }

  function removeCriterion(index: number) {
    setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function processFiles(files: FileList | File[]) {
    Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => {
          setImages((current) => [...current, {
            id: crypto.randomUUID(),
            name: file.name,
            src: String(reader.result),
            caption: '',
          }])
        }
        reader.readAsDataURL(file)
      })
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    processFiles(event.dataTransfer.files)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) processFiles(event.target.files)
    event.target.value = ''
  }

  function improveAndGenerate() {
    const cleanedCriteria = criteria.map((item) => item.trim()).filter(Boolean)
    setCriteria(cleanedCriteria.length ? cleanedCriteria : defaultCriteria)
    setGenerated(true)
    setActiveStep(4)
    window.setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  function plainText() {
    const accepted = criteria.filter(Boolean).map((item) => `☐ ${item}`).join('\n')
    const evidence = images.map((image, index) => `[Print ${index + 1}] ${image.caption || image.name}`).join('\n')
    return [
      form.title || `Novo card — ${form.type}`,
      '',
      'CONTEXTO',
      form.context || 'Não informado.',
      '',
      'OBJETIVO',
      form.objective || 'Não informado.',
      '',
      isBug ? 'COMPORTAMENTO ATUAL' : 'CENÁRIO ATUAL',
      form.currentBehavior || 'Não informado.',
      '',
      isInvestigation ? 'RESULTADO DA INVESTIGAÇÃO' : 'COMPORTAMENTO ESPERADO',
      form.expectedBehavior || 'Não informado.',
      form.scope ? `\nESCOPO\n${form.scope}` : '',
      form.rules ? `\nREGRAS DE NEGÓCIO\n${form.rules}` : '',
      isBug && form.reproduction ? `\nCOMO REPRODUZIR\n${form.reproduction}` : '',
      isBug && form.environment ? `\nAMBIENTE\n${form.environment}` : '',
      '',
      'CRITÉRIOS DE ACEITE',
      accepted || '☐ Critérios a definir.',
      form.technicalNotes ? `\nOBSERVAÇÕES TÉCNICAS\n${form.technicalNotes}` : '',
      evidence ? `\nEVIDÊNCIAS VISUAIS\n${evidence}` : '',
    ].filter((line) => line !== '').join('\n')
  }

  async function copyCard() {
    try {
      if (previewRef.current && window.ClipboardItem) {
        const html = previewRef.current.innerHTML
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText()], { type: 'text/plain' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(plainText())
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      await navigator.clipboard.writeText(plainText())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    }
  }

  function jiraPayload() {
    return {
      summary: form.title || `Novo card - ${form.type}`,
      description: plainText(),
      projectKey: jiraConfig.projectKey,
      issueType: jiraConfig.issueType || 'Task',
      cardType: form.type,
      siteUrl: jiraConfig.siteUrl,
    }
  }

  async function copyJiraPayload() {
    await navigator.clipboard.writeText(JSON.stringify(jiraPayload(), null, 2))
    setJiraStatus('Payload do Jira copiado.')
  }

  async function sendToJiraIntegration() {
    if (!jiraConfig.webhookUrl.trim()) {
      setJiraStatus('Cole a URL do Webhook do Jira Automation.')
      return
    }

    try {
      const response = await fetch(jiraConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jiraPayload()),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setJiraStatus('Card enviado para o webhook do Jira Automation.')
    } catch {
      setJiraStatus('Não foi possível enviar. Verifique a URL do webhook e a regra no Jira.')
    }
  }

  function imageToPngBlob(src: string) {
    return new Promise<Blob>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const context = canvas.getContext('2d')

        if (!context) {
          reject(new Error('Não foi possível preparar a imagem.'))
          return
        }

        context.drawImage(image, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Não foi possível converter a imagem para PNG.'))
        }, 'image/png')
      }
      image.onerror = () => reject(new Error('Não foi possível carregar a imagem.'))
      image.src = src
    })
  }

  async function copyImage(image: ImageItem) {
    const png = await imageToPngBlob(image.src)
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': png }),
    ])
    setCopiedImageId(image.id)
    window.setTimeout(() => setCopiedImageId(null), 2200)
  }

  function reset() {
    setForm(initialForm)
    setCriteria([''])
    setImages([])
    setGenerated(false)
    setActiveStep(1)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><span></span><span></span><span></span></div>
          <span>FlowDesk</span>
        </div>
        <div className="header-actions">
          <span className="autosave"><span className="status-dot"></span> Salvo automaticamente</span>
          <button className="jira-settings-button" onClick={() => setJiraConfigOpen(true)}>Jira</button>
          <button className="icon-button" title="Ajuda">?</button>
          <div className="avatar">PO</div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <span className="eyebrow"><Icon>✦</Icon> Assistente de cards</span>
            <h1>Transforme ideias em<br/><span>cards claros.</span></h1>
            <p>Responda perguntas simples. O FlowDesk estrutura, revisa e prepara tudo para o seu JIRA.</p>
          </div>
          <div className="progress-card">
            <div>
              <span>Qualidade do briefing</span>
              <strong>{qualityScore}%</strong>
            </div>
            <div className="progress-track"><span style={{ width: `${qualityScore}%` }}></span></div>
            <small>{qualityScore < 50 ? 'Preencha os campos principais para melhorar o card.' : qualityScore < 85 ? 'Bom caminho. Faltam poucos detalhes.' : 'Briefing pronto para refinamento.'}</small>
          </div>
        </section>

        <nav className="steps" aria-label="Etapas">
          {['Tipo de card', 'Contexto', 'Detalhes', 'Revisar'].map((label, index) => {
            const step = index + 1
            return (
              <button key={label} className={activeStep === step ? 'active' : activeStep > step ? 'done' : ''} onClick={() => setActiveStep(step)}>
                <span>{activeStep > step ? '✓' : step}</span>{label}
              </button>
            )
          })}
        </nav>

        <div className="workspace">
          <section className="form-panel">
            {activeStep === 1 && (
              <div className="panel-content">
                <div className="section-heading">
                  <span>01</span>
                  <div><h2>O que você precisa criar?</h2><p>Escolha o tipo de demanda. As perguntas serão adaptadas ao contexto.</p></div>
                </div>
                <div className="type-grid">
                  {cardTypes.map((type) => (
                    <button key={type.name} className={`type-card ${form.type === type.name ? 'selected' : ''}`} onClick={() => updateField('type', type.name)}>
                      <span className="type-icon">{type.icon}</span>
                      <span><strong>{type.name}</strong><small>{type.hint}</small></span>
                      <i>{form.type === type.name ? '✓' : ''}</i>
                    </button>
                  ))}
                </div>
                <div className="template-card">
                  <div>
                    <strong>Template recomendado</strong>
                    <span>Preenche campos e critérios com uma estrutura base para {form.type.toLowerCase()}.</span>
                  </div>
                  <button className="ghost-button" onClick={applyTemplate}>Aplicar template</button>
                </div>
                <div className="step-footer">
                  <span></span>
                  <button className="primary-button" onClick={() => setActiveStep(2)}>Continuar <Icon>→</Icon></button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="panel-content">
                <div className="section-heading">
                  <span>02</span>
                  <div><h2>Conte o que está acontecendo</h2><p>Não precisa escrever bonito. A revisão final organiza para você.</p></div>
                </div>
                <Field label="Título do card" required hint="Seja direto: ação + objeto + resultado">
                  <input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Ex.: Permitir redefinição de senha pelo aplicativo" />
                </Field>
                <Field label="Qual é o contexto?" required hint="Por que essa demanda surgiu? Quem é afetado?">
                  <textarea value={form.context} onChange={(e) => updateField('context', e.target.value)} placeholder="Descreva o cenário e o problema de forma livre..." rows={4} />
                </Field>
                <Field label="Qual é o objetivo?" required hint="Qual resultado de negócio ou usuário esperamos alcançar?">
                  <textarea value={form.objective} onChange={(e) => updateField('objective', e.target.value)} placeholder="Ao final desta entrega, esperamos que..." rows={3} />
                </Field>
                <div className="step-footer">
                  <button className="ghost-button" onClick={() => setActiveStep(1)}>← Voltar</button>
                  <button className="primary-button" onClick={() => setActiveStep(3)}>Continuar <Icon>→</Icon></button>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="panel-content">
                <div className="section-heading">
                  <span>03</span>
                  <div><h2>Detalhes para desenvolvimento e QA</h2><p>Registre o comportamento, as regras e as evidências relevantes.</p></div>
                </div>

                <div className="two-columns">
                  <Field label={isBug ? 'Comportamento atual' : 'Cenário atual'}>
                    <textarea value={form.currentBehavior} onChange={(e) => updateField('currentBehavior', e.target.value)} placeholder="Hoje, o sistema..." rows={4} />
                  </Field>
                  <Field label={isInvestigation ? 'Resultado esperado da análise' : 'Comportamento esperado'} required>
                    <textarea value={form.expectedBehavior} onChange={(e) => updateField('expectedBehavior', e.target.value)} placeholder="O sistema deve..." rows={4} />
                  </Field>
                </div>

                {isBug && (
                  <div className="two-columns">
                    <Field label="Como reproduzir">
                      <textarea value={form.reproduction} onChange={(e) => updateField('reproduction', e.target.value)} placeholder={'1. Acesse...\n2. Clique...\n3. Observe...'} rows={4} />
                    </Field>
                    <Field label="Ambiente">
                      <textarea value={form.environment} onChange={(e) => updateField('environment', e.target.value)} placeholder="Produção, homologação, navegador, versão..." rows={4} />
                    </Field>
                  </div>
                )}

                <div className="two-columns">
                  <Field label="Escopo">
                    <textarea value={form.scope} onChange={(e) => updateField('scope', e.target.value)} placeholder="O que faz e o que não faz parte..." rows={3} />
                  </Field>
                  <Field label="Regras de negócio">
                    <textarea value={form.rules} onChange={(e) => updateField('rules', e.target.value)} placeholder="Condições, permissões e validações..." rows={3} />
                  </Field>
                </div>

                <div className="criteria-block">
                  <div className="block-title">
                    <div><h3>Critérios de aceite</h3><p>Itens objetivos e verificáveis pelo QA.</p></div>
                    <button className="text-button" onClick={addCriterion}>+ Adicionar critério</button>
                  </div>
                  {criteria.map((criterion, index) => (
                    <div className="criterion-row" key={index}>
                      <span>☐</span>
                      <input value={criterion} onChange={(e) => updateCriterion(index, e.target.value)} placeholder={`Critério ${index + 1}: O sistema deve...`} />
                      {criteria.length > 1 && <button onClick={() => removeCriterion(index)} aria-label="Remover critério">×</button>}
                    </div>
                  ))}
                </div>

                <div className="evidence-block">
                  <div className="block-title">
                    <div><h3>Evidências visuais</h3><p>Cole, arraste ou selecione prints. Eles serão incluídos no corpo do card.</p></div>
                    <span className="optional">Opcional</span>
                  </div>
                  <div
                    className={`dropzone ${dragging ? 'dragging' : ''}`}
                    onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onPaste={(event) => processFiles(event.clipboardData.files)}
                    tabIndex={0}
                  >
                    <div className="upload-icon">↑</div>
                    <strong>Arraste seus prints para cá</strong>
                    <span>ou cole com <kbd>Ctrl</kbd> + <kbd>V</kbd></span>
                    <button onClick={() => fileInputRef.current?.click()}>Selecionar arquivos</button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
                  </div>
                  {images.length > 0 && (
                    <div className="image-list">
                      {images.map((image) => (
                        <div className="image-item" key={image.id}>
                          <img src={image.src} alt={image.name} />
                          <input
                            value={image.caption}
                            onChange={(e) => setImages((current) => current.map((item) => item.id === image.id ? { ...item, caption: e.target.value } : item))}
                            placeholder="Explique o que deve ser observado neste print..."
                          />
                          <button onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Field label="Observações técnicas">
                  <textarea value={form.technicalNotes} onChange={(e) => updateField('technicalNotes', e.target.value)} placeholder="Integrações, dependências, logs ou riscos conhecidos..." rows={3} />
                </Field>

                <div className="step-footer">
                  <button className="ghost-button" onClick={() => setActiveStep(2)}>← Voltar</button>
                  <button className="ai-button" onClick={improveAndGenerate}><Icon>✦</Icon> Estruturar card</button>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="panel-content review-panel">
                <div className="section-heading">
                  <span>04</span>
                  <div><h2>Revise antes de copiar</h2><p>Você ainda pode voltar e ajustar qualquer informação.</p></div>
                </div>
                <div className="review-callout"><Icon>✦</Icon><div><strong>Card estruturado</strong><span>O conteúdo foi organizado para facilitar o entendimento de desenvolvimento e QA.</span></div></div>
                <RefinementPreview
                  score={qualityScore}
                  qualityItems={qualityItems}
                  questions={refinementQuestions}
                  cardType={form.type}
                />
                <CardPreview form={form} criteria={criteria.filter(Boolean)} images={images} previewRef={previewRef} />
                {images.length > 0 && (
                  <div className="jira-image-actions">
                    <div>
                      <strong>Colar evidências no Jira</strong>
                      <span>Depois de colar o card, copie e cole cada imagem abaixo no campo do Jira.</span>
                    </div>
                    {images.map((image, index) => (
                      <button key={image.id} type="button" onClick={() => copyImage(image)}>
                        {copiedImageId === image.id ? '✓ Imagem copiada!' : `▣ Copiar Print ${index + 1}`}
                      </button>
                    ))}
                  </div>
                )}
                <div className="review-actions">
                  <button className="ghost-button" onClick={() => setActiveStep(3)}>← Editar detalhes</button>
                  <div>
                    <button className="ghost-button danger" onClick={reset}>Descartar</button>
                    <button className="copy-button" onClick={copyCard}>{copied ? '✓ Copiado!' : '▣ Copiar para o JIRA'}</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {activeStep < 4 && (
            <aside className="side-panel">
              <div className="tip-card">
                <span className="tip-icon">✦</span>
                <h3>Dica do FlowDesk</h3>
                <p>{activeStep === 1
                  ? 'Escolher o tipo certo evita perguntas desnecessárias e deixa o card mais objetivo.'
                  : activeStep === 2
                    ? 'Escreva como você explicaria para alguém do time. A clareza importa mais que a formalidade.'
                    : 'Um bom critério de aceite descreve algo que o QA consegue confirmar como verdadeiro ou falso.'}</p>
              </div>
              <div className="summary-card">
                <div><span>Card atual</span><b className={`tag ${form.type.toLowerCase().replace(' ', '-')}`}>{form.type}</b></div>
                <h3>{form.title || 'Seu título aparecerá aqui'}</h3>
                <ul>
                  <li className={form.context ? 'complete' : ''}><span>{form.context ? '✓' : '○'}</span> Contexto</li>
                  <li className={form.objective ? 'complete' : ''}><span>{form.objective ? '✓' : '○'}</span> Objetivo</li>
                  <li className={form.expectedBehavior ? 'complete' : ''}><span>{form.expectedBehavior ? '✓' : '○'}</span> Comportamento esperado</li>
                  <li className={criteria.some(Boolean) ? 'complete' : ''}><span>{criteria.some(Boolean) ? '✓' : '○'}</span> Critérios de aceite</li>
                  <li className={images.length ? 'complete' : ''}><span>{images.length ? '✓' : '○'}</span> Evidências ({images.length})</li>
                </ul>
              </div>
              <div className="quality-card">
                <div className="quality-head">
                  <span>Score de qualidade</span>
                  <strong>{qualityScore}%</strong>
                </div>
                <div className="quality-meter"><span style={{ width: `${qualityScore}%` }}></span></div>
                <ul>
                  {qualityItems.map((item) => (
                    <li key={item.label} className={item.complete ? 'complete' : ''}>
                      <span>{item.complete ? '✓' : '○'}</span>
                      <div>
                        <strong>{item.label}</strong>
                        {!item.complete && <small>{item.hint}</small>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="refinement-card">
                <div className="block-title">
                  <div><h3>Refinamento</h3><p>Perguntas que ainda precisam de resposta.</p></div>
                  <span className="optional">{refinementQuestions.length}</span>
                </div>
                {refinementQuestions.length ? (
                  <ul>
                    {refinementQuestions.map((question) => <li key={question}>{question}</li>)}
                  </ul>
                ) : (
                  <p className="empty-state">Sem perguntas críticas no momento.</p>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>
      {jiraConfigOpen && (
        <JiraConfigPanel
          config={jiraConfig}
          status={jiraStatus}
          onChange={updateJiraConfig}
          onClose={() => setJiraConfigOpen(false)}
          onCopyPayload={copyJiraPayload}
          onSend={sendToJiraIntegration}
        />
      )}
      <div className={`toast ${copied ? 'show' : ''}`}>Card copiado para a área de transferência.</div>
    </div>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label} {required && <i>Obrigatório</i>}</span>
      {hint && <small>{hint}</small>}
      {children}
    </label>
  )
}

function RefinementPreview({ score, qualityItems, questions, cardType }: {
  score: number
  qualityItems: QualityItem[]
  questions: string[]
  cardType: CardType
}) {
  const strengths = qualityItems.filter((item) => item.complete).slice(0, 4)
  const risks = qualityItems.filter((item) => !item.complete).slice(0, 4)
  const priority = score < 50 ? 'Refinar antes de desenvolver' : score < 85 ? 'Pode ir para refinamento técnico' : 'Pronto para squad avaliar'

  return (
    <section className="refinement-preview">
      <div className="refinement-preview-head">
        <div>
          <span>Prévia de refinamento</span>
          <h3>{priority}</h3>
        </div>
        <strong>{score}%</strong>
      </div>
      <div className="refinement-preview-grid">
        <div>
          <h4>Pontos fortes</h4>
          {strengths.length ? (
            <ul>{strengths.map((item) => <li key={item.label}>{item.label}</li>)}</ul>
          ) : (
            <p>Nenhum ponto forte identificado ainda.</p>
          )}
        </div>
        <div>
          <h4>Riscos antes do Jira</h4>
          {risks.length ? (
            <ul>{risks.map((item) => <li key={item.label}>{item.hint}</li>)}</ul>
          ) : (
            <p>Sem riscos críticos de preenchimento.</p>
          )}
        </div>
        <div>
          <h4>Perguntas pendentes</h4>
          {questions.length ? (
            <ul>{questions.map((question) => <li key={question}>{question}</li>)}</ul>
          ) : (
            <p>Sem perguntas críticas no momento.</p>
          )}
        </div>
      </div>
      <div className="refinement-preview-footer">
        <span>Tipo: {cardType}</span>
        <span>{questions.length ? `${questions.length} pontos para refinar` : 'Sem pendência crítica'}</span>
      </div>
    </section>
  )
}

function JiraConfigPanel({ config, status, onChange, onClose, onCopyPayload, onSend }: {
  config: JiraConfig
  status: string
  onChange: (field: keyof JiraConfig, value: string) => void
  onClose: () => void
  onCopyPayload: () => void
  onSend: () => void
}) {
  return (
    <div className="jira-modal-backdrop" role="dialog" aria-modal="true" aria-label="Configurar Jira">
      <section className="jira-modal">
        <div className="jira-modal-head">
          <div>
            <span>Integração</span>
            <h2>Configurar Jira</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="jira-warning">
          Caminho mais rápido: crie uma regra no Jira Automation com gatilho "Incoming webhook", copie a URL gerada e cole aqui.
        </div>
        <div className="jira-setup-steps">
          <strong>Como configurar no Jira</strong>
          <ol>
            <li>No projeto do Jira, acesse Project settings → Automation.</li>
            <li>Crie uma regra com o gatilho Incoming webhook.</li>
            <li>Adicione a ação Create issue.</li>
            <li>Mapeie Summary com <code>{'{{webhookData.summary}}'}</code>.</li>
            <li>Mapeie Description com <code>{'{{webhookData.description}}'}</code>.</li>
          </ol>
        </div>
        <div className="two-columns">
          <Field label="URL do Jira">
            <input value={config.siteUrl} onChange={(event) => onChange('siteUrl', event.target.value)} placeholder="https://suaempresa.atlassian.net" />
          </Field>
          <Field label="Projeto">
            <input value={config.projectKey} onChange={(event) => onChange('projectKey', event.target.value.toUpperCase())} placeholder="PROJ" />
          </Field>
        </div>
        <div className="two-columns">
          <Field label="Tipo de issue">
            <input value={config.issueType} onChange={(event) => onChange('issueType', event.target.value)} placeholder="Task, Story, Bug..." />
          </Field>
          <Field label="URL do webhook">
            <input value={config.webhookUrl} onChange={(event) => onChange('webhookUrl', event.target.value)} placeholder="https://automation.atlassian.com/pro/hooks/..." />
          </Field>
        </div>
        <div className="jira-modal-actions">
          <button className="ghost-button" onClick={onCopyPayload}>Copiar payload</button>
          <button className="primary-button" onClick={onSend}>Enviar para Jira</button>
        </div>
        {status && <p className="jira-status">{status}</p>}
      </section>
    </div>
  )
}

function CardPreview({ form, criteria, images, previewRef }: {
  form: FormData
  criteria: string[]
  images: ImageItem[]
  previewRef: React.RefObject<HTMLDivElement>
}) {
  const section = (title: string, content: string) => content && (
    <section className="card-section">
      <h3>{title}</h3>
      <p>{content}</p>
    </section>
  )

  return (
    <div className="jira-card" ref={previewRef}>
      <div className="jira-title-row">
        <span className="jira-type">{form.type}</span>
        <span>Pronto para o JIRA</span>
      </div>
      <h1>{form.title || `Novo card — ${form.type}`}</h1>
      {section('Contexto', form.context || 'Não informado.')}
      {section('Objetivo', form.objective || 'Não informado.')}
      {section(form.type === 'Bug' ? 'Comportamento atual' : 'Cenário atual', form.currentBehavior)}
      {section(form.type === 'Investigação' ? 'Resultado esperado da investigação' : 'Comportamento esperado', form.expectedBehavior || 'Não informado.')}
      {section('Escopo', form.scope)}
      {section('Regras de negócio', form.rules)}
      {form.type === 'Bug' && section('Como reproduzir', form.reproduction)}
      {form.type === 'Bug' && section('Ambiente', form.environment)}
      <section className="card-section">
        <h3>Critérios de aceite</h3>
        <ul className="acceptance-list">
          {(criteria.length ? criteria : defaultCriteria).map((criterion, index) => <li key={index}>☐ <span>{criterion}</span></li>)}
        </ul>
      </section>
      {section('Observações técnicas', form.technicalNotes)}
      {images.length > 0 && (
        <section className="card-section">
          <h3>Evidências visuais</h3>
          <div className="preview-images">
            {images.map((image, index) => (
              <figure key={image.id}>
                <img src={image.src} alt={image.caption || image.name} />
                <figcaption><strong>Print {index + 1}.</strong> {image.caption || image.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default App
