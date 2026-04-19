function getSlotLabel(containerCode, slotNumber) {
  return `${containerCode}-${slotNumber}`
}

export default function SlotGrid({ containerCode, slots, onSelectSlot }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px'
      }}
    >
      {slots.map((slot) => {
        const occupied = Boolean(slot.part_number)
        const slotLabel = getSlotLabel(containerCode, slot.slot_number)

        return (
          <button
            key={slotLabel}
            onClick={() => onSelectSlot(slot)}
            style={{
              border: occupied ? '1px solid #86efac' : '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '14px',
              background: occupied ? '#f0fdf4' : 'white',
              textAlign: 'left',
              cursor: 'pointer',
              minHeight: '92px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>{slotLabel}</div>
            <div style={{ color: occupied ? '#166534' : '#6b7280', wordBreak: 'break-word' }}>
              {slot.part_number || 'Empty'}
            </div>
          </button>
        )
      })}
    </div>
  )
}
