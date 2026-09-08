import { GlassInput, GlassSelect } from '../../components/auth/GlassField';
import { useT } from '../../context/LanguageContext';

export default function SignupStepPersonal({ form, setField, errors, autoFilled = {} }) {
    const t = useT();
    return (
        <div className="flex flex-col gap-4">
            <GlassInput
                label={t('Full Name')}
                placeholder={t('e.g. Ramesh Kumar')}
                value={form.fullName}
                onChange={(e) => setField('fullName', e.target.value)}
                error={errors.fullName}
                autoFilled={autoFilled.fullName}
            />
            <GlassInput
                type="date"
                label={t('Date of Birth')}
                value={form.dateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setField('dateOfBirth', e.target.value)}
                error={errors.dateOfBirth}
                autoFilled={autoFilled.dateOfBirth}
            />
            <GlassSelect
                label={t('Gender')}
                value={form.gender}
                onChange={(e) => setField('gender', e.target.value)}
                error={errors.gender}
                autoFilled={autoFilled.gender}
            >
                <option value="" disabled>{t('Select gender')}</option>
                <option value="male">{t('Male')}</option>
                <option value="female">{t('Female')}</option>
                <option value="other">{t('Other')}</option>
            </GlassSelect>
            <GlassInput
                type="tel"
                inputMode="numeric"
                label={t('Mobile Number')}
                placeholder="9876543210"
                value={form.contact.phone}
                onChange={(e) => setField('contact.phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                error={errors.phone}
            />
            <GlassInput
                type="email"
                label={t('Email Address (optional)')}
                placeholder="you@example.com"
                value={form.contact.email}
                onChange={(e) => setField('contact.email', e.target.value)}
            />
        </div>
    );
}
