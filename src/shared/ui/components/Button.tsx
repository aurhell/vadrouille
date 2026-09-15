import { styled, Spinner, XStack, YStack } from 'tamagui';
import { Body } from './Text';

const Frame = styled(YStack, {
  name: 'Button',
  role: 'button',
  focusable: true,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: '$2',
  cursor: 'pointer',
  transition: 'fast',
  pressStyle: { scale: 0.97 },

  variants: {
    variant: {
      /** primary — one per screen, the action that moves the flow forward */
      primary: {
        backgroundColor: '$accent',
        borderRadius: '$round',
        shadowColor: '$accent',
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        pressStyle: { backgroundColor: '$accentPress', scale: 0.97 },
      },
      /** secondary — soft accent wash, safe to repeat in a row */
      secondary: {
        backgroundColor: '$accentSoft',
        borderRadius: '$4',
        pressStyle: { opacity: 0.8, scale: 0.98 },
      },
      /** dashed — additive actions ("Ajouter un chien") */
      dashed: {
        backgroundColor: 'transparent',
        borderRadius: '$4',
        borderWidth: 2.5,
        borderStyle: 'dashed',
        borderColor: '$warning',
        pressStyle: { backgroundColor: '$accentSoft', scale: 0.98 },
      },
    },
    size: {
      lg: { minHeight: 56, paddingHorizontal: '$6' },
      md: { minHeight: 48, paddingHorizontal: '$5' },
      /** never below 44 — see accessibility rules in the doc page */
      sm: { minHeight: 44, paddingHorizontal: '$4' },
    },
    full: { true: { alignSelf: 'stretch' } },
    disabled: { true: { opacity: 0.45, pressStyle: { scale: 1 } } },
  } as const,

  defaultVariants: { variant: 'primary', size: 'lg' },
});

type ButtonProps = React.ComponentProps<typeof Frame> & {
  children?: React.ReactNode;
  loading?: boolean;
  /** leading emoji or icon element */
  icon?: React.ReactNode;
};

const labelTone = {
  primary: 'inverse',
  secondary: 'accent',
  dashed: 'accent',
} as const;

export function Button({ children, loading, icon, ...props }: ButtonProps) {
  const variant = (props.variant ?? 'primary') as keyof typeof labelTone;
  return (
    <Frame {...props} aria-busy={loading}>
      {loading ? (
        <Spinner size="small" color={variant === 'primary' ? '$accentText' : '$accent'} />
      ) : (
        <XStack alignItems="center" gap="$2">
          {icon}
          <Body
            size="lg"
            fontWeight="800"
            tone={labelTone[variant]}
            color={variant === 'primary' ? '$accentText' : undefined}
          >
            {children}
          </Body>
        </XStack>
      )}
    </Frame>
  );
}

export const ButtonFrame = Frame;
