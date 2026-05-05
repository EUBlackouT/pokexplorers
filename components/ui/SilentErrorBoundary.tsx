import React from 'react';

/**
 * SilentErrorBoundary
 *
 * A narrowly scoped error boundary intended to be wrapped around purely
 * visual / cosmetic UI layers (battle FX, particle bursts, popup chips,
 * etc.). When a child throws during render it:
 *   - swallows the error so it doesn't unmount its parent siblings,
 *   - logs it once with a contextual `tag` so we still see the bug,
 *   - renders nothing in place of the broken subtree.
 *
 * This is NOT a substitute for fixing the underlying bug -- it just
 * prevents a single missing field in (e.g.) BattleFxOverlay from
 * blanking the entire battle scene mid-turn and softlocking the
 * player. Use sparingly and only for non-essential UI.
 *
 * NOTE on implementation: this project intentionally has no `@types/react`
 * installed (React 19's bundled .d.ts isn't picked up by the project's
 * tsconfig). That breaks the usual `extends React.Component<P,S>` pattern
 * because TS can't see the inherited `props`/`state`/`setState`. We work
 * around that by declaring those members explicitly and asserting the
 * `React.Component` constructor type so the class still behaves as a
 * proper React error boundary at runtime.
 */
interface Props {
    /** Human-readable label included in the console error so we know which boundary tripped. */
    tag: string;
    children: React.ReactNode;
    /** Optional fallback. Defaults to `null` (render nothing). */
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
}

const ReactComponent = (React as any).Component as {
    new <P, S>(props: P): {
        props: P;
        state: S;
        setState: (s: Partial<S>) => void;
    };
};

export class SilentErrorBoundary extends ReactComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: { componentStack?: string }): void {
        console.error(
            `[SilentErrorBoundary:${this.props.tag}] suppressed`,
            error,
            info?.componentStack,
        );
    }

    componentDidUpdate(prevProps: Props): void {
        // If the children identity changes (e.g. battle ends, then a new
        // battle starts), reset so the boundary is willing to render
        // again. Otherwise a single crash would permanently hide that
        // overlay for the rest of the session.
        if (prevProps.children !== this.props.children && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }

    render() {
        if (this.state.hasError) return this.props.fallback ?? null;
        return this.props.children;
    }
}
