import { GlassInput, GlassSelect } from '../../components/auth/GlassField';
import { FARMER_TYPES, FARM_SIZE_RANGES, EXPERIENCE_RANGES } from '../../data/locations';
import { useT } from '../../context/LanguageContext';

// Every field here is optional — a farmer can finish signing up without
// answering these, per the "don't overwhelm the user" guidance.
export default function SignupStepFarm({ form, setField }) {
    const t = useT();
    return (
        <div className="flex flex-col gap-4">
            <GlassSelect label={t('Farmer Type (optional)')} value={form.farmerProfile.farmerType} onChange={(e) => setField('farmerProfile.farmerType', e.target.value)}>
                <option value="">{t('Prefer not to say')}</option>
                {FARMER_TYPES.map((v) => (
                    <option key={v} value={v}>{t(v)}</option>
                ))}
            </GlassSelect>
            <GlassInput
                label={t('Primary Crop (optional)')}
                placeholder={t('e.g. Cotton, Wheat, Sugarcane')}
                value={form.farmerProfile.primaryCrop}
                onChange={(e) => setField('farmerProfile.primaryCrop', e.target.value)}
            />
            <GlassSelect label={t('Farm Size (optional)')} value={form.farmerProfile.farmSize} onChange={(e) => setField('farmerProfile.farmSize', e.target.value)}>
                <option value="">{t('Prefer not to say')}</option>
                {FARM_SIZE_RANGES.map((v) => (
                    <option key={v} value={v}>{t(v)}</option>
                ))}
            </GlassSelect>
            <GlassSelect label={t('Farming Experience (optional)')} value={form.farmerProfile.farmingExperience} onChange={(e) => setField('farmerProfile.farmingExperience', e.target.value)}>
                <option value="">{t('Prefer not to say')}</option>
                {EXPERIENCE_RANGES.map((v) => (
                    <option key={v} value={v}>{t(v)}</option>
                ))}
            </GlassSelect>
        </div>
    );
}
