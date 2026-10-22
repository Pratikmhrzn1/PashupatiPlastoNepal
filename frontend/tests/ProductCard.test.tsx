import { describe, it, expect } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import ProductCard from "@/features/products/ProductCard";
import { LanguageProvider } from "@/i18n/LanguageProvider";

const renderCard = (props: ComponentProps<typeof ProductCard>) =>
  render(<ProductCard {...props} />, { wrapper: LanguageProvider });

describe("ProductCard (component layer)", () => {
  const props = {
    id: "pp-001",
    name: "HDPE Plastic Bags",
    price: "NPR 2.50 / piece",
    description: "Durable, lightweight HDPE bags for packaging and retail use.",
  };

  it("renders the product name, price, and description", () => {
    renderCard(props);
    expect(screen.getByRole("heading", { name: props.name })).toBeInTheDocument();
    expect(screen.getByText(props.price)).toBeInTheDocument();
    expect(screen.getByText(props.description)).toBeInTheDocument();
  });

  it("renders a placeholder when no image is provided", () => {
    const { container } = renderCard(props);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders an img when an image URL is provided", () => {
    renderCard({ ...props, image: "/images/hero-640.webp" });
    expect(screen.getByRole("img", { name: props.name })).toBeInTheDocument();
  });

  it("shows the sold count only when provided", () => {
    const { rerender, queryByText } = renderCard(props);
    expect(queryByText(/sold/)).toBeNull();

    rerender(<ProductCard {...props} soldCount={2100} />, {
      wrapper: LanguageProvider,
    });
    expect(queryByText("2,100 sold")).toBeInTheDocument();
  });
});
