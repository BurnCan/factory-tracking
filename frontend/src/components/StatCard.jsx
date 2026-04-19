export default function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700 }}>{value}</div>
    </div>
  )
}
