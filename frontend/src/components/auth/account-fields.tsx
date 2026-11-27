'use client';

// Es cliente porque el formulario cambia en vivo al elegir "Taller": el
// nombre pasa a ser el del taller y el correo, el profesional. Las
// contraseñas y el envío siguen en el servidor.
import { useState } from 'react';
import { MailIcon, UserIcon } from '@/components/ui/icons';

export type AccountType = 'taller' | 'dueno' | '';

interface AccountFieldsProps {
  defaultType: AccountType;
  defaultName: string;
  defaultEmail: string;
}

export function AccountFields({
  defaultType,
  defaultName,
  defaultEmail,
}: AccountFieldsProps) {
  const [accountType, setAccountType] = useState<AccountType>(defaultType);
  const isWorkshop = accountType === 'taller';

  return (
    <>
      <fieldset className="g-account">
        <legend className="g-label">Tipo de cuenta:</legend>
        <div className="g-account-options">
          <label className="g-account-option">
            <input
              type="radio"
              name="accountType"
              value="taller"
              checked={isWorkshop}
              onChange={() => setAccountType('taller')}
              required
            />
            <span>Taller</span>
          </label>
          <label className="g-account-option">
            <input
              type="radio"
              name="accountType"
              value="dueno"
              checked={accountType === 'dueno'}
              onChange={() => setAccountType('dueno')}
              required
            />
            <span>Dueño</span>
          </label>
        </div>
      </fieldset>

      <div className="g-input-wrap">
        <label htmlFor="reg-name" className="g-sr-only">
          {isWorkshop ? 'Nombre del taller' : 'Nombre de usuario'}
        </label>
        <span className="g-input-icon">
          <UserIcon size={20} />
        </span>
        <input
          id="reg-name"
          className="g-input"
          type="text"
          name="username"
          placeholder={isWorkshop ? 'Nombre del taller' : 'Nombre de usuario'}
          defaultValue={defaultName}
          maxLength={60}
          autoComplete={isWorkshop ? 'organization' : 'username'}
          required
        />
      </div>

      <div className="g-input-wrap">
        <label htmlFor="reg-email" className="g-sr-only">
          {isWorkshop ? 'Correo profesional' : 'Correo electrónico'}
        </label>
        <span className="g-input-icon">
          <MailIcon size={20} />
        </span>
        <input
          id="reg-email"
          className="g-input"
          type="email"
          name="email"
          placeholder={isWorkshop ? 'Correo profesional' : 'Correo electrónico'}
          defaultValue={defaultEmail}
          autoComplete="email"
          required
        />
      </div>

      {isWorkshop && (
        <p className="g-help g-account-hint">
          Podrás completar la dirección y los datos del taller en su
          configuración.
        </p>
      )}
    </>
  );
}
