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
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const progress = useMemo(() => {
    const required = [form.title, form.context, form.objective, form.expectedBehavior]
    const completed = required.filter((value) => value.trim()).length
    return Math.round((completed / required.length) * 100)
  }, [form])

  const isBug = form.type === 'Bug'
  const isInvestigation = form.type === 'Investigação'

  function updateField(field: keyof FormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
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
              <strong>{progress}%</strong>
            </div>
            <div className="progress-track"><span style={{ width: `${progress}%` }}></span></div>
            <small>{progress < 50 ? 'Preencha os campos principais para melhorar o card.' : progress < 100 ? 'Bom caminho. Faltam poucos detalhes.' : 'Briefing pronto para gerar.'}</small>
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
                <CardPreview form={form} criteria={criteria.filter(Boolean)} images={images} previewRef={previewRef} />
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
            </aside>
          )}
        </div>
      </main>
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
