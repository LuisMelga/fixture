# Mundial 2026 · Fixture interactivo (TypeScript, full front)

App 100% frontend (sin backend) para seguir, predecir y compartir el Mundial 2026:
resultados en vivo desde ESPN, mejores terceros según el **Anexo C oficial de la FIFA** (495 combinaciones, verificado) y todo el cuadro de eliminatorias con definición por penales.

## Cómo correr

```bash
npm install
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm run build     # build de producción -> dist/
npm run preview   # sirve el build
npm run typecheck # solo chequeo de tipos
```

> La actualización en vivo hace `fetch` a la API pública de ESPN. Debe servirse por HTTP
> (con `npm run dev`/`preview` o cualquier hosting). Abrir el `index.html` con doble clic
> (`file://`) bloquea el `fetch` por CORS.

## Arquitectura (por capas)

Inspirada en Clean Architecture / separación de responsabilidades. Las dependencias
apuntan "hacia adentro": la UI depende del core/estado; el dominio no depende de nada.

```
src/
├── domain/        # Tipos puros del modelo (sin dependencias)
│   └── types.ts
├── data/          # Datos estáticos (selecciones, grupos, calendario, Anexo C)
│   ├── teams.ts  groups.ts  knockout.ts  annexC.ts  schedule.ts  aliases.ts
├── core/          # Lógica de dominio (funciones puras / servicios de dominio)
│   ├── util.ts            # normalización, saneo de goles, color
│   ├── teamInfo.ts        # nombre/color de selección
│   ├── standings.ts       # tabla + desempates FIFA Art. 13
│   ├── thirds.ts          # ranking de terceros + asignación Anexo C
│   ├── bracket.ts         # resolución de llaves (seeds, feeders, ganadores)
│   └── schedule.ts        # fechas, partidos en vivo
├── state/         # Estado de aplicación (Store observable + persistencia)
│   └── store.ts
├── services/      # Infraestructura externa
│   └── espn.ts            # descarga y mapeo de resultados reales
├── ui/            # Presentación (componentes que devuelven HTML + eventos delegados)
│   ├── dom.ts             # helpers de DOM, chip, delegación
│   ├── App.ts             # orquestador: shell, render, eventos, auto-modo
│   └── components/        # groups, thirds, knockout, live, route
├── styles/        # Sistema de diseño (tokens + base + componentes)
└── main.ts        # arranque
```

### Patrones aplicados
- **Store observable (pub/sub)** como única fuente de verdad, con persistencia
  (localStorage) y debounce.
- **Componentes de presentación puros**: funciones que reciben datos y devuelven HTML;
  los eventos se manejan por **delegación** en `App`, no listeners por nodo.
- **Capa de servicios** que aísla la API externa (ESPN) del dominio.
- **Dominio sin dependencias** (tipos) y **core de funciones puras** testeable.

## Notas de datos
- El Anexo C (`data/annexC.ts`) es la tabla oficial FIFA verificada (495/495).
- Desempates de grupo: FIFA Art. 13 (puntos → enfrentamiento directo → DG → GF → DG/GF
  general → desempate determinista).
- Goles validados a 2 dígitos (0–99) en toda la app.
