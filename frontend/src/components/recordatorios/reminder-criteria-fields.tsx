'use client';

import { useId, useState } from 'react';
import { formatMiles } from '@/lib/garaje-formato';

interface ReminderCriteriaFieldsProps {
  currentKilometers: number;
  today: string;
}

export function ReminderCriteriaFields({
  currentKilometers,
  today,
}: ReminderCriteriaFieldsProps) {
  const baseId = useId();
  const [criteria, setCriteria] = useState<'due_date' | 'due_kilometers'>(
    'due_date',
  );
  const [recurring, setRecurring] = useState(false);

  const kilometers = formatMiles(currentKilometers);

  return (
    <>
      <fieldset className="g-gest-choices">
        <legend className="g-label">Avisarme por</legend>
        <div className="g-gest-choice-row">
          <label className="g-gest-choice">
            <input
              type="radio"
              name="criteria"
              value="due_date"
              checked={criteria === 'due_date'}
              onChange={() => setCriteria('due_date')}
            />
            <span>Fecha</span>
          </label>
          <label className="g-gest-choice">
            <input
              type="radio"
              name="criteria"
              value="due_kilometers"
              checked={criteria === 'due_kilometers'}
              onChange={() => setCriteria('due_kilometers')}
            />
            <span>Kilometraje</span>
          </label>
        </div>
      </fieldset>

      {criteria === 'due_date' ? (
        <div className="g-field">
          <label htmlFor={`${baseId}-date`} className="g-label">
            Fecha límite *
          </label>
          <input
            id={`${baseId}-date`}
            className="g-input"
            type="date"
            name="dueDate"
            min={today}
            required
          />
        </div>
      ) : (
        <div className="g-field">
          <label htmlFor={`${baseId}-km`} className="g-label">
            Kilometraje límite *
          </label>
          <input
            id={`${baseId}-km`}
            className="g-input"
            type="number"
            name="dueKilometers"
            min={currentKilometers + 1}
            step={1}
            inputMode="numeric"
            placeholder={String(currentKilometers + 5000)}
            required
          />
          <p className="g-help">
            Tu vehículo tiene {kilometers} km. El límite debe ser mayor.
          </p>
        </div>
      )}

      <label className="g-rem-check">
        <input
          type="checkbox"
          name="recurring"
          checked={recurring}
          onChange={(event) => setRecurring(event.target.checked)}
        />
        <span>Repetir este recordatorio al completarlo</span>
      </label>

      {recurring && criteria === 'due_date' && (
        <div className="g-field">
          <label htmlFor={`${baseId}-days`} className="g-label">
            Repetir cada *
          </label>
          <div className="g-gest-field-row">
            <input
              id={`${baseId}-days`}
              className="g-input"
              type="number"
              name="recurrenceDays"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="90"
              required
            />
            <span className="g-gest-field-unit">días</span>
          </div>
        </div>
      )}

      {recurring && criteria === 'due_kilometers' && (
        <div className="g-field">
          <label htmlFor={`${baseId}-recurrence-km`} className="g-label">
            Repetir cada *
          </label>
          <div className="g-gest-field-row">
            <input
              id={`${baseId}-recurrence-km`}
              className="g-input"
              type="number"
              name="recurrenceKm"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="5000"
              required
            />
            <span className="g-gest-field-unit">km</span>
          </div>
        </div>
      )}
    </>
  );
}
