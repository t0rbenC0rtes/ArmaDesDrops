// Shared UI Components - Button, Modal, ProgressBar, TwitchStatus, etc.

export function Button({ children, onClick, disabled, variant = 'primary' }) {
  return <button onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div>
      <h2>{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}

export function ProgressBar({ current, total, variant = 'primary' }) {
  return <div>Progress: {current} / {total} - Placeholder</div>;
}

export { TwitchStatus } from './TwitchStatus'
