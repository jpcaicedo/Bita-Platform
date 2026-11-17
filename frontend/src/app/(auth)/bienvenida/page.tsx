import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { completeOnboardingAction } from '@/lib/auth-actions';
import { ArrowRightIcon } from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import './onboarding.css';

export const metadata: Metadata = {
  title: 'Bienvenida',
};

interface Step {
  title: string;
  text: string;
  image: string;
  alt: string;
}

const STEPS: Step[] = [
  {
    title: 'Registra Cada Servicio',
    text: 'Registra cada mantenimiento de tu vehículo y siempre sabe cuándo toca el próximo.',
    image: '/images/onb-registra.png',
    alt: 'Ilustración de un vehículo con su bitácora de servicios',
  },
  {
    title: 'Nunca Te Pierdas una Revisión',
    text: 'Recibe alertas automáticas según el kilometraje o el tiempo, para que nada se te escape.',
    image: '/images/onb-alertas.png',
    alt: 'Ilustración de alertas y recordatorios del vehículo',
  },
  {
    title: 'Comparte el Acceso a Tu Manera',
    text: 'Autoriza a talleres de confianza a registrar el servicio directamente, y revoca el acceso cuando quieras.',
    image: '/images/onb-accesos.png',
    alt: 'Ilustración de un taller autorizado para el vehículo',
  },
];

export default function BienvenidaPage({
  searchParams,
}: {
  searchParams: Promise<{ paso?: string }>;
}) {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OnboardingContent({
  searchParams,
}: {
  searchParams: Promise<{ paso?: string }>;
}) {
  const params = await searchParams;
  const parsed = Number(params.paso ?? '1');
  const stepIndex =
    Number.isInteger(parsed) && parsed >= 1 && parsed <= 3 ? parsed - 1 : 0;
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <main className="g-onb">
      <div className="g-onb-top">
        <form action={completeOnboardingAction}>
          <button type="submit" className="g-onb-skip">
            Omitir
          </button>
        </form>
      </div>

      <section className="g-onb-arch">
        <h1 className="g-onb-title">{step.title}</h1>
        <p className="g-onb-text">{step.text}</p>
      </section>

      <div className="g-onb-art">
        <Image
          src={step.image}
          alt={step.alt}
          fill
          priority={stepIndex === 0}
          sizes="430px"
        />
      </div>

      <section className="g-onb-panel">
        <div className="g-onb-dots" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={
                index === stepIndex ? 'g-onb-dot is-active' : 'g-onb-dot'
              }
            />
          ))}
        </div>

        {isLast ? (
          <form action={completeOnboardingAction}>
            <SubmitButton pendingText="Entrando…">¡Entendido!</SubmitButton>
          </form>
        ) : (
          <Link
            className="g-btn g-btn--primary"
            href={`/bienvenida?paso=${stepIndex + 2}`}
          >
            Continuar
            <ArrowRightIcon size={18} />
          </Link>
        )}
      </section>
    </main>
  );
}

function OnboardingSkeleton() {
  return (
    <main className="g-onb" aria-busy="true">
      <div className="g-onb-top" />
      <section className="g-onb-arch">
        <div className="g-skeleton g-onb-skeleton-title" />
        <div className="g-skeleton g-onb-skeleton-text" />
      </section>
      <div className="g-onb-art g-skeleton" />
      <section className="g-onb-panel">
        <div className="g-skeleton g-onb-skeleton-button" />
      </section>
    </main>
  );
}
