# Digitalizar la Historia Clínica — Hospital de Clínicas San Jorge

## 1. ¿Word primero? No.

Word sirve para **escribir documentos**, no para **capturar datos**. Si pasas la hoja a Word obtienes
un papel más bonito, pero sigues sin poder:

- buscar "pacientes con TA ≥ 140/90",
- contar cuántas consultas hubo en el mes,
- saber qué paciente tiene alergia a penicilina,
- evitar que dos personas escriban la misma historia a la vez.

Eso solo se logra cuando cada dato queda en **un campo separado** (estructura), no dentro de un párrafo.

Orden correcto:

| Nivel | Qué es | Cuándo conviene |
|---|---|---|
| 1 | Escanear / foto → PDF | Solo respaldo legal del papel original. **Hazlo igual**, siempre. |
| 2 | Word / PDF rellenable | Si únicamente quieres imprimir más rápido. No digitaliza nada. |
| 3 | **Formulario web** (esto) | Captura real de datos: se puede buscar, imprimir, respaldar en Word/PDF y conectar a base de datos. |
| 4 | Sistema con base de datos + usuarios | Varias personas, varias sedes, expediente histórico del paciente. |

Estás en el paso 3. El 4 es el siguiente, y se construye **sobre** el 3 (el formulario ya no se tira).

## 2. Lo que ya está hecho

`historia-clinica/index.html` — un solo archivo, sin instalación, sin internet, sin dependencias.

- La **hoja 1** tiene exactamente los campos del formulario de la clínica, sin agregados
  (ver detalle en la sección 3).
- Reproduce las hojas del hospital: datos generales, antecedentes, familiares, ocupacionales,
  **signos vitales** (tabla que crece), **evolución** y **reporte de enfermería** (tablas que crecen).
- **Alertas automáticas** bajo los signos vitales: crisis hipertensiva, taquicardia, fiebre,
  hipoxemia. Se imprimen junto con la hoja.
- **Documentos adjuntos**: escaneo de la hoja firmada, laboratorios, RX, consentimientos
  (PDF/JPG/PNG hasta 15 MB). Se guardan en IndexedDB, en ese equipo.
- **Validaciones**: nombre obligatorio; avisa si la fecha de nacimiento es posterior al ingreso
  o si la edad está fuera de rango.
- Calcula la **edad** desde la fecha de nacimiento.
- **Autoguardado** en el navegador mientras escribes + botón *Guardar* (detecta expediente duplicado).
- **Barra lateral de pacientes**: lista los pacientes y, dentro de cada uno, todas sus historias.
  Tiene buscador por nombre (y por expediente) y botón para crear una historia nueva.
- **Historial por paciente**: al abrir un paciente ves sus consultas por fecha; puedes abrir
  cualquiera o agregarle una historia nueva sin volver a escribir el nombre.
- **Imprimir / PDF** en A4: oculta botones, campos vacíos y placeholders; agrega pie con fecha de impresión.
  El PDF se obtiene en el diálogo de impresión del navegador eligiendo *Guardar como PDF*.
- **Word**: descarga un `.doc` con la historia completa maquetada en tablas, listo para abrir en Word.

### Atajos
`Ctrl + S` guardar · `Ctrl + P` imprimir

### Cómo usarlo
1. Doble clic en `historia-clinica/index.html` (se abre en Chrome/Edge).
2. Llena la historia. Se guarda sola como borrador.
3. Botón **Guardar**: archiva la historia en el paciente.
   - Si era una **historia nueva**, el formulario se limpia y queda listo para la siguiente persona.
   - Si estabas **editando** una historia abierta desde la barra, se queda abierta con los cambios ya guardados.
4. **Imprimir / PDF** para el papel o el PDF; **Word** para el `.doc`.
5. Adjunta el escaneo de la hoja firmada en la sección **VIII** (después de guardar la historia).

### La barra lateral
- **＋ Nueva historia**: empieza un formulario en blanco. El paciente se crea al guardar.
- **Buscar paciente por nombre**: filtra la lista mientras escribes (sin distinguir mayúsculas ni tildes;
  también encuentra por número de expediente).
