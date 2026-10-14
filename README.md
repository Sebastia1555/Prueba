# Cuidamos

Aplicación web (instalable en el móvil) para que hermanos, familiares y cuidadores se organicen en el cuidado de
una persona mayor: quién está con ella en cada momento, qué medicación toca, cuándo hay que comprarla, quién la
acompaña al médico y dónde están todos los informes.

## Funcionalidades

- **Hoy**: quién está ahora con la persona cuidada y quién viene después, avisos pendientes (huecos sin cubrir,
  turnos que buscan sustituto, tomas atrasadas, medicación que se acaba, recetas que caducan, citas sin
  acompañante), tus próximos turnos, las citas y las últimas notas del diario.
- **Agenda de turnos**: franjas configurables (mañana, tarde, noche…), vista semanal y mensual, huecos sin cubrir
  en rojo, «Me lo quedo», turnos semanales fijos, «Pedir sustituto» / «Lo cubro yo» y un **reparto automático**
  que propone a quien está libre y lleva menos horas en el mes. Resumen de horas por persona para que el reparto
  sea justo.
- **Disponibilidad y calendarios personales**: cada persona marca sus compromisos fijos (p. ej. «tenis de los
  niños, martes 17–19») y ausencias (vacaciones), e importa su calendario de Google, Apple u Outlook (archivo `.ics`
  o enlace). Al asignar un turno o un acompañante se ve quién está libre y quién no. Lo privado se muestra a los
  demás solo como «Ocupado». Los turnos y citas se pueden descargar en `.ics` para llevarlos al calendario propio.
- **Medicación**: pauta por horas (admite medio comprimido, días concretos o «cada X días», tratamientos con fecha
  de fin y «si precisa»), registro de cada toma (quién la dio y a qué hora, o por qué no se tomó), **stock**
  estimado con la pauta, fecha en que se acaba, «Me encargo de comprarlo», registro de compras (opcionalmente como
  gasto compartido), recuentos y caducidad de recetas. Hoja de medicación imprimible con registro semanal en papel.
- **Citas médicas**: acompañante (viendo su disponibilidad), transporte, preparación (ayunas…), preguntas para el
  médico, resumen de lo que dijo y próximos pasos, documentos adjuntos y exportación al calendario.
- **Documentos**: informes, analíticas, pruebas, recetas y papeles administrativos (PDF, fotos…), con filtros,
  búsqueda y visor.
- **Diario**: notas de cada turno (comida, sueño, ánimo, caídas, incidencias) para el traspaso entre cuidadores.
- **Gastos compartidos**: quién ha pagado qué, saldos y las transferencias mínimas para quedar en paz.
- **Ficha de emergencia**: alergias, enfermedades, medicación actual, médico, tarjeta sanitaria y contactos con
  botón de llamada; imprimible.
- **Cámaras (próximamente)**: sección para ver en directo las cámaras de casa de la persona cuidada, saber quién
  llama o abre la puerta y recibir avisos de posibles caídas. De momento muestra cómo se verá y permite apuntar qué
  cámaras hay (dónde, marca y modelo, con qué app se ven hoy). Solo la ven administradores y familiares.
- **Roles**: administrador/a (todo), familiar (todo salvo la pauta, los roles y los ajustes) y cuidador/a (agenda,
  tomas, diario, citas y ficha; sin gastos, documentos ni cámaras).

## Datos

Esta es una **versión de prueba sin servidor**: todo (también los documentos) se guarda en el navegador del
dispositivo con IndexedDB. Para pasar los datos a otro dispositivo se usa **Ajustes → Descargar copia** y
**Restaurar copia**. Cualquiera puede cambiar de perfil desde el avatar de arriba.

Desde la pantalla de bienvenida o desde Ajustes se pueden cargar **datos de ejemplo** (una madre cuidada por tres
hermanos y una cuidadora).

### Siguientes pasos para usarla en familia de verdad

- Sincronización en la nube con una cuenta por persona (p. ej. Supabase: base de datos, login y almacenamiento de
  documentos), con permisos por rol aplicados en el servidor.
- Suscripción a calendarios personales desde el servidor (sin las limitaciones del navegador) y enlace de
  suscripción a la agenda de cuidados para que se actualice sola en el calendario de cada uno.
- Notificaciones push (toma atrasada, turno sin cubrir, cita mañana…).
- Integración de cámaras: vista en directo (RTSP/ONVIF a través de un servidor que lo convierta a WebRTC/HLS, o las
  APIs de cada fabricante como Google Nest Device Access o Ring), eventos del timbre con foto apuntados en el diario,
  avisos de caída o de falta de movimiento a quien esté de turno, grabación de los avisos y registro de quién mira cada
  cámara. Antes de conectarlas: contar con la persona cuidada y, si hay cuidadora contratada, informarle antes y de
  forma clara de que hay cámaras, dónde están y para qué sirven (mejor por escrito y firmado); nunca en su habitación.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción (incluye chequeo de tipos)
npm run lint     # oxlint
```
