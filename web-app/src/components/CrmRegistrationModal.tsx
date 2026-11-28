'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { pingAlerts } from '@/lib/pingAlerts';
import { trackMeta } from '@/lib/metaPixel';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import { SunbakedLettersNote } from '@/components/SunbakedLetters';
import {
  WORKSHOP_MAX_GUESTS, WORKSHOP_MIN_GUESTS, WORKSHOP_PRICE_BRL,
  todayIso, workshopMinDate, workshopBreakNote, workshopDateError, workshopTotalBRL,
} from '@/lib/workshopDates';

interface CrmRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  interestType: 'curso' | 'retiro';
  specificInterest: string;
  /** The language of the form (Portuguese by default). What gets saved stays the same in every language. */
  locale?: 'pt' | 'en' | 'es';
}

/** Below this width the form becomes a full-screen, three-step flow; above it, the two-column card. */
const NARROW_QUERY = '(max-width: 899px)';
const LAST_STEP = 2;

/** The focus areas are saved in Portuguese (the admin reads them); these are only the words shown. */
const FOCUS_AREAS = {
  curso: ['Culinária Vegana', 'Culinária Sem Trigo', 'Substituições Saudáveis (SOS-Free)', 'Receitas Práticas', 'Empreendedorismo na Confeitaria'],
  retiro: ['Yoga & Meditação', 'Confeitaria Saudável', 'Relaxamento & Natureza', 'Transição para o Veganismo'],
};
const FOCUS_LABELS: Record<'en' | 'es', Record<string, string>> = {
  en: {
    'Culinária Vegana': 'Vegan Cooking',
    'Culinária Sem Trigo': 'Wheat-Free Cooking',
    'Substituições Saudáveis (SOS-Free)': 'Healthy Swaps (SOS-Free)',
    'Receitas Práticas': 'Everyday Recipes',
    'Empreendedorismo na Confeitaria': 'Starting a Baking Business',
    'Yoga & Meditação': 'Yoga & Meditation',
    'Confeitaria Saudável': 'Healthy Baking',
    'Relaxamento & Natureza': 'Rest & Nature',
    'Transição para o Veganismo': 'Moving Toward Veganism',
  },
  es: {
    'Culinária Vegana': 'Cocina Vegana',
    'Culinária Sem Trigo': 'Cocina Sin Trigo',
    'Substituições Saudáveis (SOS-Free)': 'Sustituciones Saludables (SOS-Free)',
    'Receitas Práticas': 'Recetas Prácticas',
    'Empreendedorismo na Confeitaria': 'Emprender en Pastelería',
    'Yoga & Meditação': 'Yoga y Meditación',
    'Confeitaria Saudável': 'Pastelería Saludable',
    'Relaxamento & Natureza': 'Relajación y Naturaleza',
    'Transição para o Veganismo': 'Transición al Veganismo',
  },
};

