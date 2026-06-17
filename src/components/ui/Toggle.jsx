export default function Toggle({ enabled, onChange, disabled = false, size = 'md' }) {
  const sizes = {
    sm: {
      button: 'w-9 h-5',
      circle: 'w-3.5 h-3.5',
      translate: 'translate-x-4',
    },
    md: {
      button: 'w-11 h-6',
      circle: 'w-4.5 h-4.5',
      translate: 'translate-x-5',
    },
  };

  const { button, circle, translate } = sizes[size];

  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        ${button} rounded-full relative transition-all duration-300
        ${enabled 
          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md shadow-cyan-500/25' 
          : 'bg-slate-300 dark:bg-slate-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
      `}
    >
      <div
        className={`
          ${circle} bg-white rounded-full shadow-sm absolute top-1/2 -translate-y-1/2 left-0.5
          transform transition-transform duration-300 ease-out
          ${enabled ? translate : 'translate-x-0'}
        `}
      />
    </button>
  );
}