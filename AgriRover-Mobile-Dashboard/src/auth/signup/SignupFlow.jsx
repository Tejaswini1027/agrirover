import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/Icon';
import { useAuth } from '../../context/AuthContext';
import { useT } from '../../context/LanguageContext';
import { isValidFullName, isValidDOB, isValidPhone, isNonEmpty } from '../../utils/validation';
import OnboardingProgress from './OnboardingProgress';
import SignupStepFace from './SignupStepFace';
import SignupStepScan from './SignupStepScan';
import SignupStepPersonal from './SignupStepPersonal';
import SignupStepLocation from './SignupStepLocation';
import SignupStepFarm from './SignupStepFarm';
import SignupStepReview from './SignupStepReview';

const STEP = {
    FACE: 'face',
    SCAN: 'scan',
    PERSONAL: 'personal',
    LOCATION: 'location',
    FARM: 'farm',
    REVIEW: 'review',
};

// Which of the three progress phases each screen belongs to.
const STEP_PHASE = {
    [STEP.FACE]: 0,
    [STEP.SCAN]: 1,
    [STEP.PERSONAL]: 1,
    [STEP.LOCATION]: 1,
    [STEP.FARM]: 1,
    [STEP.REVIEW]: 2,
};

const STEP_TITLE = {
    [STEP.FACE]: 'Secure your account',
    [STEP.SCAN]: 'Your details',
    [STEP.PERSONAL]: 'Personal details',
    [STEP.LOCATION]: 'Where you farm',
    [STEP.FARM]: 'About your farm',
    [STEP.REVIEW]: 'Almost done',
};

const initialForm = {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    location: { country: 'India', state: '', district: '', village: '', address: '', pinCode: '' },
    contact: { phone: '', email: '' },
    farmerProfile: { farmerType: '', primaryCrop: '', farmSize: '', farmingExperience: '' },
};

function setDeep(obj, path, value) {
    const keys = path.split('.');
    const next = { ...obj };
    let cursor = next;
    for (let i = 0; i < keys.length - 1; i++) {
        cursor[keys[i]] = { ...cursor[keys[i]] };
        cursor = cursor[keys[i]];
    }
    cursor[keys[keys.length - 1]] = value;
    return next;
}

function validate(step, form) {
    const errors = {};
    if (step === STEP.PERSONAL) {
        if (!isValidFullName(form.fullName)) errors.fullName = 'Please enter your full name.';
        if (!isValidDOB(form.dateOfBirth)) errors.dateOfBirth = 'Please enter a valid date of birth.';
        if (!form.gender) errors.gender = 'Please select a gender.';
        if (!isValidPhone(form.contact.phone)) errors.phone = 'Please enter a valid 10-digit mobile number.';
    } else if (step === STEP.LOCATION) {
        if (!isNonEmpty(form.location.state)) errors.state = 'Please select your state.';
        if (!isNonEmpty(form.location.district)) errors.district = 'Please enter your district.';
        if (!isNonEmpty(form.location.village)) errors.village = 'Please enter your village or town.';
    }
    return errors;
}