const COPY = {
  pt: {
    steps: ['Seus dados', 'Data e ideia', 'Seus interesses'],
    optional: '(opcional)',
    dateMissing: 'Escolha a data que você prefere.',
    datePast: 'Essa data já passou. Escolha uma data futura.',
    nameMissing: 'Conte seu nome.',
    emailMissing: 'Informe seu e-mail.',
    emailBad: 'Esse e-mail parece incompleto.',
    phoneMissing: 'Informe seu WhatsApp com DDD.',
    phoneShort: 'Faltam números: use DDD + número.',
    groupTooBig: (max: number) => `Cada aula recebe até ${max} pessoas. Para um grupo maior, conte na mensagem.`,
    sendError: 'Ocorreu um erro ao enviar sua reserva. Tente novamente.',
    intro: (interest: string) => <>Insira seus dados abaixo. Nossa equipe entrará em contato para confirmar a disponibilidade da data e alinhar os detalhes da sua experiência <b>{interest}</b>.</>,
    loginToggle: 'Já tenho conta: entrar e preencher sozinho',
    nameLabel: 'Nome Completo *',
    namePlaceholder: 'Seu nome',
    emailLabel: 'E-mail *',
    emailPlaceholder: 'seu@email.com',
    phoneLabel: 'WhatsApp (DDD + Número) *',
    phonePlaceholder: 'Ex: 11999999999',
    priceNote: (price: number, total: string, guests: number, min: number) =>
      `R$ ${price} por pessoa: R$ ${total} para ${guests === 1 ? `1 pessoa (aula particular, paga ${min} vagas)` : `${guests} pessoas`}.`,
    priceRange: (price: number, min: number, max: number) => `R$ ${price} por pessoa. De ${min} a ${max} pessoas; sozinho(a), você paga ${min} vagas.`,
    dateLabel: 'Data Desejada *',
    groupLabel: 'Quantas pessoas?',
    groupPlaceholder: (n: number) => `Ex: ${n}`,
    messageLabel: 'Conte o que você imagina',
    messageHint: 'Quanto mais a gente souber, melhor conseguimos preparar a sua experiência.',
    messageRetreat: 'Ex: um grupo de amigas, 3 noites, queremos yoga de manhã e aula de confeitaria. Alguém é celíaca…',
    messageCourse: 'Ex: nunca fiz confeitaria vegana, quero aprender receitas sem trigo para a minha família…',
    focusTitle: 'Áreas de Foco (Opcional)',
    focusIntro: 'Selecione os temas que você tem mais interesse para que possamos personalizar sua experiência.',
    privacy: 'Suas informações estão seguras conosco e serão usadas apenas para organizar seu evento.',
    close: 'Fechar',
    eyebrow: 'RESERVA EXCLUSIVA',
    titleCourse: 'Agendar Curso',
    titleRetreat: 'Agendar Retiro',
    stepOf: (n: number, total: number) => `Passo ${n} de ${total}`,
    successTitle: 'Reserva Recebida!',
    successText: 'Você receberá uma mensagem no WhatsApp com os detalhes da sua reserva.',
    back: '← Voltar',
    sending: 'Processando...',
    next: 'Continuar →',
    submit: 'Fazer Reserva',
  },
  en: {
    steps: ['Your details', 'Date and idea', 'Your interests'],
    optional: '(optional)',
    dateMissing: 'Pick the date you’d like.',
    datePast: 'That date has passed. Please pick a future date.',
    nameMissing: 'Tell us your name.',
    emailMissing: 'Enter your e-mail.',
    emailBad: 'That e-mail looks incomplete.',
    phoneMissing: 'Enter your WhatsApp number, with country and area code.',
    phoneShort: 'Some digits are missing: include the country and area code.',
    groupTooBig: (max: number) => `Each class takes up to ${max} people. For a bigger group, tell us in the message.`,
    sendError: 'Something went wrong sending your request. Please try again.',
    intro: (interest: string) => <>Leave your details below. Our team will get in touch to confirm the date is available and go over the details of your experience: <b>{interest}</b>.</>,
    loginToggle: 'I have an account: sign in and fill this in for me',
    nameLabel: 'Full Name *',
    namePlaceholder: 'Your name',
    emailLabel: 'E-mail *',
    emailPlaceholder: 'you@email.com',
    phoneLabel: 'WhatsApp (country code + number) *',
    phonePlaceholder: 'e.g. +44 7700 900123',
    priceNote: (price: number, total: string, guests: number, min: number) =>
      `R$ ${price} per person: R$ ${total} for ${guests === 1 ? `1 person (a private class, paid as ${min} places)` : `${guests} people`}.`,
    priceRange: (price: number, min: number, max: number) => `R$ ${price} per person. From ${min} to ${max} people; on your own, you pay for ${min} places.`,
    dateLabel: 'Preferred Date *',
    groupLabel: 'How many people?',
    groupPlaceholder: (n: number) => `e.g. ${n}`,
    messageLabel: 'Tell us what you have in mind',
    messageHint: 'The more we know, the better we can prepare your experience.',
    messageRetreat: 'e.g. a group of friends, 3 nights, we’d like yoga in the morning and a baking class. One of us is celiac…',
    messageCourse: 'e.g. I’ve never done vegan baking, and I want to learn wheat-free recipes for my family…',
    focusTitle: 'Areas of Focus (Optional)',
    focusIntro: 'Choose the topics that interest you most, so we can shape your experience around them.',
    privacy: 'Your information is safe with us and will only be used to organize your experience.',
    close: 'Close',
    eyebrow: 'EXCLUSIVE BOOKING',
    titleCourse: 'Book a Course',
    titleRetreat: 'Book a Retreat',
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    successTitle: 'Request Received!',
    successText: 'You’ll get a WhatsApp message with the details of your booking.',
    back: '← Back',
    sending: 'Sending...',
    next: 'Continue →',
    submit: 'Send Request',
  },
  es: {
    steps: ['Tus datos', 'Fecha e idea', 'Tus intereses'],
    optional: '(opcional)',
    dateMissing: 'Elige la fecha que prefieres.',
    datePast: 'Esa fecha ya pasó. Elige una fecha futura.',
    nameMissing: 'Dinos tu nombre.',
    emailMissing: 'Escribe tu e-mail.',
    emailBad: 'Ese e-mail parece incompleto.',
    phoneMissing: 'Escribe tu WhatsApp con código de país y de área.',
    phoneShort: 'Faltan números: incluye el código de país y de área.',
    groupTooBig: (max: number) => `Cada clase recibe hasta ${max} personas. Para un grupo más grande, cuéntanos en el mensaje.`,
    sendError: 'Hubo un error al enviar tu reserva. Inténtalo de nuevo.',
    intro: (interest: string) => <>Escribe tus datos abajo. Nuestro equipo se pondrá en contacto para confirmar la disponibilidad de la fecha y coordinar los detalles de tu experiencia: <b>{interest}</b>.</>,
    loginToggle: 'Ya tengo cuenta: entrar y completar automáticamente',
    nameLabel: 'Nombre Completo *',
    namePlaceholder: 'Tu nombre',
    emailLabel: 'E-mail *',
    emailPlaceholder: 'tu@email.com',
    phoneLabel: 'WhatsApp (código de país + número) *',
    phonePlaceholder: 'Ej: +54 9 11 1234 5678',
    priceNote: (price: number, total: string, guests: number, min: number) =>
      `R$ ${price} por persona: R$ ${total} para ${guests === 1 ? `1 persona (clase particular, paga ${min} lugares)` : `${guests} personas`}.`,
    priceRange: (price: number, min: number, max: number) => `R$ ${price} por persona. De ${min} a ${max} personas; si vienes solo(a), pagas ${min} lugares.`,
    dateLabel: 'Fecha Deseada *',
    groupLabel: '¿Cuántas personas?',
    groupPlaceholder: (n: number) => `Ej: ${n}`,
    messageLabel: 'Cuéntanos qué te imaginas',
    messageHint: 'Mientras más sepamos, mejor podremos preparar tu experiencia.',
    messageRetreat: 'Ej: un grupo de amigas, 3 noches, queremos yoga en la mañana y una clase de pastelería. Una es celíaca…',
    messageCourse: 'Ej: nunca hice pastelería vegana, quiero aprender recetas sin trigo para mi familia…',
    focusTitle: 'Áreas de Enfoque (Opcional)',
    focusIntro: 'Selecciona los temas que más te interesan para que podamos personalizar tu experiencia.',
    privacy: 'Tu información está segura con nosotros y solo se usará para organizar tu experiencia.',
    close: 'Cerrar',
    eyebrow: 'RESERVA EXCLUSIVA',
    titleCourse: 'Agendar Curso',
    titleRetreat: 'Agendar Retiro',
    stepOf: (n: number, total: number) => `Paso ${n} de ${total}`,
    successTitle: '¡Reserva Recibida!',
    successText: 'Recibirás un mensaje por WhatsApp con los detalles de tu reserva.',
    back: '← Volver',
    sending: 'Procesando...',
    next: 'Continuar →',
    submit: 'Hacer Reserva',
  },
};

