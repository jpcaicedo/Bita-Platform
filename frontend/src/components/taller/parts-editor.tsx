'use client';

// Este componente es cliente solo por el estado local de la lista de
// repuestos (agregar y quitar antes de enviar el formulario). El resto de la
// pantalla se renderiza en el servidor.
import { useId, useState } from 'react';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';

interface PartsEditorProps {
  initialParts?: string[];
}

export function PartsEditor({ initialParts = [] }: PartsEditorProps) {
  const inputId = useId();
  const [parts, setParts] = useState<string[]>(initialParts);
  const [draft, setDraft] = useState('');

  function addPart() {
    const clean = draft.replace(/\s+/g, ' ').trim();

    if (!clean) return;

    setParts((current) => [...current, clean]);
    setDraft('');
  }

  function removePart(index: number) {
    setParts((current) => current.filter((_, position) => position !== index));
  }

  return (
    <div className="g-parts">
      <label htmlFor={inputId} className="g-label">
        Repuestos o trabajos
      </label>
      <p className="g-help">
        Agrega cada repuesto o trabajo realizado y presiónalo para quitarlo.
      </p>

      <div className="g-parts-row">
        <input
          id={inputId}
          className="g-input"
          type="text"
          value={draft}
          maxLength={120}
          placeholder="Ej. Aceite 5W-30"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addPart();
            }
          }}
        />
        <button
          type="button"
          className="g-parts-add"
          onClick={addPart}
          disabled={!draft.trim()}
          aria-label="Agregar repuesto"
        >
          <PlusIcon size={20} />
        </button>
      </div>

      {parts.length > 0 && (
        <ul className="g-parts-list">
          {parts.map((part, index) => (
            <li key={`${part}-${index}`} className="g-part-chip">
              <span>{part}</span>
              <button
                type="button"
                className="g-part-remove"
                onClick={() => removePart(index)}
                aria-label={`Quitar ${part}`}
              >
                <TrashIcon size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {parts.map((part, index) => (
        <input
          key={`hidden-${part}-${index}`}
          type="hidden"
          name="parts"
          value={part}
        />
      ))}
    </div>
  );
}
