import { motion } from 'framer-motion';
import Icon from '../../components/Icon';
import { useT } from '../../context/LanguageContext';

function Row({ label, value, muted }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/8 last:border-b-0">
            <span className="text-[12px] text-white/45 shrink-0">{label}</span>
            <span className={`text-[13px] text-right leading-snug ${muted ? 'text-white/30 italic' : 'text-white/90'}`}>
                {value}
            </span>
        </div>
    );
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SignupStepReview({ form, aadhaarLast4, onEdit, onSubmit, busy, error }) {
    const t = useT();
    const notProvided = t('Not provided');

    const genderLabel = { male: t('Male'), female: t('Female'), other: t('Other') }[form.gender] || notProvided;

    const farm = form.farmerProfile;
    const hasFarmInfo = farm.farmerType || farm.primaryCrop || farm.farmSize || farm.farmingExperience;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-center">
                <h3 className="text-[15px] font-semibold text-white">{t('Review your information')}</h3>
                <p className="text-[12px] text-white/45">{t('Please check that everything is correct before saving.')}</p>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl bg-accent/10 border border-accent/25 px-4 py-3">
                <Icon name="check_circle" size={18} className="text-accent" />
                <span className="text-[12px] text-white/80 font-medium">{t('Face registration complete')}</span>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-1.5">
                <Row label={t('Name')} value={form.fullName || notProvided} muted={!form.fullName} />
                <Row label={t('Date of Birth')} value={formatDate(form.dateOfBirth) || notProvided} muted={!form.dateOfBirth} />
                <Row label={t('Gender')} value={genderLabel} muted={!form.gender} />
                <Row label={t('Mobile')} value={form.contact.phone || notProvided} muted={!form.contact.phone} />
                {form.contact.email && <Row label={t('Email')} value={form.contact.email} />}
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-1.5">
                <Row label={t('State')} value={form.location.state || notProvided} muted={!form.location.state} />
                <Row label={t('District')} value={form.location.district || notProvided} muted={!form.location.district} />
                <Row label={t('Village / Town')} value={form.location.village || notProvided} muted={!form.location.village} />
                {form.location.pinCode && <Row label={t('PIN Code')} value={form.location.pinCode} />}
                {form.location.address && <Row label={t('Address')} value={form.location.address} />}
            </div>

            {hasFarmInfo && (
                <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-1.5">
                    {farm.farmerType && <Row label={t('Farmer Type')} value={farm.farmerType} />}
                    {farm.primaryCrop && <Row label={t('Primary Crop')} value={farm.primaryCrop} />}
                    {farm.farmSize && <Row label={t('Farm Size')} value={farm.farmSize} />}
                    {farm.farmingExperience && <Row label={t('Experience')} value={farm.farmingExperience} />}
                </div>
            )}

            {aadhaarLast4 && (
                <p className="text-[11px] text-white/30 text-center">
                    {t('Scanned card ending in')} ••••{aadhaarLast4}
                </p>
            )}

            {error && (
                <motion.p
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: [0, -5, 5, -3, 3, 0] }}
                    transition={{ duration: 0.4 }}
                    className="text-[12px] text-rose text-center"
                >
                    {error}
                </motion.p>
            )}

            <div className="flex flex-col gap-2.5">
                <motion.button
                    onClick={onSubmit}
                    disabled={busy}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-accent-ink text-[15px] font-bold disabled:opacity-60"
                >
                    {busy ? (
                        <>
                            <Icon name="progress_activity" size={17} className="animate-spin" />
                            {t('Creating your profile…')}
                        </>
                    ) : (
                        t('Everything is Correct — Save')
                    )}
                </motion.button>
                <button
                    onClick={onEdit}
                    disabled={busy}
                    className="w-full py-3.5 rounded-2xl agv-glass-input text-sm font-semibold disabled:opacity-50"
                >
                    {t('Edit Details')}
                </button>
            </div>
        </div>
    );
}
