import React, { Component, ComponentType, PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ErrorFallback, ErrorFallbackProps } from "@/components/ErrorFallback";

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
  label?: string;
  inline?: boolean;
}>;

type ErrorBoundaryState = { error: Error | null; retryCount: number };

/**
 * Global error boundary — wraps the entire app or large sections.
 * Catches runtime JS errors, logs them, and shows a recovery UI.
 * Uses class component because React error boundaries require lifecycle methods.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, retryCount: 0 };

  static defaultProps: { FallbackComponent: ComponentType<ErrorFallbackProps> } = {
    FallbackComponent: ErrorFallback,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    // Safe logging — never throws
    try {
      const label = this.props.label ? `[${this.props.label}]` : "[App]";
      console.error(`${label} Uncaught error:`, error.message);
      if (__DEV__) console.error("Stack:", info.componentStack);
    } catch {}

    if (typeof this.props.onError === "function") {
      try { this.props.onError(error, info.componentStack); } catch {}
    }
  }

  resetError = (): void => {
    this.setState(prev => ({ error: null, retryCount: prev.retryCount + 1 }));
  };

  render() {
    const { error } = this.state;
    const { FallbackComponent, inline, label, children } = this.props;

    if (error) {
      // Inline mode — small card instead of full screen
      if (inline) {
        return (
          <View style={inlineStyles.box}>
            <Text style={inlineStyles.emoji}>⚠️</Text>
            <Text style={inlineStyles.title}>
              {label ? `${label} failed to load` : "Something went wrong"}
            </Text>
            <Pressable style={inlineStyles.btn} onPress={this.resetError}>
              <Text style={inlineStyles.btnText}>Tap to retry</Text>
            </Pressable>
          </View>
        );
      }

      if (FallbackComponent) {
        return <FallbackComponent error={error} resetError={this.resetError} />;
      }
    }

    return children;
  }
}

const inlineStyles = StyleSheet.create({
  box: {
    padding: 20,
    margin: 12,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.06)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    alignItems: "center",
    gap: 8,
  },
  emoji: { fontSize: 28 },
  title: { fontSize: 13, color: "#9BA3AF", textAlign: "center" },
  btn: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnText: { fontSize: 13, color: "#EF4444", fontWeight: "600" },
});
