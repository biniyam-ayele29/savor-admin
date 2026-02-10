import { Sun, Moon } from 'lucide-react';
import { useTheme } from './useTheme';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="nav-link"
            style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s ease',
                marginTop: '0.5rem',
            }}
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? (
                <>
                    <Moon size={20} />
                    <span>Dark Mode</span>
                </>
            ) : (
                <>
                    <Sun size={20} />
                    <span>Light Mode</span>
                </>
            )}
        </button>
    );
};

export default ThemeToggle;
