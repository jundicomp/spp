export default function Modal({ title, subtitle, onClose, children, actions }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>{title}</h3>
        {subtitle && <p className="modal-sub">{subtitle}</p>}
        <div>{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}
