import { Fragment, type ReactNode } from "react";
import { render } from "@react-email/render";
import { Html, Head, Body, Container, Section, Row, Column, Img, Text, Hr, Button } from "@react-email/components";
import type { EmailComponent } from "@/store/useEmailStore";

const TEXT_PRIMARY = "#1B2A4A";
const BORDER = "#DDE1E6";
const SURFACE = "#FFFFFF";
const BG = "#F2F4F6";

function nodeToElement(node: EmailComponent): ReactNode {
  switch (node.type) {
    case "section":
      return (
        <Section key={node.id} style={{ margin: "16px 0" }}>
          {(node.children || []).map((child) => nodeToElement(child))}
        </Section>
      );

    case "grid": {
      const children = node.children || [];
      return (
        <Row key={node.id} style={{ margin: "16px 0" }}>
          {children.map((child) => (
            <Column key={child.id} style={{ padding: "0 8px", verticalAlign: "top" }}>
              {nodeToElement(child)}
            </Column>
          ))}
        </Row>
      );
    }

    case "text":
      return (
        <Text
          key={node.id}
          style={{
            color: node.style?.color || TEXT_PRIMARY,
            fontSize: node.style?.fontSize || "14px",
            fontWeight: node.style?.fontWeight || "400",
            textAlign: (node.style?.textAlign as "left" | "center" | "right") || "left",
            margin: "4px 0",
          }}
        >
          {node.content}
        </Text>
      );

    case "image":
      if (!node.src) return null;
      return (
        <Img
          key={node.id}
          src={node.src}
          alt={node.content || "Email image"}
          width="100%"
          style={{ borderRadius: 6, display: "block", maxWidth: "100%", margin: "8px 0" }}
        />
      );

    case "button":
      return (
        <Row key={node.id} style={{ margin: "16px 0" }}>
          <Column align="left">
            <Button
              href="#"
              style={{
                backgroundColor: "#2563EB",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: 6,
                fontSize: 14,
                display: "inline-block",
              }}
            >
              {node.content}
            </Button>
          </Column>
        </Row>
      );

    case "divider":
      return <Hr key={node.id} style={{ borderColor: BORDER, margin: "24px 0" }} />;

    case "spacer":
      return <Section key={node.id} style={{ height: node.style?.height || "24px" }} />;

    case "social":
      return null;

    default:
      return null;
  }
}

function EmailDocument({ structure }: { structure: EmailComponent[] }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: BG, fontFamily: "sans-serif", padding: "24px 0", margin: 0 }}>
        <Container
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            padding: 32,
            maxWidth: 600,
            width: "100%",
          }}
        >
          {structure.map((node) => (
            <Fragment key={node.id}>{nodeToElement(node)}</Fragment>
          ))}
        </Container>
      </Body>
    </Html>
  );
}

export function renderEmailStructureToHtml(structure: EmailComponent[]) {
  return render(<EmailDocument structure={structure} />);
}