type Errors = Partial<Record<'name' | 'email' | 'whatsapp' | 'date' | 'group', string>>;

const inputStyle: React.CSSProperties = {
  width: '100%', minWidth: 0, minHeight: 48, padding: '0.8rem', fontSize: '1rem',
  borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit',
};
const invalidBorder = '1px solid #c0392b';

/** Label + control + hint/error. A plain function (not a component defined inside the modal) so inputs keep focus while typing. */
function Field({ id, label, optional, optionalText = '(opcional)', hint, error, children }: {
  id: string; label: string; optional?: boolean; optionalText?: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.4rem' }}>
        {label}{optional && <span style={{ fontWeight: 400, color: '#7a6a61' }}> {optionalText}</span>}
      </label>
      {children}
      {error ? (
        <span id={`${id}-error`} role="alert" style={{ display: 'block', fontSize: '0.82rem', color: '#c0392b', fontWeight: 600, marginTop: '0.35rem' }}>{error}</span>
      ) : hint ? (
        <span style={{ display: 'block', fontSize: '0.78rem', color: '#7a6a61', marginTop: '0.3rem' }}>{hint}</span>
      ) : null}
    </div>
  );
}

export default function CrmRegistrationModal({ isOpen, onClose, interestType, specificInterest, locale = 'pt' }: CrmRegistrationModalProps) {
  const t = COPY[locale] ?? COPY.pt;
  const focusLabel = (area: string) => (locale === 'pt' ? area : FOCUS_LABELS[locale]?.[area] ?? area);
  const { user, profile, availableMethods } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [message, setMessage] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [narrow, setNarrow] = useState(false);
  const [step, setStep] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  // Parents often pass a fresh onClose every render; keep it out of the effect below so the step isn't reset by a re-render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const availableFocusAreas = interestType === 'curso' ? FOCUS_AREAS.curso : FOCUS_AREAS.retiro;

  useEffect(() => {
    if (profile) {
      if (profile.full_name) setName(profile.full_name);
      if (profile.phone) setWhatsapp(profile.phone);
    }
    if (user?.email) setEmail(user.email);
  }, [profile, user]);

  // Follow the screen size (same breakpoint as the CSS below).
  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // While open: the page behind must not scroll, and Escape closes.
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setLoginOpen(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  // A new step starts at its top, and screen readers are told where they are.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    bodyRef.current?.scrollTo({ top: 0 });
    stepHeadingRef.current?.focus({ preventScroll: true });
  }, [step]);

  // After a failed "next"/"send", put the cursor on the first field that needs attention.
  useEffect(() => {
    if (!focusTick) return;
    const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus();
  }, [focusTick]);

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const formatWhatsApp = (value: string) => {
    // Remove everything that is not a digit
    let cleaned = ('' + value).replace(/\D/g, '');

    // Add Brazil country code if not present (assuming users might just enter DDD)
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  };

  /** Why the chosen date can't be used ('' = fine). Workshops also respect the break in lib/workshopDates.ts. */
  const dateProblem = (value: string): string => {
    if (!value) return t.dateMissing;
    if (interestType === 'curso') return workshopDateError(value);
    return value < todayIso() ? t.datePast : '';
  };

  /** Which fields on a step are missing or wrong. Steps: 0 = you, 1 = the day and idea, 2 = nothing required. */
  const validateStep = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0) {
      if (!name.trim()) e.name = t.nameMissing;
      if (!email.trim()) e.email = t.emailMissing;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t.emailBad;
      if (!whatsapp.trim()) e.whatsapp = t.phoneMissing;
      else if (whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = t.phoneShort;
    }
    if (s === 1) {
      const dateError = dateProblem(dateStr);
      if (dateError) e.date = dateError;
      if (interestType === 'curso' && groupSize && (Number(groupSize) < 1 || Number(groupSize) > WORKSHOP_MAX_GUESTS)) {
        e.group = t.groupTooBig(WORKSHOP_MAX_GUESTS);
      }
    }
    return e;
  };

  const clearError = (key: keyof Errors) => setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    // Phone: "next" (or the keyboard's Enter key) moves on one step; only the last step sends.
    if (narrow && step < LAST_STEP) {
      const stepErrors = validateStep(step);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length) { setFocusTick(t => t + 1); return; }
      setStep(step + 1);
      return;
    }

    const allErrors = { ...validateStep(0), ...validateStep(1) };
    setErrors(allErrors);
    if (Object.keys(allErrors).length) {
      // On a phone, go back to the step that holds the first problem.
      if (narrow) setStep(Object.keys(validateStep(0)).length ? 0 : 1);
      setStatus('idle');
      setFocusTick(t => t + 1);
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const row = {
        customer_name: name.trim(),
        email: email.trim(),
        customer_whatsapp: formatWhatsApp(whatsapp),
        interest_type: interestType,
        specific_interest: specificInterest,
        requested_date: dateStr,
        focus_areas: focusAreas,
      };
      const extra = { group_size: groupSize ? Number(groupSize) : null, message: message.trim() || null };

      let { error } = await supabase.from('course_registrations').insert([{ ...row, ...extra }]);

      // If the message/group-size columns aren't in the database yet (migration 18), never lose
      // what the customer wrote: keep it inside the interest line and save the rest as before.
      if (error && (extra.group_size || extra.message)) {
        const folded = [
          specificInterest,
          extra.group_size ? `${extra.group_size} pessoa(s)` : '',
          extra.message ? `Mensagem: ${extra.message}` : '',
        ].filter(Boolean).join(' | ');
        ({ error } = await supabase.from('course_registrations').insert([{ ...row, specific_interest: folded }]));
      }

      if (error) throw error;
      pingAlerts();

      // Interested in courses/retreats -> the matching e-mail list.
      await supabase.rpc('email_contact_upsert', {
        p_email: email.trim(),
        p_full_name: name.trim(),
        p_tags: /retiro/i.test(interestType || '') ? ['retiros', 'cursos'] : ['cursos'],
        p_source: 'inscricao_curso',
      });

      trackMeta('Lead', { content_name: /retiro/i.test(interestType || '') ? 'retiro' : 'curso' });
      setStatus('success');

      // Auto-close modal after 3 seconds
      setTimeout(() => {
        onClose();
        // Reset form
        setName('');
        setWhatsapp('');
        setDateStr('');
        setGroupSize('');
        setMessage('');
        setFocusAreas([]);
        setErrors({});
        setStep(0);
        setStatus('idle');
      }, 12000); // long enough to read the confirmation and open the newsletter link

    } catch (err: any) {
      console.error(err);
      setErrorMsg(t.sendError);
      setStatus('error');
    }
  };

  // ---- The form's pieces. Desktop shows them all in two columns; a phone shows one step at a time. ----

  const canLogin = !user && availableMethods.length > 0;

  const introText = t.intro(specificInterest);

  const loginBlock = narrow ? (
    // Signing in only saves typing, so on a phone it folds away until asked for.
    canLogin && (
      <div className="crm-login">
        <button
          type="button"
          className="crm-login-toggle"
          aria-expanded={loginOpen}
          aria-controls="crm-login-panel"
          onClick={() => setLoginOpen(o => !o)}
        >
          <span>{t.loginToggle}</span>
          <span aria-hidden style={{ transition: 'transform 0.2s', transform: loginOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
        </button>
        {loginOpen && <div id="crm-login-panel" style={{ marginTop: '0.75rem' }}><LoginPanel locale={locale} /></div>}
      </div>
    )
  ) : (
    <LoginPanel locale={locale} />
  );

  const personFields = (
    <>
      <Field id="crm-name" label={t.nameLabel} error={errors.name}>
        <input
          id="crm-name"
          type="text"
          autoComplete="name"
          enterKeyHint="next"
          aria-required
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'crm-name-error' : undefined}
          value={name}
          onChange={e => { setName(e.target.value); clearError('name'); }}
          placeholder={t.namePlaceholder}
          style={{ ...inputStyle, ...(errors.name ? { border: invalidBorder } : {}) }}
        />
      </Field>
      <Field id="crm-email" label={t.emailLabel} error={errors.email}>
        <input
          id="crm-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="next"
          aria-required
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'crm-email-error' : undefined}
          value={email}
          onChange={e => { setEmail(e.target.value); clearError('email'); }}
          placeholder={t.emailPlaceholder}
          style={{ ...inputStyle, ...(errors.email ? { border: invalidBorder } : {}) }}
        />
      </Field>
      <Field id="crm-whatsapp" label={t.phoneLabel} error={errors.whatsapp}>
        <input
          id="crm-whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint={narrow ? 'next' : 'done'}
          aria-required
          aria-invalid={errors.whatsapp ? true : undefined}
          aria-describedby={errors.whatsapp ? 'crm-whatsapp-error' : undefined}
          value={whatsapp}
          onChange={e => { setWhatsapp(e.target.value); clearError('whatsapp'); }}
          placeholder={t.phonePlaceholder}
          style={{ ...inputStyle, ...(errors.whatsapp ? { border: invalidBorder } : {}) }}
        />
      </Field>
    </>
  );

  const isCourse = interestType === 'curso';
  const minDate = isCourse ? workshopMinDate() : todayIso();
  const dateNote = isCourse ? workshopBreakNote() : '';
  // The price moves with the group, so say it as they type (one guest pays the two-guest minimum).
  const guests = Number(groupSize);
  const groupNote = !isCourse ? ''
    : guests >= 1 && guests <= WORKSHOP_MAX_GUESTS
      ? t.priceNote(WORKSHOP_PRICE_BRL, workshopTotalBRL(guests).toLocaleString('pt-BR'), guests, WORKSHOP_MIN_GUESTS)
      : t.priceRange(WORKSHOP_PRICE_BRL, WORKSHOP_MIN_GUESTS, WORKSHOP_MAX_GUESTS);

  const detailFields = (
    <>
      <Field id="crm-date" label={t.dateLabel} hint={dateNote || undefined} error={errors.date}>
        <input
          id="crm-date"
          type="date"
          min={minDate}
          aria-required
          aria-invalid={errors.date ? true : undefined}
          aria-describedby={errors.date ? 'crm-date-error' : undefined}
          value={dateStr}
          onChange={e => {
            const value = e.target.value;
            setDateStr(value);
            // Say right away when the day falls in the break, instead of waiting for "send".
            const problem = value ? dateProblem(value) : '';
            setErrors(prev => ({ ...prev, date: problem || undefined }));
          }}
          style={{ ...inputStyle, ...(errors.date ? { border: invalidBorder } : {}) }}
        />
      </Field>
      <Field id="crm-group" label={t.groupLabel} optional={!isCourse} optionalText={t.optional} hint={groupNote || undefined} error={errors.group}>
        <input
          id="crm-group"
          type="number"
          inputMode="numeric"
          min={1}
          max={isCourse ? WORKSHOP_MAX_GUESTS : 500}
          enterKeyHint="next"
          aria-invalid={errors.group ? true : undefined}
          aria-describedby={errors.group ? 'crm-group-error' : undefined}
          value={groupSize}
          onChange={e => { setGroupSize(e.target.value); clearError('group'); }}
          placeholder={t.groupPlaceholder(interestType === 'retiro' ? 8 : 2)}
          style={inputStyle}
        />
      </Field>
      <Field
        id="crm-message"
        label={t.messageLabel}
        optional
        optionalText={t.optional}
        hint={t.messageHint}
      >
        <textarea
          id="crm-message"
          rows={narrow ? 4 : 3}
          maxLength={1500}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={interestType === 'retiro' ? t.messageRetreat : t.messageCourse}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </Field>
    </>
  );

  const focusBlock = (
    <div className="crm-focus">
      <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#2a1a12', marginBottom: '0.75rem' }}>
        {t.focusTitle}
      </span>
      <p style={{ fontSize: '0.85rem', color: '#7a6a61', marginBottom: '1rem' }}>
        {t.focusIntro}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {availableFocusAreas.map(area => {
          const on = focusAreas.includes(area);
          return (
            <button
              key={area}
              type="button"
              aria-pressed={on}
              onClick={() => toggleFocusArea(area)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                minHeight: 44, padding: '0.5rem 0.9rem',
                borderRadius: '999px',
                border: on ? '1px solid #c9a257' : '1px solid rgba(0,0,0,0.15)',
                background: on ? 'rgba(212,175,55,0.1)' : 'white',
                color: on ? '#2a1a12' : '#594a42',
                fontFamily: 'inherit', fontSize: '0.9rem', textAlign: 'left',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {on && <span aria-hidden style={{ color: '#a8861f', fontWeight: 700 }}>✓</span>}
              {focusLabel(area)}
            </button>
          );
        })}
      </div>
    </div>
  );

  const privacyNote = (
    <p style={{ fontSize: '0.8rem', color: '#7a6a61', textAlign: 'center' }}>
      {t.privacy}
    </p>
  );

  const stepBody = [
    // 0: you
    <>
      <p style={{ color: '#594a42', fontSize: '0.92rem', lineHeight: 1.5 }}>{introText}</p>
      {loginBlock}
      {personFields}
    </>,
    // 1: the day and the idea
    detailFields,
    // 2: interests + send
    <>
      {focusBlock}
      {privacyNote}
    </>,
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="crm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Computer: a centred two-column card. Phone: a full-screen sheet (title on top, one step
              scrolling in the middle, buttons pinned to the bottom) so nothing is ever cut off. */}
          <style>{`
            .crm-overlay { position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); display: flex; padding: 1rem; overflow-y: auto; overscroll-behavior: contain; }
            .crm-card { position: relative; margin: auto; width: 100%; max-width: 1040px; background: #faf5ec; padding: 2.5rem; border-radius: 16px; border: 1px solid rgba(212,175,55,0.3); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .crm-close { position: absolute; top: 1.5rem; right: 1.5rem; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #7a6a61; }
            .crm-eyebrow { color: #c9a257; letter-spacing: 3px; text-transform: uppercase; font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 0.5rem; }
            .crm-title { font-family: var(--font-heading); font-size: 2rem; color: #2a1a12; margin-bottom: 0.5rem; line-height: 1.1; }
            .crm-intro { color: #594a42; margin-bottom: 2rem; font-size: 1rem; max-width: 760px; }
            .crm-progress { display: none; }
            .crm-form, .crm-body { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }
            .crm-cols { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
            .crm-col { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }
            .crm-focus { background: white; padding: 1.25rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); }
            .crm-foot { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
            .crm-submit { width: 100%; max-width: 520px; min-height: 52px; padding: 1rem; }
            .crm-back { display: none; }
            .crm-login-toggle { width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.7rem 1rem; border-radius: 10px; border: 1px dashed rgba(212,175,55,0.7); background: rgba(212,175,55,0.08); color: #2a1a12; font-family: inherit; font-size: 0.92rem; font-weight: 600; text-align: left; cursor: pointer; }
            @media (min-width: 900px) { .crm-cols { grid-template-columns: 1fr 1fr; gap: 2.5rem; align-items: start; } }
            @media (max-width: 899px) {
              .crm-overlay { padding: 0; overflow: hidden; }
              .crm-card { margin: 0; max-width: none; height: 100%; padding: 0; border: none; border-radius: 0; box-shadow: none; display: flex; flex-direction: column; }
              .crm-close { top: 0.4rem; right: 0.4rem; }
              .crm-head { flex: none; padding: 0.9rem 3.5rem 0.75rem 1rem; border-bottom: 1px solid rgba(0,0,0,0.08); }
              .crm-eyebrow { font-size: 0.68rem; letter-spacing: 2px; margin-bottom: 0.25rem; }
              .crm-title { font-size: 1.45rem; margin-bottom: 0; }
              .crm-progress { display: block; margin-top: 0.7rem; }
              .crm-bars { display: flex; gap: 0.35rem; }
              .crm-bars span { flex: 1; height: 4px; border-radius: 4px; background: rgba(0,0,0,0.1); }
              .crm-bars span.on { background: #c9a257; }
              .crm-step-label { display: block; margin-top: 0.4rem; font-size: 0.78rem; color: #7a6a61; font-weight: 600; }
              .crm-form { flex: 1; min-height: 0; gap: 0; }
              .crm-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 1rem 1rem 1.5rem; }
              .crm-step-title { font-family: var(--font-heading); font-size: 1.25rem; color: #2a1a12; margin: 0; outline: none; }
              .crm-focus { background: none; padding: 0; border: none; border-radius: 0; }
              .crm-foot { flex: none; flex-direction: row; align-items: stretch; gap: 0.6rem; padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom, 0px)); border-top: 1px solid rgba(0,0,0,0.08); background: #faf5ec; }
              .crm-foot .crm-submit { flex: 1; width: auto; max-width: none; min-height: 50px; padding: 0.8rem 1rem; }
              .crm-back { display: block; flex: none; min-height: 50px; padding: 0 1.1rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.2); background: white; color: #2a1a12; font-family: inherit; font-size: 1rem; font-weight: 600; cursor: pointer; }
            }
          `}</style>
          <motion.div
            className="crm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-title"
            initial={narrow ? { y: 40 } : { scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={narrow ? { y: 40 } : { scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="crm-close" onClick={onClose} aria-label={t.close}>
              ✕
            </button>

            <div className="crm-head">
              <span className="crm-eyebrow">{t.eyebrow}</span>
              <h2 id="crm-title" className="crm-title">
                {interestType === 'curso' ? t.titleCourse : t.titleRetreat}
              </h2>
              {!narrow && <p className="crm-intro">{introText}</p>}
              {narrow && status !== 'success' && (
                <div className="crm-progress" aria-live="polite">
                  <div className="crm-bars" aria-hidden>
                    {t.steps.map((title, i) => <span key={title} className={i <= step ? 'on' : ''} />)}
                  </div>
                  <span className="crm-step-label">{t.stepOf(step + 1, t.steps.length)}</span>
                </div>
              )}
            </div>

            {status === 'success' ? (
              <div className="crm-body" style={{ textAlign: 'center', padding: narrow ? '2rem 1rem' : '2rem 0', justifyContent: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨</div>
                <h3 style={{ color: '#2a1a12', fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>{t.successTitle}</h3>
                <p style={{ color: '#594a42' }}>{t.successText}</p>
                <SunbakedLettersNote locale={locale} />
              </div>
            ) : (
              <form ref={formRef} className="crm-form" onSubmit={handleSubmit} noValidate>
                <div ref={bodyRef} className="crm-body">
                  {status === 'error' && (
                    <div role="alert" style={{ padding: '1rem', background: '#f8d7da', color: '#721c24', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                      {errorMsg}
                    </div>
                  )}

                  {narrow ? (
                    <>
                      <h3 ref={stepHeadingRef} tabIndex={-1} className="crm-step-title">{t.steps[step]}</h3>
                      {stepBody[step]}
                    </>
                  ) : (
                    <div className="crm-cols">
                      <div className="crm-col">
                        {loginBlock}
                        {personFields}
                      </div>
                      <div className="crm-col">
                        {detailFields}
                        {focusBlock}
                      </div>
                    </div>
                  )}
                </div>

                <div className="crm-foot">
                  {narrow && step > 0 && (
                    <button type="button" className="crm-back" onClick={() => setStep(step - 1)}>
                      {t.back}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="btn btn-primary crm-submit"
                    style={{ opacity: status === 'submitting' ? 0.7 : 1 }}
                  >
                    {status === 'submitting'
                      ? t.sending
                      : narrow && step < LAST_STEP ? t.next : t.submit}
                  </button>
                  {!narrow && privacyNote}
                </div>
              </form>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
