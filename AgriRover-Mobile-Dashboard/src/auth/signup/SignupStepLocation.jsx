import { GlassInput, GlassSelect, GlassTextarea } from '../../components/auth/GlassField';
import { INDIAN_STATES } from '../../data/locations';
import { useT } from '../../context/LanguageContext';

export default function SignupStepLocation({ form, setField, errors, autoFilled = {} }) {
    const t = useT();
    return (
        <div className="flex flex-col gap-4">
            <GlassSelect
                label={t('State')}
                value={form.location.state}
                onChange={(e) => setField('location.state', e.target.value)}
                error={errors.state}
                autoFilled={autoFilled.state}
            >
                <option value="" disabled>{t('Select state')}</option>
                {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </GlassSelect>
            <GlassInput
                label={t('District')}
                placeholder={t('e.g. Mysuru')}
                value={form.location.district}
                onChange={(e) => setField('location.district', e.target.value)}
                error={errors.district}
                autoFilled={autoFilled.district}
            />
            <GlassInput
                label={t('Village / Town')}
                placeholder={t('e.g. Hunsur')}
                value={form.location.village}
                onChange={(e) => setField('location.village', e.target.value)}
                error={errors.village}
                autoFilled={autoFilled.village}
            />
            <GlassInput
                inputMode="numeric"
                label={t('PIN Code (optional)')}
                placeholder="571105"
                value={form.location.pinCode}
                onChange={(e) => setField('location.pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFilled={autoFilled.pinCode}
            />
            <GlassTextarea
                rows={3}
                label={t('Address (optional)')}
                placeholder={t('House / street / landmark')}
                value={form.location.address}
                onChange={(e) => setField('location.address', e.target.value)}
                autoFilled={autoFilled.address}
            />
        </div>
    );
}
