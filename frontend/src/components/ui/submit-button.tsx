'use client';

// Este componente es cliente porque useFormStatus necesita observar el estado
// pendiente del <form> padre (botón "Ingresando…", "Registrando…", etc.).
import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}

export function SubmitButton({
  children,
  pendingText = 'Enviando…',
  className = 'g-btn g-btn--primary',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
