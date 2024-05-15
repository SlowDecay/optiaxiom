import { Box, Stack, Text } from "@optiaxiom/react";
import { type ComponentPropsWithRef, type ReactElement } from "react";

export const Item = ({
  children,
}: {
  children: ReactElement<ComponentPropsWithRef<typeof Box>>;
}) => (
  <Stack alignItems="center" gap="8">
    <Box
      borderColor="purple.500"
      display="grid"
      placeItems="center"
      px="8"
      py="16"
      {...children.props}
    >
      <Text fontFamily="mono" fontWeight="600" textAlign="center">
        {children.props.children}
      </Text>
    </Box>
  </Stack>
);