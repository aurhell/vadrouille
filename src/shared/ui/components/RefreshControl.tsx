import { RefreshControl as NativeRefreshControl, useColorScheme } from 'react-native';
import { palette } from '../tokens';

export interface RefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Branded pull-to-refresh spinner for FlatList's `refreshControl` prop. Native RefreshControl
 * doesn't allow swapping the spinner glyph itself for custom art — the accent tint plus a
 * playful title (iOS only; Android shows just the tinted ring) is the "juice" available
 * within that constraint. Pair with `usePullToRefresh` for the min-visible-duration + haptic
 * completion tick.
 */
export function RefreshControl({ refreshing, onRefresh }: RefreshControlProps) {
  const dark = useColorScheme() === 'dark';
  const tint = dark ? palette.amber500 : palette.coral500;
  const titleColor = dark ? palette.sand400 : palette.brown500;

  return (
    <NativeRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={tint}
      colors={[tint]}
      title="Ça vadrouille…"
      titleColor={titleColor}
    />
  );
}
