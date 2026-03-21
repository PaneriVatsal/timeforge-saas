<div align="center">

![Project Banner](https://raw.githubusercontent.com/PaneriVatsal/timeforge-saas/main/project-banner.png)

# TimeForge ⏱️

**A premium, weightless Project & Timesheet SaaS built for the modern era.**

</div>

## ✨ The Vision
TimeForge isn't just a time tracker—it's a high-performance experience. Built with **React**, **Supabase**, and **GSAP**, it brings professional-grade motion design and glassmorphic aesthetics to the world of productivity tools.

## 🎨 Design Philosophy
- **Weightless Experience**: Floating cards, translucent surfaces (`backdrop-filter`), and deep, soft diffused shadows.
- **Motion-First Flow**: Staggered entrances, smooth GSAP transitions (ease-out), and subtle parallax effects. No instant snapping.
- **Single-Handed UX**: Mobile-first design with bottom-anchored navigation optimized for one-handed use on the go.

## 🛠️ Tech Stack
- **Frontend Core**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Motion Engine**: [GSAP](https://gsap.com/) (GreenSock) for buttery-smooth animations.
- **Backend Infrastructure**: [Supabase](https://supabase.com/) for Auth, Real-time DB, and Row-Level Security.
- **Adaptive UI**: Vanilla CSS with custom glassmorphism layers and [Lucide React](https://lucide.dev/) for iconography.

## 🚀 Quick Start

### Installation
1.  **Clone & Install**:
    ```bash
    git clone https://github.com/PaneriVatsal/timeforge-saas.git
    cd timeforge-saas
    npm install
    ```
2.  **Environment Setup**:
    Create a `.env` in the root and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```
3.  **Launch**:
    ```bash
    npm run dev
    ```

## 🏗️ Technical Resources
For detailed motion protocols, internal design tokens, and database health check commands, refer to the [CLAUDE.md](./CLAUDE.md) guide.

---
Built with ❤️ for high-performing teams by **[PaneriVatsal](https://github.com/PaneriVatsal)**
