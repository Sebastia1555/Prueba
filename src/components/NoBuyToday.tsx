interface Props {
  analyzed: number
  qualityPassed: number
}

/**
 * Mensaje de disciplina Buffett: cuando ningún valor pasa calidad + margen de
 * seguridad, la app dice explícitamente que hoy no hay compra.
 */
export function NoBuyToday({ analyzed, qualityPassed }: Props) {
  return (
    <section
      className="ap-card overflow-hidden"
      style={{ boxShadow: 'var(--shadow-product)' }}
    >
      <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-[22px]"
          style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)' }}
        >
          ⏳
        </div>
        <h2 className="text-[26px] font-semibold tracking-[-0.03em]">
          Hoy no hay compra con margen de seguridad suficiente
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[17px] leading-relaxed text-[color:var(--ap-ink-2)]">
          Ningún valor del índice combina hoy calidad de negocio con un descuento del 25% o más sobre su
          valor intrínseco. Acumula liquidez o refuerza tu mejor idea existente. Comprar calidad cara o
          basura barata está prohibido por diseño.
        </p>
        <p className="mx-auto mt-4 max-w-md text-[13px] text-[color:var(--ap-ink-3)]">
          Analizados {analyzed} valores · {qualityPassed} pasan el filtro de calidad · 0 con margen de
          seguridad suficiente.
        </p>
      </div>
    </section>
  )
}
