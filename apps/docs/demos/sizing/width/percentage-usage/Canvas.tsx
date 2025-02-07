import { Box, Flex } from "@optiaxiom/react";
import {
  Children,
  type ComponentPropsWithRef,
  type ReactNode,
  cloneElement,
  isValidElement,
} from "react";

import { Item } from "../Item";

export const Canvas = ({ children }: { children: ReactNode }) => (
  <Flex>
    {Children.toArray(children)
      .filter(isValidElement<ComponentPropsWithRef<typeof Flex>>)
      .map((child, index) =>
        cloneElement(
          child,
          { key: index },
          Children.toArray(child.props.children)
            .filter(isValidElement<ComponentPropsWithRef<typeof Box>>)
            .map((item, index) => <Item key={index}>{item}</Item>),
        ),
      )}
  </Flex>
);
