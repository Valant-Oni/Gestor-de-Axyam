# Gestor de Axyam

Aplicación de escritorio para gestionar personajes, equipamiento, objetos y materiales del servidor de rol **Axyam**. Permite visualizar estadísticas combinadas (raza + equipo), calcular materiales necesarios para crafteos, tirar dados y administrar usuarios — todo con datos locales sin servidor.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Estilos | Tailwind CSS, shadcn/ui, Lucide icons |
| Backend/Desktop | Electron 33, better-sqlite3 (SQLite local) |
| Bundle | Vite + vite-plugin-electron |
| Empaquetado | electron-builder (portable .exe / NSIS installer) |
| Estado | Zustand |

---

## Instalación y ejecución

### Requisitos
- Node.js 18+
- npm 9+

### Pasos

```bash
git clone https://github.com/Valant-Oni/Gestor-de-Axyam.git
cd Gestor-de-Axyam
npm install
```

### Modo desarrollo

```bash
npm run dev
```

### Build para distribución

```bash
# Portable .exe (recomendado)
npm run dist:portable

# Instalador NSIS
npm run dist
```

El ejecutable se genera en `release/installer/`.

---

## Estructura del proyecto

```
Gestor-de-Axyam/
├── electron/                  # Proceso principal (Node.js)
│   ├── database/              # Conexión SQLite, migraciones, reseñas
│   ├── ipc/                   # Handlers IPC (personajes, items,
│   │                          #   dados, recetas, tags, usuarios)
│   └── main.ts                # Entry point de Electron
├── src/                       # Frontend React
│   ├── components/            # Componentes UI
│   │   ├── characters/        #   Fichas de personaje
│   │   ├── equipment/         #   Equipamiento y estadísticas
│   │   ├── layout/            #   Navegación y layout
│   │   ├── materials/         #   Árbol de materiales
│   │   ├── shared/            #   Componentes reutilizables
│   │   ├── ui/                #   shadcn/ui primitives
│   │   └── user/              #   Gestión de usuarios
│   ├── pages/                 # Páginas de la aplicación
│   ├── stores/                # Estado global (Zustand)
│   └── types/                 # Tipos compartidos
├── dist/                      # Build del frontend
├── dist-electron/             # Build del backend
└── release/installer/         # .exe empaquetado
```

---

## Funcionalidades principales

- **Personajes** — CRUD completo por raza, selección de perks por nivel (10 y 20), restricciones por raza.
- **Objetos** — Catálogo de 700+ ítems con tags, atributos y descripciones extraídos automáticamente. Sistema de marcado y equipamiento con detección de conflictos.
- **Equipamiento** — Vista combinada de estadísticas (base de raza + bonificaciones de equipo). Cálculo automático de penalizaciones por armadura (sigilo, robo, agilidad).
- **Materiales** — Árbol recursivo de materiales necesarios para craftear un objeto. Seguimiento de cantidades poseídas por ruta, con marcado de "ya fabricado" y totales por objeto.
- **Dados** — Tirador de dados con fórmula personalizable (ej. `2d6+3`), historial de tiradas por usuario.
- **Usuarios** — Sistema multiusuario con personajes separados por usuario.
- **Datos 100% locales** — Todo se almacena en SQLite, portable, sin conexión a servidor.

---

## Licencia

MIT