- **Clic en un paciente**: despliega sus historias, de la más reciente a la más antigua, con fecha,
  expediente y edad. El botón **✕** borra una historia (y sus adjuntos).
- **Clic en una historia**: la carga en el formulario para verla o corregirla; al guardar se
  actualiza esa misma historia, no se crea otra.
- **＋ Nueva historia para este paciente**: abre un formulario en blanco con el nombre ya puesto, de modo
  que la nueva consulta queda dentro del historial de ese mismo paciente.
- La barra está **siempre visible**, fija al costado mientras te desplazas por el formulario.
  En pantallas angostas se reduce de ancho; en el teléfono pasa arriba del formulario.
  No es una ventana emergente ni tapa la hoja.

> Los datos viven **solo en ese navegador de ese equipo** (localStorage + IndexedDB). Si se limpia
> el historial del navegador, se pierden. Ya no hay exportación JSON: el único respaldo digital es
> el Word/PDF que imprimas o descargues. Guarda una copia de esos archivos fuera del equipo.

## 3. Las 5 hojas = un solo registro

Una historia clínica es **un paciente**, aunque ocupe 5 hojas. En el formulario las 5 entran en
**un único registro** guardado. Un paciente puede tener **varios registros** (una consulta por
registro); la barra lateral los agrupa bajo su nombre:

| Hoja | Qué es (en papel) | Dónde se registra |
|---|---|---|
| 1 | Historia Clínica: datos generales, antecedentes patológicos, familiares, ocupacionales | Secciones **I, II, III, IV** |
| 2 | Signos vitales | Sección **V** |
| 3 | Reporte de Enfermería | Sección **VII** |
| 4 | Evolución | Sección **VI** |

> La **hoja 5** (examen físico, laboratorio e impresión diagnóstica) **no está digitada**: por indicación
> del usuario se quitaron esas dos secciones junto con el CIE-10, el destino y el plan.

La numeración romana de la app (I–X) es solo el índice interno del formulario; no tiene que coincidir
con la numeración impresa en la hoja del hospital.

### Detalle de la hoja 1

La hoja 1 tiene **exactamente** los campos del formulario de la clínica, sin agregados:

**I.** Nombre y apellido · Edad · Fecha de nacimiento · Profesión · Empresa · Cargo propuesto.

**II.** Un solo campo de texto libre para *antecedentes patológicos (médicos) – quirúrgicos –
accidentes*, igual que los renglones del papel. Debajo, **Hábitos**: cigarrillos (sí / no, N.° al día,
edad en que comenzó), alcohol (sí / no / socialmente / a diario), otras drogas (sí / no, cuál),
sueño (horas diarias, normal / irregular), hobby, actividad física – deportes y dieta.

**III.** Padre · Madre · Hermanos/as · Pacientes consanguíneos (abuelos, tíos, primos), y las casillas
pulmonares, cáncer, diabetes, cardiopatía, hipertensión, malformaciones congénitas, e. osteomusculares,
epilepsia, lues, atopia, farmacodependencia, trastornos mentales y otras.

**IV.** Un campo de texto para *empresas, ocupación, riesgos, puesto de trabajo actual, protección
personal y colectiva, ocupación extra empresa, servicio militar*.

> Se quitaron los campos que había agregado antes y que no están en el papel (sexo, motivo de consulta,
> identidad, estado civil, teléfono, procedencia, escolaridad, religión, acompañante, habitación, cama,
> turno, y los antecedentes separados por tipo). Con eso también salió la barra roja de alergia, que
> dependía de un campo de alergias que ya no existe. Si algún día quieres recuperar alguno, se vuelve
> a poner.

**Importante:** al ser el mismo paciente, las inconsistencias que detecté entre hojas
(47 vs 57 años, 10/10/26 vs 19/10/2026) son **errores dentro del mismo expediente**, no pacientes
distintos. Justamente es el tipo de cosa que un formulario digital obliga a resolver.

