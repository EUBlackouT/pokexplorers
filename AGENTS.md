# Pokémon Explorers - Project Guidelines

This file contains persistent rules and design preferences for the Pokémon Explorers project. All future modifications must adhere to these guidelines.

## 1. Visual Identity & Aesthetics
- **App Name**: The project is named **"Pokémon Explorers"**. Never rename it back to "Rift Explorers".
- **Main Menu Background**: 
    - **STRICT RULE**: Never use real-life photos or realistic textures.
    - **Style**: Must be 2D anime-style Pokémon landscapes (cel-shaded, vibrant colors).
    - **Implementation**: The background is currently set to a **beautiful atmospheric Pokémon-style gradient** (deep forest greens and magical glows). This ensures a high-quality, immersive look that works for everyone (including friends) without the risk of real-life photos or broken image links. AI generation has been removed to maintain this stable aesthetic.
- **Typography**: The main title must use the classic Pokémon color scheme:
    - **Fill**: Yellow (`#ffcb05`)
    - **Stroke**: Blue (`#3c5aa6`)
    - **Style**: Italic, black weight, with a heavy blue shadow.

## 2. Audio & Music
- **Genre**: Music must be Pokémon-esque (8-bit adventure, cinematic orchestral, or intense battle themes). **NO ROCK MUSIC**.
- **Tracks**:
    - **Menu**: 8-bit Adventure theme.
    - **Overworld**: Orchestral Adventure theme.
    - **Battle**: Intense Battle theme.
- **Robustness**: 
    - Always use the `playBGM` function in `soundService.ts`.
    - Always clear the previous audio source (`bgMusic.src = ""`) before switching to prevent "media resource not suitable" errors.
    - Always provide a stable fallback URL (e.g., SoundHelix) in case the primary track fails to load.

## 3. Technical Constraints
- **Game Loop**: Use `requestAnimationFrame` for game mechanics and animations where possible.
- **Error Handling**: Use the `handleFirestoreError` pattern for all database operations (if Firebase is enabled).
- **Icons**: Use `lucide-react` for all UI icons.
