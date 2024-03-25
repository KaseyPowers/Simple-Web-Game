// import dependencies
import React from "react";

import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("Landing Page", () => {
  test("renders succesfully", () => {
    render(<Page />);
  });

  test("has create button", () => {
    render(<Page />);
    expect(screen.getByText("Create Room")).toHaveRole("button");
  });
});
