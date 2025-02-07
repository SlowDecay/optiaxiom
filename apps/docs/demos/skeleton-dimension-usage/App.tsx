import { Flex, Grid, Heading, Skeleton, Text } from "@optiaxiom/react";

function Demo({ loading }: { loading?: boolean }) {
  return (
    <Flex>
      <Heading>{loading ? <Skeleton /> : "h1"}</Heading>
      <Heading variant="h3">{loading ? <Skeleton /> : "h3"}</Heading>
      <Text>{loading ? <Skeleton /> : "body"}</Text>
    </Flex>
  );
}

export function App() {
  return (
    <Grid cols="2">
      <Demo loading />
      <Demo />
    </Grid>
  );
}
