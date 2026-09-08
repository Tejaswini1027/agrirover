export default function Icon({ name, size = 20, className = '', fill = false }) {
    return (
        <span
            className={`msr ${className}`}
            style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 450, 'GRAD' 0, 'opsz' 24` }}
        >
            {name}
        </span>
    );
}