### Borrador de transcripción

`ejemplo-transcripcion.json` — las hojas 1 a 4 ya consolidadas. Ya **no se puede importar** desde la
app (se quitó Exportar/Importar JSON); queda como referencia para copiar los datos a mano. Contiene
**solo lo legible** y marca lo dudoso con `[?]`.

**Advertencia: la letra es difícil y hay datos contradictorios entre hojas. Todo lo marcado `[?]`
debe verificarse contra el original antes de darlo por bueno. No se inventó ningún valor.**

### Hoja 1 — Historia Clínica
- Fecha: **19 de octubre de 2026**
- Nombres y apellidos: `N… Mauder [?]` (ilegible el primer nombre)
- Edad: **57** · Sexo: **F**
- Fecha de nacimiento: `06-07-1969 [?]` — en la foto parece terminar en "2009", incompatible con 57 años. **Corregir.**
- Profesión / procedencia: ilegibles `[?]`
- Motivo de consulta: consulta electiva para valoración por Cirugía / Traumatología `[?]`
- Alergias: **niega** · Quirúrgicos: **niega** · Hospitalización: **niega**
- Tabaco: **no** · Alcohol: **no** · Otras drogas: **no**
- Antecedentes familiares: **sin datos registrados**
- Ocupacionales: niega alergias / niega antecedentes patológicos de importancia / niega quirúrgicos-traumatológicos

### Hoja 2 — Signos vitales
Paciente en habitación `[?]`, cama `N° 3`. Firma: *Jenny R.*

| Hora | TA | Pulso | Resp. |
|---|---|---|---|
| 10:00 am | 140/90 | 85 | 22 `[?]` |
| 3:00 pm | 130/80 | 85 | — |

### Hoja 3 — Reporte de enfermería
- Fecha al pie: **10/10/26** → **no coincide** con el 19/10/2026 de la hoja 1. Verificar cuál es la correcta.
- "Paciente femenina de **47 años**" `[?]` → tampoco coincide con los 57 de la hoja 1.
- Procedente de comunidad `[ilegible]`, traída por dolor `[?]` de 3 días de evolución.
- Se indica solución **0.9 % 500 ml EV a 40 gotas/min**.
- TA 140/90 · FC 85 · FR 22 `[?]` · T 37.5 °C `[?]`

### Hoja 4 — Examen físico (formato preimpreso)
- Peso / talla: `53.5 kg [?]` · `1.50 m [?]`
- Casi todos los aparatos y sistemas están descritos pero **ilegibles** en la foto.
- Impresión diagnóstica: dos puntos numerados, ilegibles.
- Al pie: "Se da cita para resultados de estudios" `[?]`

**Conclusión:** de estas fotos se pueden rescatar con seguridad los signos vitales y la negación de
antecedentes. El resto necesita el papel a la vista o una foto con mejor luz y sin inclinación
(hoja plana, luz de arriba, cámara perpendicular).

## 4. Siguiente paso técnico (cuando quieras)

1. **Base de datos**: guardar los registros en Supabase / Firebase / un backend propio, en vez de localStorage.
2. **Login por usuario** (médico, enfermería, recepción) y registro de quién modificó qué.
3. **Búsqueda avanzada** por identidad, edad y fecha (hoy se busca por nombre y expediente);
   índice de pacientes con su historial completo — la agrupación por paciente ya existe, pero vive
   en este equipo.
4. **Plantillas de evolución** y de recetas para no escribir lo mismo cada vez.
5. **Verificación de transcripción**: marcar los campos dudosos (`[?]`) y llevar control de quién los validó.

## 5. Privacidad (importante)

Esto es un **expediente clínico real**. Mientras sea un archivo local está bien; el día que lo subas a
internet necesitas: HTTPS, login, permisos por rol, respaldo cifrado y registro de accesos.
No lo subas a GitHub, ni a un hosting público, ni lo compartas por WhatsApp para "probar".
Los Word/PDF exportados y `ejemplo-transcripcion.json` contienen datos identificables del paciente.
