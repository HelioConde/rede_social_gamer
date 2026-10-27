export function Avatar({ person, size='md' }) {
  const name = person?.name || 'Jogador';
  return <span className={'avatar avatar--'+size} style={{'--avatar-color':person?.color || '#6755e8'}} aria-label={name} role="img">
    {person?.avatar || name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase()}
    {person?.online && <i className="online-dot" aria-label="Online" />}
  </span>;
}