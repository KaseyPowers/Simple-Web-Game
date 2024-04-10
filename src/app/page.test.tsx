// import dependencies
import React from "react";

import { render, screen } from "@testing-library/react";
import Page from "./page";

// mocking setup
jest.mock("next/navigation");
jest.mock("~/socket_io/client_utils");

describe("Landing Page", () => {
  it("renders succesfully", () => {
    render(<Page />);
  });

  it("has create button", () => {
    render(<Page />);
    expect(screen.getByText("Create Room")).toHaveRole("button");
  });
});
