import { Input as TamaguiInput, YStack, styled } from 'tamagui';
import { Body, Label } from './Text';

const Field = styled(TamaguiInput, {
  name: 'Field',
  backgroundColor: '$backgroundStrong',
  borderRadius: '$3',
  borderWidth: 2,
  borderColor: 'transparent',
  color: '$color',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: 16,
  minHeight: '$control',
  paddingHorizontal: '$4',
  placeholderTextColor: '$colorFaint',
  focusStyle: { borderColor: '$accent' },
  variants: {
    state: {
      default: {},
      filled: { borderColor: '$warning' },
      error: { borderColor: '$danger' },
    },
    /** big single-value fields: pseudo, time — named `large`, not `display`, which collides
     * with the real CSS `display` style prop */
    large: {
      true: { fontFamily: '$heading', fontWeight: '700', fontSize: 20, minHeight: 60 },
    },
  } as const,
  defaultVariants: { state: 'default' },
});

export interface TextFieldProps extends React.ComponentProps<typeof Field> {
  label?: string;
  /** helper line under the field; tone follows \state\ */
  helper?: string;
}

export function TextField({ label, helper, ...props }: TextFieldProps) {
  const tone = props.state === 'error' ? '$danger' : '$success';
  return (
    <YStack gap="$2">
      {label ? <Label>{label}</Label> : null}
      <Field {...props} />
      {helper ? (
        <Body size="xs" fontWeight="600" color={tone}>
          {helper}
        </Body>
      ) : null}
    </YStack>
  );
}

export const InputFrame = Field;