export default function SignupFlow() {
    const t = useT();
    const { signup } = useAuth();

    const [step, setStep] = useState(STEP.FACE);
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [autoFilled, setAutoFilled] = useState({});
    const [aadhaarLast4, setAadhaarLast4] = useState('');
    const [documentScanned, setDocumentScanned] = useState(false);
    const [busy, setBusy] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const setField = (path, value) => setForm((f) => setDeep(f, path, value));

    // OCR results only ever pre-fill the form. Nothing is saved here — the
    // user still walks through every field and confirms on the review screen.
    const handleExtracted = (fields, confidence) => {
        const filled = {};
        setForm((f) => {
            let next = { ...f };
            const put = (path, value, key) => {
                if (!value) return;
                next = setDeep(next, path, value);
                filled[key] = true;
            };
            // Only pre-fill fields the parser was actually confident about;
            // low-confidence guesses are left blank for the user to type,
            // rather than quietly seeding the form with likely-wrong text.
            if (confidence?.fullName) put('fullName', fields.fullName, 'fullName');
            if (confidence?.dateOfBirth) put('dateOfBirth', fields.dateOfBirth, 'dateOfBirth');
            if (confidence?.gender) put('gender', fields.gender, 'gender');
            if (confidence?.state) put('location.state', fields.state, 'state');
            if (confidence?.pinCode) put('location.pinCode', fields.pinCode, 'pinCode');
            // Address is never confidently parsed, but a rough block is still
            // a useful starting point for the user to correct.
            if (fields.address) put('location.address', fields.address, 'address');
            return next;
        });
        setAutoFilled(filled);
        setAadhaarLast4(fields.aadhaarLast4 || '');
        setDocumentScanned(true);
        setStep(STEP.PERSONAL);
    };

    const handleManual = () => {
        setAutoFilled({});
        setDocumentScanned(false);
        setStep(STEP.PERSONAL);
    };

    const goNext = () => {
        const stepErrors = validate(step, form);
        setErrors(stepErrors);
        if (Object.keys(stepErrors).length > 0) return;

        if (step === STEP.PERSONAL) setStep(STEP.LOCATION);
        else if (step === STEP.LOCATION) setStep(STEP.FARM);
        else if (step === STEP.FARM) setStep(STEP.REVIEW);
    };

    const goBack = () => {
        if (step === STEP.PERSONAL) setStep(STEP.SCAN);
        else if (step === STEP.LOCATION) setStep(STEP.PERSONAL);
        else if (step === STEP.FARM) setStep(STEP.LOCATION);
        else if (step === STEP.REVIEW) setStep(STEP.FARM);
    };

    const handleSubmit = async () => {
        setSubmitError('');
        setBusy(true);
        try {
            await signup({
                ...form,
                faceDescriptor,
                aadhaarLast4,
                onboarding: { documentScanned },
            });
        } catch (err) {
            setSubmitError(err.message);
            setBusy(false);
        }
    };

    const showNav = step === STEP.PERSONAL || step === STEP.LOCATION || step === STEP.FARM;

    return (
        <div className="flex flex-col gap-1">
            <OnboardingProgress phase={STEP_PHASE[step]} />

            <h2 className="font-display font-bold text-lg text-white mb-3">{t(STEP_TITLE[step])}</h2>

            {/* Deliberately NOT an AnimatePresence with mode="wait". Waiting for
                an exit animation before mounting the next step means a fast
                double-tap (very easy on a phone) can strand the outgoing step in
                the DOM while the header already shows the new one. Swapping
                immediately and animating only the entrance is simpler and cannot
                get stuck. */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {step === STEP.FACE && (
                        <SignupStepFace
                            descriptor={faceDescriptor}
                            onCapture={setFaceDescriptor}
                            onContinue={() => setStep(STEP.SCAN)}
                        />
                    )}
                    {step === STEP.SCAN && (
                        <SignupStepScan onExtracted={handleExtracted} onManual={handleManual} />
                    )}
                    {step === STEP.PERSONAL && (
                        <SignupStepPersonal form={form} setField={setField} errors={errors} autoFilled={autoFilled} />
                    )}
                    {step === STEP.LOCATION && (
                        <SignupStepLocation form={form} setField={setField} errors={errors} autoFilled={autoFilled} />
                    )}
                    {step === STEP.FARM && (
                        <SignupStepFarm form={form} setField={setField} />
                    )}
                    {step === STEP.REVIEW && (
                        <SignupStepReview
                            form={form}
                            aadhaarLast4={aadhaarLast4}
                            onEdit={() => setStep(STEP.PERSONAL)}
                            onSubmit={handleSubmit}
                            busy={busy}
                            error={submitError}
                        />
                    )}
                </motion.div>

            {showNav && (
                <div className="flex items-center gap-3 mt-5">
                    <motion.button
                        onClick={goBack}
                        whileTap={{ scale: 0.96 }}
                        className="flex-1 py-3.5 rounded-2xl agv-glass-input text-sm font-semibold"
                    >
                        {t('Back')}
                    </motion.button>
                    <motion.button
                        onClick={goNext}
                        whileTap={{ scale: 0.96 }}
                        className="flex-[2] flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-accent text-accent-ink text-sm font-bold"
                    >
                        {step === STEP.FARM ? t('Review') : t('Continue')}
                        <Icon name="arrow_forward" size={16} />
                    </motion.button>
                </div>
            )}
        </div>
    );
}
