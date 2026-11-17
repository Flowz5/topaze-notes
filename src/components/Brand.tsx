import gem from '../assets/gem.svg';

export default function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={`brand brand-${size}`}>
      <span className="brand-mark">
        <img src={gem} alt="" />
      </span>
      <span>
        Topaze <span className="brand-accent">Notes</span>
      </span>
    </span>
  );
}
